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
  const [customerName, setCustomerName] = useState(user?.name || 'Alex Hunter');
  const [customerEmail, setCustomerEmail] = useState(user?.email || 'alex.hunter@pulse.io');
  const [paymentMethod, setPaymentMethod] = useState('applepay');
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const baseTotal = selectedSeats.reduce((sum, s) => sum + Number(s.category?.price || 400), 0);
  const discountAmount = (baseTotal * discountPercent) / 100;
  const finalTotal = baseTotal - discountAmount;

  const handleApplyPromo = () => {
    if (promoCode.trim().toUpperCase() === 'GENZ20' || promoCode.trim().toUpperCase() === 'PULSE') {
      setDiscountPercent(20);
      addToast('🎉 Promo code applied! 20% discount added.', 'success');
    } else {
      addToast('Invalid promo code. Try "GENZ20" or "PULSE"', 'error');
    }
  };

  const handlePayAndConfirm = async () => {
    if (!customerEmail.trim()) {
      addToast('Please enter a valid email to receive your QR tickets', 'error');
      return;
    }

    setLoading(true);
    try {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#CCFF00', '#00F0FF', '#FF2E63', '#8B5CF6'],
      });

      await onConfirmSuccess({
        name: customerName,
        email: customerEmail,
      });

      addToast(`🎉 Tickets confirmed! QR code email delivered to ${customerEmail}`, 'success');
      onClose();
    } catch (err) {
      addToast(err.message || 'Payment confirmation error', 'error');
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

        {/* Customer Details Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Customer Name</label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="form-input"
              placeholder="Your Name"
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Email (For QR Ticket)</label>
            <input
              type="email"
              required
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="form-input"
              placeholder="your.email@example.com"
            />
          </div>
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
              {selectedSeats.map((s) => s.id.split('-').slice(-2).join('')).join(', ')}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span>Subtotal:</span>
            <span>₹{baseTotal.toFixed(2)}</span>
          </div>
          {discountPercent > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.85rem', color: 'var(--accent-lime)' }}>
              <span>Promo Discount (20%):</span>
              <span>- ₹{discountAmount.toFixed(2)}</span>
            </div>
          )}
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

        {/* Promo Code Input */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Promo Code (Try: GENZ20)"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            className="form-input"
            style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}
          />
          <button
            type="button"
            onClick={handleApplyPromo}
            className="btn-secondary"
            style={{ padding: '0 20px', whiteSpace: 'nowrap' }}
          >
            Apply
          </button>
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
