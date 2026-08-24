import React, { useState, useEffect } from 'react';
import { customerApi } from '../services/api';
import { Sparkles, Film, Clock, Ticket, ChevronRight, Music2 } from 'lucide-react';

function EventArt({ type }) {
  const isMovie = type === 'movie';
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isMovie
          ? 'linear-gradient(135deg, rgba(204,255,0,0.18) 0%, rgba(0,240,255,0.12) 100%)'
          : 'linear-gradient(135deg, rgba(139,92,246,0.22) 0%, rgba(255,0,153,0.14) 100%)',
      }}
    >
      {isMovie ? <Film size={40} color="var(--accent-lime)" /> : <Music2 size={40} color="var(--accent-purple)" />}
    </div>
  );
}

export function HomePage({ setView, onSelectEvent }) {
  const [events, setEvents] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    customerApi.getEvents().then(setEvents).finally(() => setLoading(false));
  }, []);

  const filteredEvents = events.filter((e) => {
    if (activeFilter === 'movies') return e.type === 'movie';
    if (activeFilter === 'concerts') return e.type === 'concert';
    return true;
  });

  const featuredEvent = events[0] || null;

  return (
    <div>
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
              minHeight: '360px',
              display: 'flex',
              alignItems: 'flex-end',
              padding: '40px',
            }}
          >
            <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
              {featuredEvent && <EventArt type={featuredEvent.type} />}
            </div>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(0deg, var(--bg-surface) 15%, rgba(8,9,13,0.6) 65%, transparent 100%)',
                zIndex: 1,
              }}
            />

            <div style={{ position: 'relative', zIndex: 2, maxWidth: '680px' }}>
              {featuredEvent ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
                    <span className="pill-tag pill-tag-lime">
                      <Sparkles size={12} /> NOW BOOKING
                    </span>
                    <span className={`pill-tag ${featuredEvent.type === 'movie' ? 'pill-tag-movie' : 'pill-tag-concert'}`}>
                      {featuredEvent.type.toUpperCase()}
                    </span>
                  </div>
                  <h1 style={{ fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '14px', letterSpacing: '-0.02em' }}>
                    {featuredEvent.title}
                  </h1>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '24px', lineHeight: 1.6 }}>
                    {featuredEvent.description || 'Book your seats on a live, real-time seat map.'}
                  </p>
                  <button onClick={() => onSelectEvent(featuredEvent)} className="btn-primary" style={{ padding: '14px 30px', fontSize: '0.95rem' }}>
                    <Ticket size={18} /> Book Tickets Now
                  </button>
                </>
              ) : (
                <>
                  <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 900, marginBottom: '14px' }}>
                    {loading ? 'Loading events…' : 'No events scheduled yet'}
                  </h1>
                  {!loading && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                      Check back soon, or if you're an organiser, schedule a show from the Organiser Studio.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Now Showing Events Grid */}
      <section style={{ padding: '20px 0 50px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Film size={16} color="var(--accent-lime)" />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Now Showing
                </span>
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 900 }}>Explore Live Experiences</h2>
            </div>

            <div style={{ display: 'flex', background: 'var(--bg-surface-elevated)', padding: '4px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)' }}>
              {[
                { id: 'all', label: 'All Shows' },
                { id: 'movies', label: '🍿 Movies' },
                { id: 'concerts', label: '🎸 Concerts' },
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
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
              Loading events…
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
              No events match this filter yet.
            </div>
          ) : (
            <div className="grid-cards">
              {filteredEvents.map((evt) => (
                <div key={evt.id} className="glass-card-interactive" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
                    <EventArt type={evt.type} />
                    <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                      <span className={`pill-tag ${evt.type === 'movie' ? 'pill-tag-movie' : 'pill-tag-concert'}`}>
                        {evt.type.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px' }}>{evt.title}</h3>
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
                      {evt.description || 'No description provided.'}
                    </p>
                    <button onClick={() => onSelectEvent(evt)} className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: '0.9rem' }}>
                      Book Tickets <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Consumer Experience Features — describes real product capabilities only */}
      <section style={{ padding: '50px 0', background: 'var(--bg-surface)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 40px auto' }}>
            <span className="pill-tag pill-tag-lime" style={{ marginBottom: '10px' }}>THE PULSE ADVANTAGE</span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '10px' }}>Why Book on Pulse?</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {[
              { title: 'Interactive Visual Seat Map', desc: 'Select your exact seats on a live grid — availability updates as others book.', icon: Film, accent: 'var(--accent-lime)' },
              { title: '10-Minute Seat Hold', desc: 'Selected seats are reserved while you check out, then automatically released if abandoned.', icon: Clock, accent: 'var(--accent-cyan)' },
              { title: 'Automated Waitlist', desc: 'Sold out? Join the waitlist to get a time-limited booking link automatically if a seat opens up.', icon: Sparkles, accent: 'var(--accent-pink)' },
              { title: 'QR Ticket & Email', desc: 'Every confirmed booking gets a scannable QR pass and a confirmation email.', icon: Ticket, accent: 'var(--accent-purple)' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="glass-panel" style={{ padding: '28px 20px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <Icon size={20} color={item.accent} />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '8px' }}>{item.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
