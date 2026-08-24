import React, { useState, useEffect } from 'react';
import { customerApi } from '../services/api';
import { Search, Film, Calendar, Clock, MapPin, Star, Ticket, Filter, ChevronRight } from 'lucide-react';

export function ExplorePage({ onSelectEvent }) {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedEventForShows, setSelectedEventForShows] = useState(null);
  const [shows, setShows] = useState([]);
  const [loadingShows, setLoadingShows] = useState(false);

  useEffect(() => {
    customerApi.getEvents().then((evts) => setEvents(evts));
  }, []);

  const genres = ['all', 'Sci-Fi', 'Action', 'Live Music', 'Pop', 'Drama', 'Epic'];

  const filteredEvents = events.filter((evt) => {
    if (selectedType === 'movies' && evt.type !== 'movie') return false;
    if (selectedType === 'concerts' && evt.type !== 'concert') return false;
    if (selectedGenre !== 'all' && !evt.genre?.includes(selectedGenre)) return false;
    if (search.trim() && !evt.title.toLowerCase().includes(search.toLowerCase()) && !evt.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleOpenShows = async (evt) => {
    setSelectedEventForShows(evt);
    setLoadingShows(true);
    const shs = await customerApi.getShowsForEvent(evt.id);
    setShows(shs);
    setLoadingShows(false);
  };

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="pill-tag pill-tag-lime">CURATED EVENTS</span>
          <span className="pill-tag pill-tag-movie">ALL SHOWTIMES</span>
        </div>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 900, marginBottom: '8px' }}>
          Explore Movies & Live Concerts
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Search upcoming cinema premieres, IMAX screenings, and arena tours with live seat selection.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '20px',
          marginBottom: '36px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '14px' }} />
            <input
              type="text"
              placeholder="Search by movie title, artist, or genre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '44px' }}
            />
          </div>

          {/* Type Toggle */}
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

        {/* Genre Filter Chips */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginRight: '4px' }}>
            GENRE:
          </span>
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              style={{
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                border: `1px solid ${selectedGenre === g ? 'var(--accent-lime)' : 'var(--border-subtle)'}`,
                background: selectedGenre === g ? 'rgba(204, 255, 0, 0.15)' : 'transparent',
                color: selectedGenre === g ? 'var(--accent-lime)' : 'var(--text-secondary)',
              }}
            >
              {g === 'all' ? 'All Genres' : g}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length > 0 ? (
        <div className="grid-cards">
          {filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="glass-card-interactive"
              style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ position: 'relative', height: '200px' }}>
                <img
                  src={evt.banner}
                  alt={evt.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                  <span className={`pill-tag ${evt.type === 'movie' ? 'pill-tag-movie' : 'pill-tag-concert'}`}>
                    {evt.type.toUpperCase()}
                  </span>
                </div>
                <div
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    background: 'rgba(0,0,0,0.8)',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-full)',
                    color: 'var(--cat-vip)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Star size={12} fill="currentColor" /> {evt.rating}
                </div>
              </div>

              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                  {evt.runtime} • {evt.releaseDate}
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>
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

                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <button
                    onClick={() => handleOpenShows(evt)}
                    className="btn-secondary"
                    style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
                  >
                    View Showtimes
                  </button>
                  <button
                    onClick={() => onSelectEvent(evt)}
                    className="btn-primary"
                    style={{ padding: '10px 18px', fontSize: '0.85rem' }}
                  >
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
            Try resetting your search query or selecting a different genre.
          </p>
          <button onClick={() => { setSearch(''); setSelectedType('all'); setSelectedGenre('all'); }} className="btn-primary">
            Reset All Filters
          </button>
        </div>
      )}

      {/* Showtimes Modal / Drawer */}
      {selectedEventForShows && (
        <div className="modal-backdrop" onClick={() => setSelectedEventForShows(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '6px' }}>
              {selectedEventForShows.title}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Select a showtime to enter the live seat map:
            </p>

            {loadingShows ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                Loading scheduled shows...
              </div>
            ) : shows.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                {shows.map((sh) => (
                  <div
                    key={sh.id}
                    className="glass-panel"
                    style={{
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Clock size={14} color="var(--accent-lime)" />
                        <strong style={{ fontSize: '1.05rem', fontFamily: 'var(--font-mono)' }}>{sh.show_time}</strong>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>• {sh.show_date}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <MapPin size={12} /> {sh.venue_name || 'PVR INOX'}
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
