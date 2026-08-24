import React from 'react';
import { Film, Globe, Heart, Sparkles, ShieldCheck, Zap, Mail, Phone, HelpCircle, MapPin } from 'lucide-react';

export function Footer({ setView }) {
  return (
    <footer
      style={{
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
        padding: '50px 0 24px 0',
        marginTop: 'auto',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '36px',
            marginBottom: '40px',
          }}
        >
          {/* Brand Column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'var(--accent-lime)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#08090D',
                }}
              >
                <Film size={18} />
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.2rem' }}>
                PULSE✦
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '14px' }}>
              Your destination for instant movie tickets, live concerts, and arena world tours. Real-time seat maps and instant scannable passes.
            </p>
          </div>

          {/* Movies & Categories */}
          <div>
            <h4 style={{ fontSize: '0.92rem', marginBottom: '14px', color: 'var(--text-primary)', fontWeight: 700 }}>
              Movies & Shows
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <li>
                <button onClick={() => setView('explore')} style={{ color: 'inherit' }}>Now Showing in Theatres</button>
              </li>
              <li>
                <button onClick={() => setView('explore')} style={{ color: 'inherit' }}>IMAX 70mm Screenings</button>
              </li>
              <li>
                <button onClick={() => setView('explore')} style={{ color: 'inherit' }}>Live Concerts & Tours</button>
              </li>
              <li>
                <button onClick={() => setView('offer-redeem')} style={{ color: 'inherit' }}>Waitlist Offer Redemption</button>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 style={{ fontSize: '0.92rem', marginBottom: '14px', color: 'var(--text-primary)', fontWeight: 700 }}>
              Help & Support
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <li>
                <button onClick={() => setView('contact')} style={{ color: 'inherit' }}>24/7 Customer Helpdesk</button>
              </li>
              <li>
                <button onClick={() => setView('contact')} style={{ color: 'inherit' }}>Frequently Asked Questions</button>
              </li>
              <li>
                <button onClick={() => setView('bookings')} style={{ color: 'inherit' }}>Ticket Cancellation & Refunds</button>
              </li>
              <li>
                <button onClick={() => setView('about')} style={{ color: 'inherit' }}>How Booking Works</button>
              </li>
            </ul>
          </div>

          {/* Portals & Management */}
          <div>
            <h4 style={{ fontSize: '0.92rem', marginBottom: '14px', color: 'var(--text-primary)', fontWeight: 700 }}>
              Partners & Studio
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <li>
                <button onClick={() => setView('organiser')} style={{ color: 'inherit' }}>Organiser Studio & Revenue</button>
              </li>
              <li>
                <button onClick={() => setView('admin')} style={{ color: 'inherit' }}>Admin Venue & Seat Builder</button>
              </li>
              <li>
                <button onClick={() => setView('auth')} style={{ color: 'inherit' }}>Sign In / Switch Profiles</button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <div>© 2026 PULSE CINEMAS & LIVE EVENTS • ALL RIGHTS RESERVED</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            CRAFTED WITH <Heart size={13} color="var(--accent-pink)" fill="var(--accent-pink)" /> FOR CINEMA ENTHUSIASTS
          </div>
        </div>
      </div>
    </footer>
  );
}
