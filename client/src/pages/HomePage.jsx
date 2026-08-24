import React, { useState, useEffect } from 'react';
import { customerApi } from '../services/api';
import {
  Sparkles,
  Film,
  Calendar,
  Clock,
  ArrowRight,
  Flame,
  Star,
  ShieldCheck,
  Zap,
  Ticket,
  ChevronRight,
  Play,
  MapPin,
  Tag,
  CheckCircle2,
} from 'lucide-react';

export function HomePage({ setView, onSelectEvent }) {
  const [events, setEvents] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [trailerModal, setTrailerModal] = useState(null);

  useEffect(() => {
    customerApi.getEvents().then((evts) => setEvents(evts));
  }, []);

  const filteredEvents = events.filter((e) => {
    if (activeFilter === 'movies') return e.type === 'movie';
    if (activeFilter === 'concerts') return e.type === 'concert';
    return true;
  });

  const featuredEvent = events[0] || null;

  return (
    <div>
      {/* City & Offers Marquee Ticker */}
      <div className="marquee-wrapper">
        <div className="marquee-content">
          🍿 NOW SHOWING: DUNE PART TWO (IMAX 70MM) • COLDPLAY LIVE WORLD TOUR • USE PROMO CODE 'GENZ20' FOR 20% OFF • 10-MIN FREE SEAT HOLD • REAL-TIME INTERACTIVE SEAT MAPS • INSTANT EMAIL & WALLET QR PASSES 🍿 &nbsp;&nbsp;&nbsp;&nbsp; 🍿 NOW SHOWING: DUNE PART TWO (IMAX 70MM) • COLDPLAY LIVE WORLD TOUR • USE PROMO CODE 'GENZ20' FOR 20% OFF • 10-MIN FREE SEAT HOLD • REAL-TIME INTERACTIVE SEAT MAPS • INSTANT EMAIL & WALLET QR PASSES 🍿
        </div>
      </div>

      {/* Hero Showcase Section */}
      <section style={{ padding: '40px 0 30px 0', position: 'relative', overflow: 'hidden' }}>
        <div className="container">
          <div
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              background: 'linear-gradient(180deg, rgba(8, 9, 13, 0.4) 0%, var(--bg-surface) 100%)',
              border: '1px solid var(--border-medium)',
              boxShadow: 'var(--shadow-lg)',
              minHeight: '440px',
              display: 'flex',
              alignItems: 'flex-end',
              padding: '40px',
            }}
          >
            {/* Background Backdrop Image */}
            {featuredEvent && (
              <img
                src={featuredEvent.banner}
                alt={featuredEvent.title}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: 0.35,
                  zIndex: 0,
                  filter: 'saturate(1.2) brightness(0.8)',
                }}
              />
            )}

            {/* Ambient Gradient Overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(0deg, var(--bg-surface) 15%, rgba(8,9,13,0.6) 65%, transparent 100%)',
                zIndex: 1,
              }}
            />

            {/* Hero Content */}
            <div style={{ position: 'relative', zIndex: 2, maxWidth: '680px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
                <span className="pill-tag pill-tag-lime">
                  <Flame size={12} /> SPOTLIGHT BLOCKBUSTER
                </span>
                <span className="pill-tag pill-tag-movie">IMAX 70MM • DOLBY ATMOS</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--cat-vip)', fontSize: '0.85rem', fontWeight: 700 }}>
                  <Star size={14} fill="currentColor" /> {featuredEvent?.rating || '9.4'} / 10 ({featuredEvent?.votes || '142K'} Votes)
                </div>
              </div>

              <h1
                style={{
                  fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
                  fontWeight: 900,
                  lineHeight: 1.1,
                  marginBottom: '14px',
                  letterSpacing: '-0.02em',
                }}
              >
                {featuredEvent?.title || 'Dune: Part Two (IMAX 70mm)'}
              </h1>

              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '24px', lineHeight: 1.6 }}>
                {featuredEvent?.description || 'Witness the cinematic spectacle of the year with real-time interactive seat selection, instant reservations, and scannable mobile passes.'}
              </p>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    if (featuredEvent) onSelectEvent(featuredEvent);
                    else setView('explore');
                  }}
                  className="btn-primary"
                  style={{ padding: '14px 30px', fontSize: '0.95rem' }}
                >
                  <Ticket size={18} /> Book Tickets Now
                </button>
                <button
                  onClick={() => setTrailerModal(featuredEvent)}
                  className="btn-secondary"
                  style={{ padding: '14px 22px', fontSize: '0.95rem' }}
                >
                  <Play size={16} fill="currentColor" /> Watch Trailer
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Promotional Discount Banner */}
      <section style={{ padding: '10px 0 30px 0' }}>
        <div className="container">
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(204, 255, 0, 0.12) 0%, rgba(0, 240, 255, 0.12) 100%)',
              border: '1px solid var(--accent-lime)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--accent-lime)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#08090D',
                }}
              >
                <Tag size={18} />
              </div>
              <div>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  Special Premiere Discount: Flat 20% OFF
                </strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Apply promo code <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-lime)' }}>GENZ20</span> at checkout on any movie or live concert ticket.
                </div>
              </div>
            </div>

            <button
              onClick={() => setView('explore')}
              className="btn-outline"
              style={{ padding: '8px 18px', fontSize: '0.85rem' }}
            >
              Browse Shows
            </button>
          </div>
        </div>
      </section>

      {/* Now Showing Events Grid */}
      <section style={{ padding: '20px 0 50px 0' }}>
        <div className="container">
          {/* Header & Filter Tabs */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginBottom: '28px',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Film size={16} color="var(--accent-lime)" />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  NOW SHOWING IN THEATRES & ARENAS
                </span>
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 900 }}>Explore Live Experiences</h2>
            </div>

            {/* Filter Toggle Pills */}
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
                { id: 'all', label: 'All Shows' },
                { id: 'movies', label: '🍿 In Theatres' },
                { id: 'concerts', label: '🎸 Live Concerts' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: activeFilter === f.id ? 'var(--text-primary)' : 'var(--text-muted)',
                    background: activeFilter === f.id ? 'var(--bg-surface)' : 'transparent',
                    boxShadow: activeFilter === f.id ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid-cards">
            {filteredEvents.map((evt) => (
              <div
                key={evt.id}
                className="glass-card-interactive"
                style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
              >
                {/* Poster Artwork */}
                <div style={{ position: 'relative', height: '220px', overflow: 'hidden' }}>
                  <img
                    src={evt.banner}
                    alt={evt.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.4s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      display: 'flex',
                      gap: '6px',
                    }}
                  >
                    <span className={`pill-tag ${evt.type === 'movie' ? 'pill-tag-movie' : 'pill-tag-concert'}`}>
                      {evt.type.toUpperCase()}
                    </span>
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '10px',
                      background: 'rgba(8, 9, 13, 0.85)',
                      backdropFilter: 'blur(8px)',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'var(--cat-vip)',
                    }}
                  >
                    <Star size={12} fill="currentColor" /> {evt.rating}
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                    {evt.runtime} • {evt.language || 'English'}
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px' }}>
                    {evt.title}
                  </h3>
                  <p
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.85rem',
                      lineHeight: 1.5,
                      marginBottom: '16px',
                      flex: 1,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {evt.description}
                  </p>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    {evt.genre?.map((g, idx) => (
                      <span key={idx} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        #{g}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => onSelectEvent(evt)}
                    className="btn-primary"
                    style={{ width: '100%', padding: '12px', fontSize: '0.9rem' }}
                  >
                    Book Tickets
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Consumer Experience Features */}
      <section style={{ padding: '50px 0', background: 'var(--bg-surface)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 40px auto' }}>
            <span className="pill-tag pill-tag-lime" style={{ marginBottom: '10px' }}>
              THE PULSE ADVANTAGE
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '10px' }}>
              Why Book on Pulse?
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Simple, transparent, and seamless ticketing for cinema lovers and concert enthusiasts.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {[
              {
                title: 'Interactive Visual Seat Map',
                desc: 'Select your exact preferred recliner, prime club, or standing pit seats on a live theatre grid.',
                icon: Film,
                accent: 'var(--accent-lime)',
              },
              {
                title: '10-Minute Free Seat Hold',
                desc: 'Take your time during checkout. Selected seats are reserved for 10 minutes so no one takes them.',
                icon: Clock,
                accent: 'var(--accent-cyan)',
              },
              {
                title: 'Automated Waitlist Alerts',
                desc: 'Sold out? Join the queue to automatically receive a 15-minute exclusive booking link if a seat opens.',
                icon: Sparkles,
                accent: 'var(--accent-pink)',
              },
              {
                title: 'Instant Mobile QR Pass & Email',
                desc: 'Receive digital passes with verifiable QR codes sent straight to your email for easy turnstile scan.',
                icon: Ticket,
                accent: 'var(--accent-purple)',
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="glass-panel" style={{ padding: '28px 20px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-medium)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px',
                    }}
                  >
                    <Icon size={20} color={item.accent} />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '8px' }}>
                    {item.title}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trailer/Glance Modal */}
      {trailerModal && (
        <div className="modal-backdrop" onClick={() => setTrailerModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px' }}>{trailerModal.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>{trailerModal.tagline}</p>
            <div style={{ position: 'relative', height: '320px', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '20px' }}>
              <img src={trailerModal.banner} alt={trailerModal.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ padding: '14px 24px', background: 'rgba(0,0,0,0.85)', borderRadius: 'var(--radius-full)', color: 'var(--accent-lime)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Play size={18} fill="currentColor" /> Cinematic Trailer Preview
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setTrailerModal(null)} className="btn-secondary">Close</button>
              <button onClick={() => { onSelectEvent(trailerModal); setTrailerModal(null); }} className="btn-primary">Book Tickets</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
