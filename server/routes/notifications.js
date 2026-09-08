import { Router } from 'express';
import { query } from '../database.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { sendTemplatedEmail } from '../services/email.js';
import { sendTemplatedSms } from '../services/sms.js';
import logger from '../logger.js';

const router = Router();
router.use(authenticateAdmin);

/* =========================================================================
   TEMPLATE CRUD
   ========================================================================= */

// List all templates
router.get('/templates', async (req, res) => {
  try {
    const { channel } = req.query;
    let sql = 'SELECT * FROM notification_templates';
    const params = [];
    if (channel) {
      sql += ' WHERE channel = $1';
      params.push(channel);
    }
    sql += ' ORDER BY is_default DESC, id ASC';
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('List templates error:', err);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get single template
router.get('/templates/:id', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM notification_templates WHERE id = $1', [Number(req.params.id)]);
    if (rows.length === 0) return res.status(404).json({ error: 'Template not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Create template
router.post('/templates', async (req, res) => {
  try {
    const { name, channel, subject, body } = req.body;
    if (!name || !channel || !body) {
      return res.status(400).json({ error: 'Name, channel, and body are required.' });
    }
    const now = new Date().toISOString();
    const { rows } = await query(`
      INSERT INTO notification_templates (name, channel, subject, body, is_default, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 0, $5, $6)
      RETURNING *
    `, [name, channel, subject || null, body, now, now]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create template error:', err);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Update template
router.put('/templates/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, channel, subject, body } = req.body;

    const { rows: existing } = await query('SELECT * FROM notification_templates WHERE id = $1', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Template not found' });

    const current = existing[0];
    const now = new Date().toISOString();

    await query(`
      UPDATE notification_templates SET
        name = $1, channel = $2, subject = $3, body = $4, updated_at = $5
      WHERE id = $6
    `, [
      name || current.name,
      channel || current.channel,
      subject !== undefined ? subject : current.subject,
      body || current.body,
      now,
      id
    ]);

    const { rows: updated } = await query('SELECT * FROM notification_templates WHERE id = $1', [id]);
    res.json(updated[0]);
  } catch (err) {
    console.error('Update template error:', err);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Delete template
router.delete('/templates/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rows } = await query('SELECT * FROM notification_templates WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Template not found' });
    if (rows[0].is_default) {
      return res.status(400).json({ error: 'Cannot delete a default system template.' });
    }
    await query('DELETE FROM notification_templates WHERE id = $1', [id]);
    res.json({ success: true, message: 'Template deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

/* =========================================================================
   SEND NOTIFICATIONS
   ========================================================================= */

function interpolateTemplate(template, variables) {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || '');
  }
  return result;
}

// Send to selected recipients
router.post('/send', async (req, res) => {
  try {
    const { templateId, recipients, variables } = req.body;
    // recipients = [{ email, phone, name }]
    // variables = { custom key-value pairs for interpolation }

    if (!templateId || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Template ID and at least one recipient are required.' });
    }

    const { rows: tmpl } = await query('SELECT * FROM notification_templates WHERE id = $1', [templateId]);
    if (tmpl.length === 0) return res.status(404).json({ error: 'Template not found' });

    const template = tmpl[0];
    let sentCount = 0;
    let failCount = 0;

    for (const recipient of recipients) {
      const vars = {
        customerName: recipient.name || 'Valued Customer',
        customerEmail: recipient.email || '',
        ...variables
      };

      const body = interpolateTemplate(template.body, vars);
      const subject = template.subject ? interpolateTemplate(template.subject, vars) : '';
      const now = new Date().toISOString();

      try {
        if (template.channel === 'email' && recipient.email) {
          await sendTemplatedEmail(body, recipient.email, subject);
          await query(`
            INSERT INTO notification_logs (template_id, channel, recipient, subject, body_preview, status, sent_at)
            VALUES ($1, 'email', $2, $3, $4, 'sent', $5)
          `, [template.id, recipient.email, subject, body.substring(0, 200), now]);
          sentCount++;
        } else if (template.channel === 'sms' && recipient.phone) {
          await sendTemplatedSms(body, recipient.phone);
          await query(`
            INSERT INTO notification_logs (template_id, channel, recipient, subject, body_preview, status, sent_at)
            VALUES ($1, 'sms', $2, $3, $4, 'sent', $5)
          `, [template.id, recipient.phone, '', body.substring(0, 200), now]);
          sentCount++;
        } else {
          failCount++;
        }
      } catch (sendErr) {
        logger.error('Notification send error for recipient', { recipient, error: sendErr.message });
        await query(`
          INSERT INTO notification_logs (template_id, channel, recipient, subject, body_preview, status, sent_at)
          VALUES ($1, $2, $3, $4, $5, 'failed', $6)
        `, [template.id, template.channel, recipient.email || recipient.phone || 'unknown', subject, body.substring(0, 200), now]);
        failCount++;
      }
    }

    res.json({
      success: true,
      message: `Sent ${sentCount} notification(s). ${failCount > 0 ? `${failCount} failed.` : ''}`,
      sentCount,
      failCount
    });
  } catch (err) {
    console.error('Send notifications error:', err);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});

/* =========================================================================
   NOTIFICATION LOGS
   ========================================================================= */

router.get('/logs', async (req, res) => {
  try {
    const { limit } = req.query;
    const maxRows = Math.min(Number(limit) || 100, 500);
    const { rows } = await query(`
      SELECT nl.*, nt.name as template_name
      FROM notification_logs nl
      LEFT JOIN notification_templates nt ON nl.template_id = nt.id
      ORDER BY nl.sent_at DESC
      LIMIT $1
    `, [maxRows]);
    res.json(rows);
  } catch (err) {
    console.error('Fetch logs error:', err);
    res.status(500).json({ error: 'Failed to fetch notification logs' });
  }
});

export default router;
