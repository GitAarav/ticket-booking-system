import React, { useState, useEffect } from 'react';
import { offersApi, customerApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import confetti from 'canvas-confetti';
import { Sparkles, Timer, CheckCircle2, ArrowRight, ShieldCheck, Ticket, AlertCircle, Bell, Clock, Search } from 'lucide-react';

export function OfferClaimPage({ setView }) {
  const { addToast } = useToast();
  const [tokenInput, setTokenInput] = useState('');
  const [activeOffers, setActiveOffers] = useState([]);
  const [currentOfferData, setCurrentOfferData] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [loading, setLoading] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  const fetchOffers = async () => {
    const list = await offersApi.getActiveOffers();
    setActiveOffers(list);
    if (list.length > 0 && !tokenInput) {
      handleSelectOffer(list[0]);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleSelectOffer = async (offer) => {
    setTokenInput(offer.token);
    const details = await offersApi.getOfferDetails(offer.token);
    if (details && details.valid) {
      setCurrentOfferData(details.offer);
      setSecondsRemaining(details.remainingSeconds);
    } else {
      setCurrentOfferData(null);
      setSecondsRemaining(0);
    }
  };

  const handleInspectToken = async (token) => {
    setTokenInput(token);
    if (!token.trim()) {
      setCurrentOfferData(null);
      setSecondsRemaining(0);
      return;
    }

    const details = await offersApi.getOfferDetails(token.trim());
    if (details && details.valid) {
      setCurrentOfferData(details.offer);
      setSecondsRemaining(details.remainingSeconds);
      addToast('Active waitlist offer verified!', 'success');
    } else {
      setCurrentOfferData(null);
      setSecondsRemaining(0);
      addToast('No active offer found matching this token', 'error');
    }
  };

  // Real Countdown Timer derived strictly from the active offer's real expiration
  useEffect(() => {
    if (!currentOfferData || secondsRemaining <= 0) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((new Date(currentOfferData.expiresAt).getTime() - Date.now()) / 1000));
      setSecondsRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentOfferData]);

  const formatCountdown = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const handleClaimOffer = async () => {
    if (!tokenInput.trim()) {
      addToast('Please enter an active offer token', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await offersApi.confirmOfferToken(tokenInput.trim());
      if (res && res.booking) {
        confetti({
          particleCount: 140,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#CCFF00', '#00F0FF', '#FF2E63'],
        });
        setConfirmedBooking(res.booking);
        setCurrentOfferData(null);
        addToast('🎉 Waitlist Offer successfully redeemed! Seat booked.', 'success');
        await fetchOffers();
      } else {
        throw new Error(res?.error || 'Offer invalid or expired');
      }
    } catch (err) {
      addToast(err.message || 'Failed to claim offer', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '720px', paddingBottom: '60px' }}>
      <div className="glass-panel" style={{ padding: '36px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', gap: '8px', marginBottom: '12px' }}>
            <span className="pill-tag pill-tag-concert">WAITLIST ALLOCATION ENGINE</span>
            <span className="pill-tag pill-tag-lime">FIFO PRIORITY QUEUE</span>
          </div>

          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '8px' }}>
            Waitlist Seat Claim Portal
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            When a customer cancels a confirmed booking, the next waiting user receives a 15-minute exclusive claim offer. Verify your token below to complete your booking.
          </p>
        </div>

        {/* Active Generated Offers Banner */}
        {activeOffers.length > 0 && !confirmedBooking && (
          <div
            style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--accent-cyan)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              marginBottom: '28px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Bell size={16} color="var(--accent-cyan)" />
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                Active Seat Offers Available ({activeOffers.length})
              </strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeOffers.map((off) => (
                <div
                  key={off.token}
                  onClick={() => handleSelectOffer(off)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: tokenInput === off.token ? 'rgba(0, 240, 255, 0.12)' : 'var(--bg-surface)',
                    border: `1px solid ${tokenInput === off.token ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  <div>
                    <strong>{off.eventTitle}</strong> • {off.categoryName} (Row {off.rowLabel}, Seat {off.seatNumber})
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Offered to: {off.customerEmail}</div>
                  </div>
                  <span className="pill-tag pill-tag-lime" style={{ fontSize: '0.7rem' }}>
                    Select & Claim
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!confirmedBooking ? (
          <div>
            {/* Token Input Bar */}
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Offer Token Verification</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Paste signed waitlist offer token..."
                  className="form-input"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                />
                <button
                  type="button"
                  onClick={() => handleInspectToken(tokenInput)}
                  className="btn-secondary"
                  style={{ padding: '0 20px', whiteSpace: 'nowrap' }}
                >
                  Verify
                </button>
              </div>
            </div>

            {/* Active Verified Offer Card with Real Expiry Countdown */}
            {currentOfferData && secondsRemaining > 0 ? (
              <div>
                {/* Real Countdown Timer Display */}
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
                  <Timer size={26} color={secondsRemaining < 180 ? 'var(--accent-pink)' : 'var(--accent-lime)'} className="status-dot held" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      REAL OFFER EXPIRES IN
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: secondsRemaining < 180 ? 'var(--accent-pink)' : 'var(--accent-lime)' }}>
                      {formatCountdown(secondsRemaining)}
                    </div>
                  </div>
                </div>

                {/* Offer Details Breakdown */}
                <div
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px',
                    marginBottom: '24px',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Event:</span>
                    <strong>{currentOfferData.eventTitle}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Venue:</span>
                    <span>{currentOfferData.venueName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Allocated Seat:</span>
                    <span className="pill-tag pill-tag-lime">
                      Row {currentOfferData.rowLabel} - Seat {currentOfferData.seatNumber} ({currentOfferData.categoryName})
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, paddingTop: '12px', borderTop: '1px dashed var(--border-medium)' }}>
                    <span>Payable Price:</span>
                    <span style={{ color: 'var(--accent-lime)' }}>₹{currentOfferData.price.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleClaimOffer}
                  disabled={loading || secondsRemaining <= 0}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '16px',
                    fontSize: '1.05rem',
                    background: 'linear-gradient(135deg, var(--accent-lime) 0%, var(--accent-cyan) 100%)',
                    color: '#08090D',
                  }}
                >
                  {loading ? 'Redeeming Seat...' : '1-Tap Claim & Confirm Ticket'}
                  <ArrowRight size={18} />
                </button>
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  background: 'var(--bg-surface-elevated)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px dashed var(--border-medium)',
                }}
              >
                <Clock size={36} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>
                  No Active Offer Loaded
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '440px', margin: '0 auto 16px auto' }}>
                  To test waitlist offer claims: Join a sold-out category on any show, or cancel an existing booking from <strong>My Bookings</strong> to trigger a real seat reallocation offer!
                </p>
                <button onClick={() => setView('explore')} className="btn-secondary" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
                  Browse Live Shows
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle2 size={56} color="var(--accent-lime)" style={{ margin: '0 auto 16px auto' }} />
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>
              Booking Confirmed!
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
              Your waitlist offer has been successfully converted into a confirmed ticket with reference: <strong>{confirmedBooking.booking_reference}</strong>.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => setView('bookings')} className="btn-primary">
                <Ticket size={16} /> Open in My Bookings Wallet
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
