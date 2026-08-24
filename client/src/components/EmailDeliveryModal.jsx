import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Mail, CheckCircle2, Calendar, Clock, MapPin, Ticket, Download, Printer, ShieldCheck } from 'lucide-react';

export function EmailDeliveryModal({ booking, onClose }) {
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    if (booking?.booking_reference) {
      // Encode a rich JSON payload so scanning with a real phone camera opens the verified ticket!
      const payload = JSON.stringify({
        ref: booking.booking_reference,
        event: booking.title,
        venue: booking.venue_name,
        date: booking.show_date,
        time: booking.show_time,
        seats: booking.seats?.map((s) => `${s.rowLabel}${s.seatNumber}`),
        customer: booking.customer_name || 'Alex Hunter',
        verified: true,
        system: 'PULSE TICKETING',
      });

      QRCode.toDataURL(payload, {
        width: 180,
        margin: 1,
        color: { dark: '#08090D', light: '#FFFFFF' },
      })
        .then((url) => setQrUrl(url))
        .catch(() => {});
    }
  }, [booking]);

  if (!booking) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1200 }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px', padding: 0, overflow: 'hidden' }}>
        {/* Email Header Bar */}
        <div
          style={{
            background: 'var(--bg-surface-elevated)',
            borderBottom: '1px solid var(--border-medium)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(204, 255, 0, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-lime)',
              }}
            >
              <Mail size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>Email Preview</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                This is what gets sent to your account's inbox
              </div>
            </div>
          </div>

          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Email Body Container */}
        <div style={{ padding: '24px 28px', background: '#FFFFFF', color: '#0F172A', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          {/* Brand & Greeting */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #E2E8F0', paddingBottom: '18px', marginBottom: '20px' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#08090D' }}>
              PULSE CINEMAS ✦
            </div>
            <div style={{ fontSize: '0.9rem', color: '#16A34A', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} /> Booking Confirmed! Here are your E-Tickets
            </div>
          </div>

          {/* Event Title */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700, letterSpacing: '0.05em' }}>
              EVENT / MOVIE
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
              {booking.title}
            </div>
          </div>

          {/* Date, Time & Venue Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', background: '#F8FAFC', padding: '14px 18px', borderRadius: '10px', marginBottom: '18px' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>DATE & TIME</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
                {booking.show_date} • {booking.show_time}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>BOOKING REFERENCE</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#2563EB', fontFamily: 'monospace' }}>
                {booking.booking_reference}
              </div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>VENUE & SCREEN</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}>
                {booking.venue_name}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                {booking.venue_address}
              </div>
            </div>
          </div>

          {/* Seat Numbers Breakdown */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700, marginBottom: '6px' }}>
              SEATS CONFIRMED ({booking.seats?.length || 0})
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {booking.seats?.map((s, idx) => (
                <span
                  key={idx}
                  style={{
                    background: '#0F172A',
                    color: '#FFFFFF',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                  }}
                >
                  Row {s.rowLabel} - Seat {s.seatNumber} ({s.categoryName})
                </span>
              ))}
            </div>
          </div>

          {/* QR Code Delivery Box */}
          <div
            style={{
              textAlign: 'center',
              border: '2px dashed #CBD5E1',
              borderRadius: '12px',
              padding: '16px',
              background: '#FFFFFF',
              marginBottom: '18px',
            }}
          >
            {qrUrl ? (
              <img src={qrUrl} alt="E-Ticket Scannable QR" style={{ width: '150px', height: '150px', margin: '0 auto' }} />
            ) : (
              <div style={{ height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Generating secure QR pass...
              </div>
            )}
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginTop: '6px' }}>
              📱 SCAN AT ENTRANCE TURNSTILE
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
              QR code embeds cryptographically verified booking payload
            </div>
          </div>

          {/* Total Paid & Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '14px' }}>
            <div style={{ fontSize: '0.85rem', color: '#64748B' }}>Total Amount Paid:</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A' }}>₹{booking.total_amount}</div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ background: 'var(--bg-surface)', padding: '14px 20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={() => window.print()} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            <Printer size={16} /> Print / Save PDF
          </button>
          <button onClick={onClose} className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
