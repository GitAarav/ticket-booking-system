import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { customerApi } from '../services/api';
import { X, Users, Sparkles, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

export function WaitlistModal({
  isOpen,
  onClose,
  showId,
  showTitle,
  categoryId,
  categoryName,
}) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);

  if (!isOpen) return null;

  const handleJoin = async () => {
    setLoading(true);
    try {
      await customerApi.joinWaitlist(showId, categoryId);
      setJoined(true);
      addToast('🎉 Successfully joined waitlist! You will be notified when a seat opens.', 'success');
    } catch (err) {
      addToast(err.message || 'Error joining waitlist', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '20px', right: '20px', color: 'var(--text-muted)' }}
          className="btn-icon"
        >
          <X size={18} />
        </button>

        {!joined ? (
          <div>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: 'rgba(255, 46, 99, 0.15)',
                border: '1px solid rgba(255, 46, 99, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <Users size={22} color="var(--accent-pink)" />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>
              Join Category Waitlist
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '20px', lineHeight: 1.5 }}>
              The <strong>{categoryName}</strong> tier for <strong>{showTitle}</strong> is currently sold out. Join our priority queue to automatically receive a 15-minute exclusive reservation link if another customer cancels.
            </p>

            <div
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                marginBottom: '24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', marginBottom: '8px' }}>
                <Clock size={16} color="var(--accent-lime)" />
                <span>Automated Priority Reallocation</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                When a seat frees up, the oldest waiting customer is instantly offered the hold.
              </div>
            </div>

            <button
              onClick={handleJoin}
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '14px', background: 'var(--accent-pink)', color: '#FFFFFF', boxShadow: '0 4px 16px var(--accent-pink-glow)' }}
            >
              {loading ? 'Joining Queue...' : 'Confirm & Join Waitlist'}
              <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle2 size={48} color="var(--accent-lime)" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>You are on the Waitlist!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '24px' }}>
              We will send an email with a time-limited 15-minute booking offer as soon as a seat in <strong>{categoryName}</strong> is freed up.
            </p>
            <button onClick={onClose} className="btn-primary" style={{ width: '100%' }}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
