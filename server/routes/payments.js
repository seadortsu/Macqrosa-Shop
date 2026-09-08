import { Router } from 'express';
import { query, pool } from '../database.js';
import { optionalCustomer } from '../middleware/auth.js';
import { sendOrderConfirmation } from '../services/email.js';
import { sendOrderConfirmationSms } from '../services/sms.js';
import logger from '../logger.js';

const router = Router();

async function getPaystackConfig() {
  try {
    const { rows } = await query("SELECT value FROM site_settings WHERE key = 'gateways_config'");
    if (rows && rows.length > 0) {
      const parsed = JSON.parse(rows[0].value);
      const paystackSec = parsed?.payment?.paystackSecretKey || parsed?.paystack?.secretKey;
      const currency = parsed?.payment?.paystackCurrency || parsed?.paystack?.currency || 'GHS';
      if (paystackSec) {
        return {
          secretKey: paystackSec,
          currency: currency,
          channels: ['card', 'mobile_money', 'bank']
        };
      }
    }
  } catch (err) {
    logger.warn('Failed to load Paystack config from site_settings, checking env...', { error: err.message });
  }

  return {
    secretKey: process.env.PAYSTACK_SECRET_KEY,
    currency: 'GHS',
    channels: ['card', 'mobile_money', 'bank']
  };
}

/**
 * POST /api/payments/initialize
 * Creates a Paystack transaction and returns the authorization URL.
 * The frontend redirects the user to Paystack to complete payment.
 */
router.post('/initialize', optionalCustomer, async (req, res) => {
  try {
    const { email, amount, orderId, metadata } = req.body;

    if (!email || !amount) {
      return res.status(400).json({ error: 'Email and amount are required.' });
    }

    const paystack = await getPaystackConfig();
    if (!paystack.secretKey) {
      return res.status(503).json({ error: 'Paystack is not configured. Configure it in Admin Settings > Gateways & Integrations.' });
    }

    // Amount in kobo (pesewas for GHS) — Paystack expects the smallest currency unit
    const amountInKobo = Math.round(amount * 100);

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystack.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amountInKobo,
        currency: paystack.currency,
        callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/order-confirmation`,
        metadata: {
          orderId,
          ...metadata,
        },
        channels: paystack.channels,
      }),
    });

    const data = await response.json();

    if (!data.status) {
      logger.error('Paystack initialize failed', { data });
      return res.status(400).json({ error: data.message || 'Failed to initialize payment.' });
    }

    logger.info(`Paystack transaction initialized: ${data.data.reference}`);

    res.json({
      success: true,
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference,
      accessCode: data.data.access_code,
    });
  } catch (err) {
    logger.error('Payment initialization error', { error: err.message });
    res.status(500).json({ error: 'Failed to initialize payment' });
  }
});

/**
 * POST /api/payments/verify
 * Verifies a Paystack transaction reference and finalizes the order.
 */
router.post('/verify', optionalCustomer, async (req, res) => {
  const client = await pool.connect();
  try {
    const { reference, orderId } = req.body;

    if (!reference) {
      return res.status(400).json({ error: 'Transaction reference is required.' });
    }

    const paystack = await getPaystackConfig();
    if (!paystack.secretKey) {
      return res.status(503).json({ error: 'Paystack is not configured. Configure it in Admin Settings > Gateways & Integrations.' });
    }

    // Verify the transaction with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: {
        'Authorization': `Bearer ${paystack.secretKey}`,
      },
    });

    const data = await response.json();

    if (!data.status || data.data.status !== 'success') {
      logger.warn('Paystack verification failed', { reference, paystackStatus: data.data?.status });
      return res.status(400).json({
        error: 'Payment verification failed.',
        paystackStatus: data.data?.status || 'unknown',
      });
    }

    const txn = data.data;
    logger.info(`Paystack payment verified: ${reference}, amount: ${txn.amount / 100} ${txn.currency}`);

    // Update the order payment status
    if (orderId) {
      await client.query('BEGIN');

      await client.query(
        'UPDATE orders SET payment_status = $1, payment_reference = $2, payment_method = $3, updated_at = $4 WHERE id = $5',
        ['paid', reference, `Paystack (${txn.channel || 'card'})`, new Date().toISOString(), orderId]
      );

      // Get order details for email and SMS
      const { rows: orderRows } = await client.query('SELECT * FROM orders WHERE id = $1', [orderId]);
      const order = orderRows[0];

      if (order) {
        const { rows: orderItems } = await client.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);

        // Send confirmation email
        await sendOrderConfirmation({
          orderNumber: order.order_number,
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          totalAmount: parseFloat(order.total_amount),
          trackingNumber: order.tracking_number,
          items: orderItems.map(it => ({
            title: it.product_title,
            quantity: it.quantity,
            total: parseFloat(it.total_price),
          })),
        });

        // Send confirmation SMS if phone exists in shipping address
        try {
          const addr = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address;
          const phone = addr?.phone || order.customer_phone;
          if (phone) {
            await sendOrderConfirmationSms({
              orderNumber: order.order_number,
              totalAmount: parseFloat(order.total_amount),
              trackingNumber: order.tracking_number
            }, phone);
          }
        } catch (e) {
          logger.warn('Error parsing shipping address for SMS notification', { error: e.message });
        }
      }

      await client.query('COMMIT');
    }

    res.json({
      success: true,
      message: 'Payment verified successfully.',
      transaction: {
        reference: txn.reference,
        amount: txn.amount / 100,
        currency: txn.currency,
        channel: txn.channel,
        paidAt: txn.paid_at,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Payment verification error', { error: err.message });
    res.status(500).json({ error: 'Failed to verify payment' });
  } finally {
    client.release();
  }
});

export default router;
