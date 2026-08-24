import React from 'react';
import { Sparkles, ShieldCheck, Zap, Layers, Server, Database, Lock, Cpu, Radio, Film } from 'lucide-react';

export function AboutPage({ setView }) {
  return (
    <div className="container" style={{ maxWidth: '900px', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ display: 'inline-flex', gap: '8px', marginBottom: '12px' }}>
          <span className="pill-tag pill-tag-lime">SYSTEM ARCHITECTURE</span>
          <span className="pill-tag pill-tag-movie">PROJECT DOCUMENTATION</span>
        </div>
        <h1 style={{ fontSize: '2.8rem', fontWeight: 900, marginBottom: '12px' }}>
          About Pulse Ticket System
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: '640px', margin: '0 auto' }}>
          A high-performance ticket booking platform engineered to solve the high-concurrency ticket stampede problem through database-level deterministic locks, 10-minute hold TTLs, and automated waitlist reallocation.
        </p>
      </div>

      {/* Core Architectural Invariants */}
      <div className="glass-panel" style={{ padding: '36px', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={24} color="var(--accent-lime)" />
          System Design & Concurrency Invariants
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.7, marginBottom: '24px' }}>
          Traditional ticketing systems suffer from check-then-act race conditions, where two concurrent customers read seat status as "available" at the same millisecond and both succeed in placing orders. Pulse eliminates this bug by construction:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-lime)', marginBottom: '6px' }}>
              INVARIANT 1
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>Atomic Conditional UPDATE</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              The SQL WHERE clause is the lock. Postgres serializes writers via row-level locks on the single <code>attemptSeatTransition</code> choke point.
            </p>
          </div>

          <div style={{ background: 'var(--bg-surface-elevated)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', marginBottom: '6px' }}>
              INVARIANT 2
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>Lazy Hold Expiry</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              An expired hold is immediately re-holdable in real time the instant <code>held_until &lt; now()</code>, with zero dependency on delayed background jobs.
            </p>
          </div>

          <div style={{ background: 'var(--bg-surface-elevated)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-pink)', marginBottom: '6px' }}>
              INVARIANT 3
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>Waitlist FIFO Cascading</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Cancelled seats automatically trigger a 15-minute signed token offer to the longest-waiting customer on the waitlist queue.
            </p>
          </div>
        </div>
      </div>

      {/* Tech Stack Pillars */}
      <div className="glass-panel" style={{ padding: '36px', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '24px' }}>Technology Stack & Tools</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          {[
            { label: 'Frontend UI', val: 'React 18 + Vite', icon: Cpu, color: 'var(--accent-lime)' },
            { label: 'Design System', val: 'Bespoke Vanilla CSS', icon: Sparkles, color: 'var(--accent-cyan)' },
            { label: 'Backend API', val: 'Node.js & Express', icon: Server, color: 'var(--accent-purple)' },
            { label: 'Primary Store', val: 'PostgreSQL (Neon)', icon: Database, color: 'var(--accent-pink)' },
            { label: 'Real-time Fanout', val: 'SSE + Redis Pub/Sub', icon: Radio, color: 'var(--accent-lime)' },
            { label: 'Digital Passes', val: 'Scannable QR Generator', icon: Lock, color: 'var(--accent-cyan)' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} style={{ background: 'var(--bg-surface-elevated)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <Icon size={20} color={item.color} style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{item.label}</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{item.val}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Call to Action */}
      <div style={{ textAlign: 'center' }}>
        <button onClick={() => setView('explore')} className="btn-primary" style={{ padding: '14px 32px' }}>
          Explore Live Event Catalog
        </button>
      </div>
    </div>
  );
}
