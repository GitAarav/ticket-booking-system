import React, { useState, useEffect } from 'react';
import { customerApi } from '../services/api';
import { Search, Film, Clock, MapPin, ChevronRight, Music2 } from 'lucide-react';

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
      {isMovie ? <Film size={34} color="var(--accent-lime)" /> : <Music2 size={34} color="var(--accent-purple)" />}
    </div>
  );
}

export function ExplorePage({ onSelectEvent }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedEventForShows, setSelectedEventForShows] = useState(null);
  const [shows, setShows] = useState([]);
  const [loadingShows, setLoadingShows] = useState(false);

  useEffect(() => {
    customerApi.getEvents().then(setEvents).finally(() => setLoading(false));
  }, []);

  const filteredEvents = events.filter((evt) => {
    if (selectedType === 'movies' && evt.type !== 'movie') return false;
    if (selectedType === 'concerts' && evt.type !== 'concert') return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchesTitle = evt.title.toLowerCase().includes(q);
      const matchesDesc = (evt.description || '').toLowerCase().includes(q);
      if (!matchesTitle && !matchesDesc) return false;
    }
    return true;
  });

  const handleOpenShows = async (evt) => {
    setSelectedEventForShows(evt);
    setLoadingShows(true);
    try {
      const shs = await customerApi.getShowsForEvent(evt.id);
      setShows(shs);
    } finally {
      setLoadingShows(false);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="pill-tag pill-tag-lime">CURATED EVENTS</span>
        </div>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 900, marginBottom: '8px' }}>Explore Movies & Live Concerts</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Search upcoming screenings and shows with live seat selection.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '20px', marginBottom: '36px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '14px' }} />
          <input
            type="text"
            placeholder="Search by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '44px' }}
          />
        </div>

        <div style={{ display: 'flex', background: 'var(--bg-surface-elevated)', padding: '4px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)' }}>
          {[
            { id: 'all', label: 'All Shows' },
            { id: 'movies', label: '🍿 Movies' },
            { id: 'concerts', label: '🎸 Concerts' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id)}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: selectedType === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
                background: selectedType === t.id ? 'var(--bg-surface)' : 'transparent',
                boxShadow: selectedType === t.id ? 'var(--shadow-sm)' : 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          Loading events…
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid-cards">
          {filteredEvents.map((evt) => (
            <div key={evt.id} className="glass-card-interactive" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', height: '160px' }}>
                <EventArt type={evt.type} />
                <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                  <span className={`pill-tag ${evt.type === 'movie' ? 'pill-tag-movie' : 'pill-tag-concert'}`}>
                    {evt.type.toUpperCase()}
                  </span>
                </div>
              </div>

              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>{evt.title}</h3>
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

                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <button onClick={() => handleOpenShows(evt)} className="btn-secondary" style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}>
                    View Showtimes
                  </button>
                  <button onClick={() => onSelectEvent(evt)} className="btn-primary" style={{ padding: '10px 18px', fontSize: '0.85rem' }}>
                    Book
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Film size={40} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '6px' }}>No matching shows found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
            Try resetting your search query or type filter.
          </p>
          <button onClick={() => { setSearch(''); setSelectedType('all'); }} className="btn-primary">
            Reset All Filters
          </button>
        </div>
      )}

      {selectedEventForShows && (
        <div className="modal-backdrop" onClick={() => setSelectedEventForShows(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '6px' }}>{selectedEventForShows.title}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Select a showtime to enter the live seat map:
            </p>

            {loadingShows ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Loading scheduled shows...</div>
            ) : shows.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                {shows.map((sh) => (
                  <div key={sh.id} className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border-subtle)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Clock size={14} color="var(--accent-lime)" />
                        <strong style={{ fontSize: '1.05rem', fontFamily: 'var(--font-mono)' }}>{sh.show_time}</strong>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>• {sh.show_date}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <MapPin size={12} /> {sh.venue_name}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onSelectEvent(selectedEventForShows, sh);
                        setSelectedEventForShows(null);
                      }}
                      className="btn-primary"
                      style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                    >
                      Select Seats <ChevronRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No active showtimes scheduled for this event.
              </div>
            )}

            <button onClick={() => setSelectedEventForShows(null)} className="btn-secondary" style={{ width: '100%' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
