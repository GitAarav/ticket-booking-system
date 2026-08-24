import React, { useState, useEffect } from 'react';
import { offersApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import confetti from 'canvas-confetti';
import { Timer, CheckCircle2, ArrowRight, Ticket, Clock } from 'lucide-react';

function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch (_) {
    return null;
  }
}

export function OfferClaimPage({ setView, initialToken }) {
  const { addToast } = useToast();
  const [tokenInput, setTokenInput] = useState(initialToken || '');
  const [decoded, setDecoded] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [loading, setLoading] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  const handleInspectToken = (token) => {
    setTokenInput(token);
    if (!token.trim()) {
      setDecoded(null);
      return;
    }
    const payload = decodeJwtPayload(token.trim());
    if (payload && payload.purpose === 'waitlist_offer') {
      setDecoded(payload);
      addToast('Offer token recognized.', 'success');
    } else {
      setDecoded(null);
      addToast('This does not look like a valid waitlist offer token', 'error');
    }
  };

  // Arrived via a real offer-link click (?offerToken=... in the URL) — verify immediately
  useEffect(() => {
    if (initialToken) handleInspectToken(initialToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialToken]);

  useEffect(() => {
    if (!decoded?.exp) {
      setSecondsRemaining(0);
      return;
    }
    const update = () => setSecondsRemaining(Math.max(0, decoded.exp - Math.floor(Date.now() / 1000)));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [decoded]);

  const formatCountdown = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const handleClaimOffer = async () => {
    if (!tokenInput.trim()) return;
    setLoading(true);
    try {
      const res = await offersApi.confirmOfferToken(tokenInput.trim());
      confetti({ particleCount: 140, spread: 75, origin: { y: 0.6 }, colors: ['#CCFF00', '#00F0FF', '#FF2E63'] });
      setConfirmedBooking(res.booking);
      setDecoded(null);
      addToast('Waitlist offer redeemed — seat booked!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to claim offer', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '640px', paddingBottom: '60px' }}>
      <div className="glass-panel" style={{ padding: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', gap: '8px', marginBottom: '12px' }}>
            <span className="pill-tag pill-tag-concert">WAITLIST OFFERS</span>
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '8px' }}>Claim a Waitlist Offer</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            When a booking is cancelled, the next person on the waitlist gets a time-limited link by email to claim the seat.
            Paste that link's token below to complete the booking.
          </p>
        </div>

        {!confirmedBooking ? (
          <div>
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Offer Token</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Paste the token from your offer link..."
                  className="form-input"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
                />
                <button type="button" onClick={() => handleInspectToken(tokenInput)} className="btn-secondary" style={{ padding: '0 20px', whiteSpace: 'nowrap' }}>
                  Verify
                </button>
              </div>
            </div>

            {decoded && secondsRemaining > 0 ? (
              <div>
                <div
                  style={{
                    background: secondsRemaining < 180 ? 'rgba(255, 46, 99, 0.15)' : 'rgba(204, 255, 0, 0.12)',
                    border: `1px solid ${secondsRemaining < 180 ? 'var(--accent-pink)' : 'var(--accent-lime)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '14px',
                    marginBottom: '24px',
                  }}
                >
                  <Timer size={26} color={secondsRemaining < 180 ? 'var(--accent-pink)' : 'var(--accent-lime)'} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>OFFER EXPIRES IN</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: secondsRemaining < 180 ? 'var(--accent-pink)' : 'var(--accent-lime)' }}>
                      {formatCountdown(secondsRemaining)}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleClaimOffer}
                  disabled={loading}
                  className="btn-primary"
                  style={{ width: '100%', padding: '16px', fontSize: '1.05rem', background: 'linear-gradient(135deg, var(--accent-lime) 0%, var(--accent-cyan) 100%)', color: '#08090D' }}
                >
                  {loading ? 'Confirming...' : 'Claim & Confirm Booking'}
                  <ArrowRight size={18} />
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-medium)' }}>
                <Clock size={36} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>No offer loaded yet</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 16px auto' }}>
                  To generate a real offer: join a sold-out category's waitlist, then have that booking cancelled — the next
                  person in line gets offered the seat and a confirmation email is queued.
                </p>
                <button onClick={() => setView('explore')} className="btn-secondary" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
                  Browse Shows
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle2 size={56} color="var(--accent-lime)" style={{ margin: '0 auto 16px auto' }} />
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>Booking Confirmed!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
              Reference: <strong>{confirmedBooking.booking_reference}</strong> • Total: ₹{confirmedBooking.total_amount}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => setView('bookings')} className="btn-primary">
                <Ticket size={16} /> Open in My Bookings
              </button>
              <button onClick={() => setView('explore')} className="btn-secondary">
                Browse More Events
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
