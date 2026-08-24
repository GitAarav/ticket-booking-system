import React, { useState, useEffect } from 'react';
import { customerApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { DigitalTicketPass } from '../components/DigitalTicketPass';
import { Ticket, Sparkles, Filter, Compass } from 'lucide-react';

export function MyBookingsPage({ setView, onSelectEvent }) {
  const { addToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const bks = await customerApi.getBookings();
      setBookings(bks);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    await customerApi.cancelBooking(bookingId);
    await fetchBookings();
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'confirmed') return b.status === 'confirmed';
    if (filter === 'cancelled') return b.status === 'cancelled';
    return true;
  });

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="pill-tag pill-tag-lime">DIGITAL PASS WALLET</span>
            <span className="pill-tag pill-tag-movie">SCANNABLE QR PASSES</span>
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 900, marginBottom: '8px' }}>
            My Ticket Passbook
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            All active movie passes and concert e-tickets with scannable turnstile QR codes.
          </p>
        </div>

        {/* Filter Tabs */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-surface-elevated)',
            padding: '4px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {[
            { id: 'all', label: 'All Tickets' },
            { id: 'confirmed', label: '✦ Active' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: filter === f.id ? 'var(--text-primary)' : 'var(--text-muted)',
                background: filter === f.id ? 'var(--bg-surface)' : 'transparent',
                boxShadow: filter === f.id ? 'var(--shadow-sm)' : 'none',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Passes Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          Loading your digital ticket passes...
        </div>
      ) : filteredBookings.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '32px',
          }}
        >
          {filteredBookings.map((bk) => (
            <DigitalTicketPass
              key={bk.id}
              booking={bk}
              onCancelBooking={handleCancelBooking}
            />
          ))}
        </div>
      ) : (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '540px', margin: '0 auto' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'var(--bg-surface-elevated)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <Ticket size={28} color="var(--accent-lime)" />
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>Your Passbook is Empty</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
            You don't have any {filter !== 'all' ? filter : ''} tickets yet. Explore upcoming movies and concerts to grab your seats!
          </p>
          <button onClick={() => setView('explore')} className="btn-primary">
            <Compass size={18} /> Browse Live Events
          </button>
        </div>
      )}
    </div>
  );
}
