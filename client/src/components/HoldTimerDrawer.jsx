import React, { useEffect, useState } from 'react';
import { Timer, ArrowRight, ShieldCheck, Trash2 } from 'lucide-react';

export function HoldTimerDrawer({
  selectedSeats,
  isHeld,
  heldUntil,
  onHoldSeats,
  onProceedCheckout,
  onClearSelection,
  loading,
}) {
  const [timeLeft, setTimeLeft] = useState('');
  const [progressPercent, setProgressPercent] = useState(100);
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);

  useEffect(() => {
    if (!isHeld || !heldUntil) {
      setTimeLeft('');
      setProgressPercent(100);
      return;
    }

    const targetTime = new Date(heldUntil).getTime();
    const totalDuration = 10 * 60 * 1000; // 10 minutes default

    const interval = setInterval(() => {
      const remaining = targetTime - Date.now();
      if (remaining <= 0) {
        setTimeLeft('00:00 - Hold Expired');
        setProgressPercent(0);
        clearInterval(interval);
      } else {
        const mins = Math.floor(remaining / (1000 * 60));
        const secs = Math.floor((remaining % (1000 * 60)) / 1000);
        setTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
        
        const percent = Math.max(0, Math.min(100, (remaining / totalDuration) * 100));
        setProgressPercent(percent);
        setIsExpiringSoon(remaining < 2 * 60 * 1000);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isHeld, heldUntil]);

  if (selectedSeats.length === 0) return null;

  const totalPrice = selectedSeats.reduce((sum, s) => sum + Number(s.category?.price || 400), 0);

  return (
    <div className="hold-drawer">
      {/* Live Hold Progress Bar */}
      {isHeld && (
        <div
          className={`hold-progress-bar ${isExpiringSoon ? 'expiring' : ''}`}
          style={{ width: `${progressPercent}%` }}
        />
      )}

      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        {/* Left Seat Summary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-medium)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent-lime)',
              fontSize: '1.1rem',
            }}
          >
            {selectedSeats.length}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{selectedSeats.length} Seat{selectedSeats.length > 1 ? 's' : ''} Selected</span>
              <span className="pill-tag pill-tag-lime">
                {selectedSeats.map((s) => s.id.split('-').slice(-2).join('')).join(', ')}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={14} color="var(--accent-cyan)" />
              <span>Real-Time Seat Hold Protection Active</span>
            </div>
          </div>
        </div>

        {/* Center: Live Hold Timer Countdown */}
        {isHeld ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 18px',
              background: isExpiringSoon ? 'rgba(255, 46, 99, 0.15)' : 'rgba(204, 255, 0, 0.12)',
              border: `1px solid ${isExpiringSoon ? 'var(--accent-pink)' : 'var(--accent-lime)'}`,
              borderRadius: 'var(--radius-full)',
            }}
          >
            <Timer size={18} color={isExpiringSoon ? 'var(--accent-pink)' : 'var(--accent-lime)'} className="status-dot held" />
            <div>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                SEATS RESERVED FOR YOU
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.05rem', color: isExpiringSoon ? 'var(--accent-pink)' : 'var(--accent-lime)' }}>
                {timeLeft || '10:00'}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Seats will be reserved for <strong>10 minutes</strong> on hold.
          </div>
        )}

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onClearSelection}
            className="btn-icon"
            title="Clear Seat Selection"
          >
            <Trash2 size={16} color="var(--accent-pink)" />
          </button>

          <div style={{ textAlign: 'right', marginRight: '8px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>TOTAL PAYABLE</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
              ₹{totalPrice.toFixed(2)}
            </div>
          </div>

          {!isHeld ? (
            <button
              onClick={onHoldSeats}
              disabled={loading}
              className="btn-primary"
              style={{ padding: '12px 24px' }}
            >
              {loading ? 'Reserving...' : 'Hold Seats (10m TTL)'}
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              onClick={onProceedCheckout}
              disabled={loading}
              className="btn-primary"
              style={{
                padding: '12px 28px',
                background: 'linear-gradient(135deg, var(--accent-lime) 0%, var(--accent-cyan) 100%)',
                color: '#08090D',
              }}
            >
              Confirm & Pay ₹{totalPrice.toFixed(2)}
              <ArrowRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
