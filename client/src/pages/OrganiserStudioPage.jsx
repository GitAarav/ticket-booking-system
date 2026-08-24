import React, { useState, useEffect } from 'react';
import { organiserApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Plus, Calendar, BarChart3 } from 'lucide-react';

export function OrganiserStudioPage() {
  const { addToast } = useToast();
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [eventSummaries, setEventSummaries] = useState([]);

  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState('movie');
  const [eventDescription, setEventDescription] = useState('');

  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [showDate, setShowDate] = useState('');
  const [showTime, setShowTime] = useState('20:00');
  const [categoryPrices, setCategoryPrices] = useState({});

  const [loadingEvent, setLoadingEvent] = useState(false);
  const [loadingShow, setLoadingShow] = useState(false);

  const loadData = async () => {
    const [evts, vens] = await Promise.all([organiserApi.getEvents(), organiserApi.getVenues()]);
    setEvents(evts);
    setVenues(vens);

    if (evts.length > 0) {
      const summaries = await Promise.all(
        evts.map((evt) => organiserApi.getEventSummary(evt.id).then((s) => ({ ...s, title: evt.title, type: evt.type })))
      );
      setEventSummaries(summaries);
    } else {
      setEventSummaries([]);
    }

    setSelectedEventId((prev) => prev || evts[0]?.id || '');
    setSelectedVenueId((prev) => {
      const initial = prev || vens[0]?.id || '';
      const ven = vens.find((v) => v.id === initial);
      if (ven) {
        const initialPrices = {};
        ven.categories?.forEach((cat) => { initialPrices[cat.id] = 400; });
        setCategoryPrices(initialPrices);
      }
      return initial;
    });
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVenueChange = (venId) => {
    setSelectedVenueId(venId);
    const ven = venues.find((v) => v.id === venId);
    if (ven) {
      const newPrices = {};
      ven.categories?.forEach((cat) => { newPrices[cat.id] = 400; });
      setCategoryPrices(newPrices);
    }
  };

  const handlePriceChange = (catId, val) => {
    setCategoryPrices((prev) => ({ ...prev, [catId]: Math.max(10, Number(val)) }));
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;
    setLoadingEvent(true);
    try {
      const created = await organiserApi.createEvent({ title: eventTitle, type: eventType, description: eventDescription });
      addToast(`Event "${eventTitle}" published — it's now selectable for show scheduling.`, 'success');
      setEventTitle('');
      setEventDescription('');
      await loadData();
      setSelectedEventId(created.id);
    } catch (err) {
      addToast(err.message || 'Failed to create event', 'error');
    } finally {
      setLoadingEvent(false);
    }
  };

  const handleScheduleShow = async (e) => {
    e.preventDefault();
    if (!selectedEventId || !selectedVenueId) {
      addToast('Please select both an event and a venue', 'error');
      return;
    }
    setLoadingShow(true);
    try {
      const pricing = Object.entries(categoryPrices).map(([catId, price]) => ({ categoryId: catId, price: Number(price) }));
      await organiserApi.scheduleShow(selectedEventId, { venueId: selectedVenueId, showDate, showTime, pricing });
      addToast(`Show scheduled on ${showDate} at ${showTime} — a live bookable seat map was created.`, 'success');
      await loadData();
    } catch (err) {
      addToast(err.message || 'Failed to schedule show', 'error');
    } finally {
      setLoadingShow(false);
    }
  };

  const selectedVenue = venues.find((v) => v.id === selectedVenueId);

  const totals = eventSummaries.reduce(
    (acc, s) => ({
      revenue: acc.revenue + Number(s.totalRevenue || 0),
      tickets: acc.tickets + Number(s.ticketsSold || 0),
      shows: acc.shows + Number(s.showsCount || 0),
    }),
    { revenue: 0, tickets: 0, shows: 0 }
  );

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="pill-tag pill-tag-lime">ORGANISER PORTAL</span>
        </div>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 900, marginBottom: '8px' }}>Organiser Studio</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Create event listings, schedule showtimes at any registered venue, set per-category pricing, and track bookings & revenue per event.
        </p>
      </div>

      {events.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <BarChart3 size={20} color="var(--accent-lime)" />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Revenue & Booking Summary</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>TOTAL REVENUE</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-lime)', marginTop: '4px' }}>₹{totals.revenue.toFixed(2)}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Across your events, confirmed bookings only</div>
            </div>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>TICKETS SOLD</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-cyan)', marginTop: '4px' }}>{totals.tickets}</div>
            </div>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>SCHEDULED SHOWS</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-pink)', marginTop: '4px' }}>{totals.shows}</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '14px' }}>Per-Event Breakdown</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-medium)', textAlign: 'left', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                  <th style={{ padding: '10px' }}>EVENT</th>
                  <th style={{ padding: '10px' }}>SHOWS</th>
                  <th style={{ padding: '10px' }}>TICKETS SOLD</th>
                  <th style={{ padding: '10px' }}>REVENUE</th>
                  <th style={{ padding: '10px' }}>OCCUPANCY</th>
                </tr>
              </thead>
              <tbody>
                {eventSummaries.map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 10px', fontWeight: 700 }}>{s.title}</td>
                    <td style={{ padding: '12px 10px', fontFamily: 'var(--font-mono)' }}>{s.showsCount}</td>
                    <td style={{ padding: '12px 10px', fontFamily: 'var(--font-mono)' }}>{s.ticketsSold}</td>
                    <td style={{ padding: '12px 10px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-lime)' }}>₹{s.totalRevenue}</td>
                    <td style={{ padding: '12px 10px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{s.occupancyRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '32px' }}>
        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(204, 255, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-lime)' }}>
              <Plus size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>1. Create Event Listing</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Publish a new movie or concert listing</div>
            </div>
          </div>

          <form onSubmit={handleCreateEvent}>
            <div className="form-group">
              <label className="form-label">Event / Movie Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Avatar 3: Fire and Ash"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Event Type</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEventType('movie')}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 'var(--radius-md)',
                    border: `1px solid ${eventType === 'movie' ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                    background: eventType === 'movie' ? 'rgba(0, 240, 255, 0.12)' : 'var(--bg-surface-elevated)',
                    color: eventType === 'movie' ? 'var(--accent-cyan)' : 'var(--text-secondary)', fontWeight: 700,
                  }}
                >
                  🍿 Movie
                </button>
                <button
                  type="button"
                  onClick={() => setEventType('concert')}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 'var(--radius-md)',
                    border: `1px solid ${eventType === 'concert' ? 'var(--accent-pink)' : 'var(--border-subtle)'}`,
                    background: eventType === 'concert' ? 'rgba(255, 46, 99, 0.12)' : 'var(--bg-surface-elevated)',
                    color: eventType === 'concert' ? 'var(--accent-pink)' : 'var(--text-secondary)', fontWeight: 700,
                  }}
                >
                  🎸 Concert
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                rows={3}
                placeholder="Short description shown to customers..."
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                className="form-input"
                style={{ resize: 'vertical' }}
              />
            </div>

            <button type="submit" disabled={loadingEvent} className="btn-primary" style={{ width: '100%', padding: '12px' }}>
              {loadingEvent ? 'Creating...' : 'Publish Event Listing'}
            </button>
          </form>
        </div>

        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0, 240, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
              <Calendar size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>2. Schedule Show & Pricing</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pick a venue, a date/time, and set a price per category</div>
            </div>
          </div>

          {events.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Create an event first (left panel) before scheduling a show.</p>
          ) : venues.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No venues exist yet — ask an admin to register one from the Admin Venues page.</p>
          ) : (
            <form onSubmit={handleScheduleShow}>
              <div className="form-group">
                <label className="form-label">Select Event</label>
                <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)} className="form-input">
                  {events.map((evt) => (
                    <option key={evt.id} value={evt.id}>{evt.title} ({evt.type.toUpperCase()})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Venue</label>
                <select value={selectedVenueId} onChange={(e) => handleVenueChange(e.target.value)} className="form-input">
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Show Date</label>
                  <input type="date" required value={showDate} onChange={(e) => setShowDate(e.target.value)} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Show Time</label>
                  <input type="time" required value={showTime} onChange={(e) => setShowTime(e.target.value)} className="form-input" />
                </div>
              </div>

              <div style={{ marginBottom: '20px', background: 'var(--bg-surface-elevated)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <label className="form-label" style={{ marginBottom: '10px', color: 'var(--accent-lime)' }}>
                  Pricing per Seat Category for this Show
                </label>
                {!selectedVenue?.categories || selectedVenue.categories.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>This venue has no categories yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {selectedVenue.categories.map((cat) => (
                      <div key={cat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{cat.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>₹</span>
                          <input
                            type="number"
                            min="10"
                            value={categoryPrices[cat.id] ?? 400}
                            onChange={(e) => handlePriceChange(cat.id, e.target.value)}
                            className="form-input"
                            style={{ width: '110px', padding: '6px 10px', fontFamily: 'var(--font-mono)' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loadingShow}
                className="btn-primary"
                style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-purple) 100%)', color: '#FFFFFF' }}
              >
                {loadingShow ? 'Scheduling...' : 'Schedule Show & Open Booking'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
