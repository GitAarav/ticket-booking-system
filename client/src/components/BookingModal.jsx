import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { X, CreditCard, Smartphone, Zap, Sparkles, ShieldCheck, CheckCircle2, Ticket, Mail, User } from 'lucide-react';

export function BookingModal({
  isOpen,
  onClose,
  show,
  selectedSeats,
  onConfirmSuccess,
}) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState('applepay');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const finalTotal = selectedSeats.reduce((sum, s) => sum + Number(s.price || 0), 0);

  const handlePayAndConfirm = async () => {
    setLoading(true);
    try {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#CCFF00', '#00F0FF', '#FF2E63', '#8B5CF6'],
      });

      await onConfirmSuccess();

      addToast('Booking confirmed! A confirmation email is on its way.', 'success');
      onClose();
    } catch (err) {
      addToast(err.message || 'Booking confirmation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '20px', right: '20px', color: 'var(--text-muted)' }}
          className="btn-icon"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="pill-tag pill-tag-lime">FAST CHECKOUT</span>
            <span className="pill-tag pill-tag-movie">INSTANT QR TICKETS</span>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Complete Your Booking</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {show?.title} • {show?.show_date} at {show?.show_time}
          </p>
        </div>

        {/* Booking Account — the ticket always goes to the logged-in account */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <User size={14} />
          Booking as <strong style={{ color: 'var(--text-primary)' }}>{user?.name}</strong> ({user?.email})
        </div>

        {/* Order Summary Card */}
        <div
          style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            marginBottom: '18px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span>Venue:</span>
            <strong style={{ color: 'var(--text-primary)' }}>{show?.venue_name || 'PVR INOX'}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span>Selected Seats ({selectedSeats.length}):</span>
            <span className="pill-tag pill-tag-lime">
              {selectedSeats.map((s) => `${s.rowLabel}${s.seatNumber}`).join(', ')}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '10px',
              borderTop: '1px dashed var(--border-medium)',
              fontSize: '1.15rem',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
            }}
          >
            <span>Total Payable:</span>
            <span style={{ color: 'var(--accent-lime)' }}>₹{finalTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div style={{ marginBottom: '20px' }}>
          <label className="form-label">Payment Method</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            {[
              { id: 'applepay', label: 'Apple Pay', icon: Smartphone },
              { id: 'card', label: 'Card / Debit', icon: CreditCard },
              { id: 'upi', label: 'UPI / Fast', icon: Zap },
            ].map((pm) => {
              const Icon = pm.icon;
              const active = paymentMethod === pm.id;
              return (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPaymentMethod(pm.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '12px 8px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${active ? 'var(--accent-lime)' : 'var(--border-subtle)'}`,
                    background: active ? 'rgba(204, 255, 0, 0.12)' : 'var(--bg-surface-elevated)',
                    color: active ? 'var(--accent-lime)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                  }}
                >
                  <Icon size={18} color={active ? 'var(--accent-lime)' : 'currentColor'} />
                  <span>{pm.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Checkout Button */}
        <button
          onClick={handlePayAndConfirm}
          disabled={loading}
          className="btn-primary"
          style={{
            width: '100%',
            padding: '15px',
            fontSize: '1rem',
            background: 'linear-gradient(135deg, var(--accent-lime) 0%, var(--accent-cyan) 100%)',
            color: '#08090D',
          }}
        >
          {loading ? 'Confirming Ticket & QR Delivery...' : `Pay ₹${finalTotal.toFixed(2)} & Email QR Ticket`}
        </button>
      </div>
    </div>
  );
}
