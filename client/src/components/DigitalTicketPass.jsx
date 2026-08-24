import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Calendar, Clock, MapPin, Ticket, Trash2, Printer, Share2, Mail, CheckCircle2, QrCode } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { EmailDeliveryModal } from './EmailDeliveryModal';

export function DigitalTicketPass({ booking, onCancelBooking }) {
  const { addToast } = useToast();
  const [qrUrl, setQrUrl] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (booking?.booking_reference) {
      // Scannable JSON payload that decodes seamlessly on phone camera
      const payload = JSON.stringify({
        ref: booking.booking_reference,
        event: booking.title,
        venue: booking.venue_name,
        date: booking.show_date,
        time: booking.show_time,
        seats: booking.seats?.map((s) => `${s.rowLabel}${s.seatNumber}`),
        holder: booking.customer_name || 'Alex Hunter',
        verified: true,
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

  const handlePrint = () => {
    window.print();
    addToast('🖨️ Opening print dialogue...', 'info');
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`Pulse Ticket: ${booking.title} (${booking.booking_reference}) - Seats: ${booking.seats?.map((s) => `${s.rowLabel}${s.seatNumber}`).join(', ')}`);
      addToast('📋 Ticket reference copied to clipboard!', 'success');
    }
  };

  const executeCancel = async () => {
    setCancelling(true);
    try {
      await onCancelBooking(booking.id);
      addToast('Ticket cancelled. Seat released & cascaded to waitlist queue.', 'info');
      setShowCancelConfirm(false);
    } catch (err) {
      addToast(err.message || 'Cancellation error', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const isCancelled = booking.status === 'cancelled';

  return (
    <>
      <div className="ticket-pass">
        {/* Ticket Header */}
        <div className="ticket-pass-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className={`pill-tag ${booking.type === 'movie' ? 'pill-tag-movie' : 'pill-tag-concert'}`}>
                {booking.type?.toUpperCase() || 'PASS'}
              </span>
              <span className={`pill-tag ${isCancelled ? 'pill-tag-concert' : 'pill-tag-lime'}`}>
                {isCancelled ? 'CANCELLED' : 'CONFIRMED'}
              </span>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, lineHeight: 1.2 }}>
              {booking.title}
            </h3>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              BOOKING REF
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.85rem', color: 'var(--accent-lime)' }}>
              {booking.booking_reference}
            </div>
          </div>
        </div>

        {/* Ticket Body */}
        <div className="ticket-pass-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <Calendar size={13} /> SHOW DATE
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{booking.show_date}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <Clock size={13} /> TIME
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{booking.show_time}</div>
            </div>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <MapPin size={13} /> VENUE LOCATION
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{booking.venue_name || 'PVR INOX Neo-Plex'}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{booking.venue_address || 'Lower Parel, Mumbai'}</div>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <Ticket size={13} /> CONFIRMED SEATS
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
              {booking.seats && booking.seats.length > 0 ? (
                booking.seats.map((s, idx) => (
                  <span key={idx} className="pill-tag pill-tag-lime" style={{ fontSize: '0.8rem' }}>
                    Row {s.rowLabel} - Seat {s.seatNumber} ({s.categoryName})
                  </span>
                ))
              ) : (
                <span className="pill-tag pill-tag-lime">General Reserved Seats</span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Amount Paid:</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
              ₹{booking.total_amount}
            </div>
          </div>
        </div>

        {/* Perforation Notch Divider */}
        <div className="ticket-perforation">
          <div className="ticket-perforation-line" />
        </div>

        {/* QR Code & Barcode Section */}
        <div className="ticket-pass-body" style={{ paddingTop: '8px', textAlign: 'center' }}>
          <div className="ticket-qr-wrap">
            {qrUrl ? (
              <img src={qrUrl} alt="Booking QR Code" style={{ width: '130px', height: '130px' }} />
            ) : (
              <div style={{ width: '130px', height: '130px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Ticket size={32} color="#94A3B8" />
              </div>
            )}
            <div className="ticket-barcode">||| | | |||| || | ||| |||| | |</div>
            <div style={{ fontSize: '0.7rem', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
              SCAN PHONE CAMERA FOR VERIFICATION
            </div>
          </div>

          {/* Ticket Actions */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '18px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowEmailModal(true)}
              className="btn-outline"
              style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '6px' }}
              title="View Delivered Confirmation Email"
            >
              <Mail size={14} color="var(--accent-lime)" /> View Email Ticket
            </button>
            <button onClick={handlePrint} className="btn-icon" title="Print E-Ticket">
              <Printer size={16} />
            </button>
            <button onClick={handleShare} className="btn-icon" title="Copy Reference">
              <Share2 size={16} />
            </button>
            {!isCancelled && onCancelBooking && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="btn-icon"
                title="Cancel Booking & Free Seat"
              >
                <Trash2 size={16} color="var(--accent-pink)" />
              </button>
            )}
          </div>
        </div>

        {/* Cancel Confirmation Modal */}
        {showCancelConfirm && (
          <div className="modal-backdrop" style={{ zIndex: 1200 }}>
            <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Cancel this booking?</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
                This will release your seats. If there is a waitlist for this category, the seats will automatically be offered to the next customer in queue with a 15-minute link.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="btn-secondary"
                  style={{ padding: '10px 18px', fontSize: '0.85rem' }}
                >
                  Keep Ticket
                </button>
                <button
                  onClick={executeCancel}
                  disabled={cancelling}
                  className="btn-danger"
                  style={{ padding: '10px 18px', fontSize: '0.85rem' }}
                >
                  {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Email Delivery Modal */}
      {showEmailModal && (
        <EmailDeliveryModal
          booking={booking}
          onClose={() => setShowEmailModal(false)}
        />
      )}
    </>
  );
}
