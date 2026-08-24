const sgMail = require('@sendgrid/mail');
const QRCode = require('qrcode');
const { pool } = require('../db/pool');
const { issueOfferToken } = require('./waitlistService');

const MAX_ATTEMPTS = 5;

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Names and event titles are user/organiser-controlled text, not markup —
// escape before dropping them into an HTML email body.
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function buildBookingConfirmationEmail(outboxRow) {
  const { rows } = await pool.query(
    `SELECT b.booking_reference, b.total_amount, u.email, u.name, e.title, s.show_date, s.show_time
     FROM bookings b
     JOIN users u ON u.id = b.customer_id
     JOIN shows s ON s.id = b.show_id
     JOIN events e ON e.id = s.event_id
     WHERE b.id = $1`,
    [outboxRow.booking_id]
  );
  const d = rows[0];
  if (!d) return null;

  // QR encodes ONLY the opaque booking reference, never raw seat/customer data.
  const qrDataUrl = await QRCode.toDataURL(d.booking_reference);

  return {
    to: d.email,
    subject: `Booking confirmed: ${d.title}`,
    html: `
      <p>Hi ${escapeHtml(d.name)},</p>
      <p>Your booking for <strong>${escapeHtml(d.title)}</strong> on ${d.show_date} at ${d.show_time} is confirmed.</p>
      <p>Booking reference: <strong>${d.booking_reference}</strong></p>
      <p>Total paid: ₹${d.total_amount}</p>
      <img src="${qrDataUrl}" alt="Booking QR code" />
    `,
  };
}

async function buildWaitlistOfferEmail(outboxRow) {
  const { rows } = await pool.query(
    `SELECT w.id, w.status, w.offer_expires_at, u.email, u.name, e.title, s.show_date, s.show_time
     FROM waitlist_entries w
     JOIN users u ON u.id = w.customer_id
     JOIN shows s ON s.id = w.show_id
     JOIN events e ON e.id = s.event_id
     WHERE w.id = $1`,
    [outboxRow.waitlist_entry_id]
  );
  const d = rows[0];
  if (!d) return null;

  // The sweep only runs every ~10s, so by send-time this offer could already
  // be gone (confirmed some other way, or already expired). Sending a dead
  // link would be actively wrong, not just late.
  if (d.status !== 'offered') return { skip: true };

  const token = issueOfferToken(d.id, d.offer_expires_at);
  // Points at the frontend's offer-claim screen (which reads ?offerToken=
  // and confirms it), not the backend's POST-only confirm endpoint directly
  // — a browser can't POST just by following a link.
  const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const link = `${baseUrl}/?offerToken=${token}`;

  return {
    to: d.email,
    subject: `A seat is available: ${d.title}`,
    html: `
      <p>Hi ${escapeHtml(d.name)},</p>
      <p>A seat just opened up for <strong>${escapeHtml(d.title)}</strong> on ${d.show_date} at ${d.show_time}.</p>
      <p>Complete your booking before it expires: <a href="${link}">${link}</a></p>
    `,
  };
}

async function sendPendingEmails() {
  const { rows: pending } = await pool.query(
    `SELECT * FROM email_outbox WHERE status = 'pending' ORDER BY created_at LIMIT 20`
  );

  let sent = 0;
  let failed = 0;

  for (const outboxRow of pending) {
    try {
      const content = outboxRow.type === 'booking_confirmation'
        ? await buildBookingConfirmationEmail(outboxRow)
        : await buildWaitlistOfferEmail(outboxRow);

      if (!content) {
        throw new Error('could not build email content (referenced record missing)');
      }
      if (content.skip) {
        await pool.query(`UPDATE email_outbox SET status = 'sent' WHERE id = $1`, [outboxRow.id]);
        continue;
      }
      if (!process.env.SENDGRID_API_KEY) {
        throw new Error('SENDGRID_API_KEY not configured');
      }

      await sgMail.send({
        to: content.to,
        from: process.env.EMAIL_FROM,
        subject: content.subject,
        html: content.html,
      });

      await pool.query(`UPDATE email_outbox SET status = 'sent' WHERE id = $1`, [outboxRow.id]);
      sent += 1;
    } catch (err) {
      const attempts = outboxRow.attempts + 1;
      const status = attempts >= MAX_ATTEMPTS ? 'failed' : 'pending';
      await pool.query(
        `UPDATE email_outbox SET attempts = $2, status = $3, last_error = $4 WHERE id = $1`,
        [outboxRow.id, attempts, status, err.message]
      );
      failed += 1;
    }
  }

  return { sent, failed };
}

module.exports = { sendPendingEmails };
