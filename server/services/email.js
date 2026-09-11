import nodemailer from 'nodemailer';
import { query } from '../database.js';
import logger from '../logger.js';

async function getEmailConfig() {
  try {
    const { rows } = await query("SELECT value FROM site_settings WHERE key = 'gateways_config'");
    if (rows && rows.length > 0) {
      const config = JSON.parse(rows[0].value)?.email;
      if (config && config.smtpHost && (config.enabled !== false || config.enableOrderConfirmation)) {
        return {
          transporter: nodemailer.createTransport({
            host: config.smtpHost,
            port: parseInt(config.smtpPort || '587'),
            secure: parseInt(config.smtpPort) === 465,
            auth: config.smtpUser ? {
              user: config.smtpUser,
              pass: config.smtpPass || ''
            } : undefined
          }),
          from: `"${config.senderName || 'Macqrosa Luxury Atelier'}" <${config.senderEmail || config.smtpUser || 'noreply@macqrosa.com'}>`,
          isConfigured: true
        };
      }
    }
  } catch (err) {
    logger.warn('Failed to load email config from site_settings, checking env...', { error: err.message });
  }

  // Fallback to process.env
  const isEnvConfigured = Boolean(process.env.SMTP_USER && process.env.SMTP_HOST);
  return {
    transporter: nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.example.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      } : undefined,
    }),
    from: process.env.EMAIL_FROM || '"Macqrosa Luxury Atelier" <noreply@macqrosa.com>',
    isConfigured: isEnvConfigured
  };
}

/**
 * Send an order confirmation email.
 */
export async function sendOrderConfirmation(order) {
  const { transporter, from, isConfigured } = await getEmailConfig();
  if (!isConfigured) {
    logger.warn('SMTP not configured — skipping order confirmation email');
    return;
  }

  const itemsHtml = order.items.map(it =>
    `<tr>
      <td style="padding:8px;border-bottom:1px solid #eee;">${it.title}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${it.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${it.total.toFixed(2)}</td>
    </tr>`
  ).join('');

  const html = `
    <div style="font-family:'Georgia',serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
      <div style="text-align:center;padding:30px 0;border-bottom:2px solid #c9a96e;">
        <h1 style="font-size:28px;letter-spacing:3px;color:#c9a96e;margin:0;">MACQROSA</h1>
        <p style="color:#888;font-size:12px;letter-spacing:2px;margin-top:5px;">LUXURY ATELIER • PLACE VENDÔME</p>
      </div>
      <div style="padding:30px 20px;">
        <h2 style="font-size:20px;color:#333;">Merci, ${order.customerName}</h2>
        <p style="color:#666;line-height:1.6;">Your order <strong>${order.orderNumber}</strong> has been confirmed and is being prepared with the utmost care in our atelier.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <thead>
            <tr style="background:#f8f6f3;">
              <th style="padding:10px 8px;text-align:left;">Item</th>
              <th style="padding:10px 8px;text-align:center;">Qty</th>
              <th style="padding:10px 8px;text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="text-align:right;padding:10px 0;border-top:2px solid #c9a96e;">
          <p style="font-size:18px;"><strong>Total: $${order.totalAmount.toFixed(2)}</strong></p>
        </div>
        <p style="color:#666;font-size:14px;margin-top:20px;">Tracking: <strong>${order.trackingNumber}</strong></p>
      </div>
      <div style="text-align:center;padding:20px;background:#f8f6f3;color:#888;font-size:11px;">
        <p>© ${new Date().getFullYear()} Macqrosa — Place Vendôme, Paris</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from,
      to: order.customerEmail,
      subject: `Macqrosa — Order Confirmation ${order.orderNumber}`,
      html,
    });
    logger.info(`Order confirmation email sent to ${order.customerEmail}`);
  } catch (err) {
    logger.error('Failed to send order confirmation email', { error: err.message });
  }
}

/**
 * Send a password reset email.
 */
export async function sendPasswordReset(email, resetToken) {
  const { transporter, from, isConfigured } = await getEmailConfig();
  if (!isConfigured) {
    logger.warn('SMTP not configured — skipping password reset email');
    return;
  }

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  const html = `
    <div style="font-family:'Georgia',serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
      <div style="text-align:center;padding:30px 0;border-bottom:2px solid #c9a96e;">
        <h1 style="font-size:28px;letter-spacing:3px;color:#c9a96e;margin:0;">MACQROSA</h1>
      </div>
      <div style="padding:30px 20px;">
        <h2>Password Reset Request</h2>
        <p style="color:#666;line-height:1.6;">You requested a password reset for your Macqrosa account. Click the link below to set a new password:</p>
        <div style="text-align:center;margin:30px 0;">
          <a href="${resetUrl}" style="background:#c9a96e;color:#fff;padding:14px 32px;text-decoration:none;font-size:14px;letter-spacing:1px;border-radius:2px;">Reset Password</a>
        </div>
        <p style="color:#999;font-size:12px;">If you did not request this, please disregard this email. This link expires in 1 hour.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject: 'Macqrosa — Password Reset',
      html,
    });
    logger.info(`Password reset email sent to ${email}`);
  } catch (err) {
    logger.error('Failed to send password reset email', { error: err.message });
  }
}

/**
 * Send a templated email — used by the notifications system.
 */
export async function sendTemplatedEmail(htmlBody, recipientEmail, subject) {
  const { transporter, from, isConfigured } = await getEmailConfig();
  if (!isConfigured) {
    logger.warn('SMTP not configured — skipping templated email');
    return;
  }

  try {
    await transporter.sendMail({
      from,
      to: recipientEmail,
      subject: subject || 'Macqrosa — Notification',
      html: htmlBody,
    });
    logger.info(`Templated email sent to ${recipientEmail}`);
  } catch (err) {
    logger.error('Failed to send templated email', { error: err.message, to: recipientEmail });
    throw err;
  }
}

/**
 * Send password reset email.
 */
export async function sendPasswordResetEmail(email, token) {
  const { transporter, from, isConfigured } = await getEmailConfig();
  if (!isConfigured) {
    logger.warn(`SMTP not configured — falling back to console log for reset token: ${token}`);
    console.log(`\n\n=== PASSWORD RESET LINK ===\nhttp://localhost:5173/reset-password?token=${token}\n===========================\n`);
    return;
  }

  const resetUrl = `http://localhost:5173/reset-password?token=${token}`;

  const html = `
    <div style="font-family:'Georgia',serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
      <div style="text-align:center;padding:30px 0;border-bottom:2px solid #c9a96e;">
        <h1 style="font-size:28px;letter-spacing:3px;color:#c9a96e;margin:0;">MACQROSA</h1>
        <p style="color:#888;font-size:12px;letter-spacing:2px;margin-top:5px;">LUXURY ATELIER • PLACE VENDÔME</p>
      </div>
      <div style="padding:30px 20px;">
        <h2 style="font-size:20px;color:#333;">Password Reset</h2>
        <p style="color:#666;line-height:1.6;">We received a request to reset the password for your Macqrosa account.</p>
        <p style="color:#666;line-height:1.6;">Click the button below to choose a new password. This link will expire in 1 hour.</p>
        <div style="text-align:center;margin:30px 0;">
          <a href="${resetUrl}" style="background-color:#1a1a1a;color:#fff;padding:12px 24px;text-decoration:none;font-size:14px;letter-spacing:1px;text-transform:uppercase;">Reset Password</a>
        </div>
        <p style="color:#888;font-size:12px;margin-top:30px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject: 'Macqrosa — Password Reset Request',
      html,
    });
    logger.info(`Password reset email sent to ${email}`);
  } catch (err) {
    logger.error('Failed to send password reset email', { error: err.message, email });
  }
}
