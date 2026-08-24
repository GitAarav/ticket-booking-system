import React from 'react';
import { Clock, ShieldCheck, Bell, Ticket } from 'lucide-react';

export function AboutPage({ setView }) {
  return (
    <div className="container" style={{ maxWidth: '840px', paddingBottom: '60px' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <span className="pill-tag pill-tag-lime" style={{ marginBottom: '12px' }}>HOW IT WORKS</span>
        <h1 style={{ fontSize: '2.6rem', fontWeight: 900, marginBottom: '12px' }}>Booking on Pulse</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto' }}>
          A quick guide to seat holds, waitlists, and tickets — no jargon.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Clock size={20} color="var(--accent-lime)" />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px' }}>Seats hold while you check out</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
            Selecting seats reserves them just for you for a limited time. If you don't finish checkout in time, they're
            automatically released back to everyone else — no manual step needed on either side.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '28px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <ShieldCheck size={20} color="var(--accent-cyan)" />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px' }}>A seat is never double-booked</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
            If two people try to grab the same seat at the same moment, only one succeeds — the other sees it's already
            taken immediately, instead of both being told it worked.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '28px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Bell size={20} color="var(--accent-pink)" />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px' }}>Sold out? Join the waitlist</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
            If someone cancels, the seat is offered to the longest-waiting person on the waitlist with a time-limited
            link. If they don't claim it in time, it moves to the next person automatically.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '28px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Ticket size={20} color="var(--accent-purple)" />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px' }}>QR ticket & confirmation email</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
            Every confirmed booking gets a scannable QR pass in your wallet and a confirmation email with the same code.
          </p>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '32px' }}>
        <button onClick={() => setView('explore')} className="btn-primary" style={{ padding: '14px 32px' }}>
          Browse Shows
        </button>
      </div>
    </div>
  );
}
