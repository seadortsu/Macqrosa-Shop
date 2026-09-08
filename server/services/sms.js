import { query } from '../database.js';
import logger from '../logger.js';

/**
 * Send an SMS notification via the configured SMS gateway (Arkesel, Twilio, Termii)
 */
export async function sendSmsNotification(phone, message) {
  if (!phone || !message) return false;

  try {
    const { rows } = await query("SELECT value FROM site_settings WHERE key = 'gateways_config'");
    if (!rows || rows.length === 0) return false;

    const config = JSON.parse(rows[0].value)?.sms;
    if (!config || !config.enabled || !config.apiKey) {
      logger.info('SMS gateway not enabled or missing API key — skipping SMS.');
      return false;
    }

    const provider = (config.provider || 'arkesel').toLowerCase();
    const senderId = config.senderId || 'MACQROSA';

    logger.info(`Dispatching SMS via [${provider.toUpperCase()}] to ${phone}...`);

    if (provider === 'arkesel') {
      const resp = await fetch('https://sms.arkesel.com/api/v2/sms/send', {
        method: 'POST',
        headers: {
          'api-key': config.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: senderId,
          message: message,
          recipients: [phone]
        })
      });
      const data = await resp.json().catch(() => ({}));
      logger.info('Arkesel SMS response', { data });
      return true;
    } else if (provider === 'termii') {
      const resp = await fetch('https://api.ng.termii.com/api/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: phone,
          from: senderId,
          sms: message,
          type: 'plain',
          channel: 'generic',
          api_key: config.apiKey
        })
      });
      const data = await resp.json().catch(() => ({}));
      logger.info('Termii SMS response', { data });
      return true;
    } else if (provider === 'twilio') {
      // Twilio requires accountSid and authToken
      // In gateways_config: apiKey = Account SID, apiSecret = Auth Token
      const accountSid = config.apiKey;
      const authToken = config.apiSecret;
      if (!accountSid || !authToken) {
        logger.warn('Twilio Account SID or Auth Token missing');
        return false;
      }
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const formBody = new URLSearchParams();
      formBody.append('To', phone);
      formBody.append('From', senderId);
      formBody.append('Body', message);

      const resp = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formBody.toString()
      });
      const data = await resp.json().catch(() => ({}));
      logger.info('Twilio SMS response', { status: resp.status, data });
      return true;
    }

    return false;
  } catch (err) {
    logger.error('SMS Gateway dispatch error', { error: err.message });
    return false;
  }
}

/**
 * Send order confirmation SMS
 */
export async function sendOrderConfirmationSms(order, customerPhone) {
  if (!customerPhone) return;
  const message = `✨ MACQROSA: Merci for your order ${order.orderNumber}. Preparation has begun at our Place Vendôme atelier. Total: $${order.totalAmount.toFixed(2)}. Tracking: ${order.trackingNumber}`;
  return sendSmsNotification(customerPhone, message);
}

/**
 * Send a templated SMS — used by the notifications system.
 */
export async function sendTemplatedSms(message, phone) {
  if (!phone || !message) return;
  return sendSmsNotification(phone, message);
}

