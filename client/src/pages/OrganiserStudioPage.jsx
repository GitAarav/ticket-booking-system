import React, { useState, useEffect } from 'react';
import { organiserApi, adminApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Layers, Plus, Calendar, Clock, MapPin, Sparkles, DollarSign, CheckCircle2, Film, TrendingUp, Users, Ticket, BarChart3 } from 'lucide-react';

export function OrganiserStudioPage({ setView }) {
  const { addToast } = useToast();
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  
  // Create Event Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState('movie');
  const [eventDescription, setEventDescription] = useState('');
  const [eventRuntime, setEventRuntime] = useState('2h 30m');
  const [eventLanguage, setEventLanguage] = useState('English, Dolby Atmos');
  
  // Schedule Show Form State
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [showDate, setShowDate] = useState('2026-09-25');
  const [showTime, setShowTime] = useState('20:00');
  const [categoryPrices, setCategoryPrices] = useState({});

  const [loadingEvent, setLoadingEvent] = useState(false);
  const [loadingShow, setLoadingShow] = useState(false);

  const loadData = async () => {
    const [evts, vens, stats] = await Promise.all([
      organiserApi.getEvents(),
      adminApi.getVenues(),
      organiserApi.getRevenueAnalytics(),
    ]);

    setEvents(evts);
    setVenues(vens);
    setAnalytics(stats);

    if (evts.length > 0 && !selectedEventId) {
      setSelectedEventId(evts[0].id);
    }
    if (vens.length > 0 && !selectedVenueId) {
      setSelectedVenueId(vens[0].id);
      // Initialize category prices for this venue
      const initialPrices = {};
      vens[0].categories?.forEach((cat) => {
        initialPrices[cat.id] = Number(cat.price) || 400;
      });
      setCategoryPrices(initialPrices);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When venue changes, update dynamic category prices map
  const handleVenueChange = (venId) => {
    setSelectedVenueId(venId);
    const ven = venues.find((v) => v.id === venId);
    if (ven) {
      const newPrices = {};
      ven.categories?.forEach((cat) => {
        newPrices[cat.id] = Number(cat.price) || 400;
      });
      setCategoryPrices(newPrices);
    }
  };

  const handlePriceChange = (catId, val) => {
    setCategoryPrices((prev) => ({
      ...prev,
      [catId]: Math.max(10, Number(val)),
    }));
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;
    setLoadingEvent(true);
    try {
      const created = await organiserApi.createEvent({
        title: eventTitle,
        type: eventType,
        description: eventDescription,
        runtime: eventRuntime,
        language: eventLanguage,
      });
      addToast(`🎉 Event "${eventTitle}" published! It is now selectable for show scheduling.`, 'success');
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
      const pricing = Object.entries(categoryPrices).map(([catId, price]) => ({
        categoryId: catId,
        price: Number(price),
      }));

      await organiserApi.scheduleShow({
        eventId: selectedEventId,
        venueId: selectedVenueId,
        showDate,
        showTime,
        pricing,
      });

      addToast(`🎟️ Show scheduled on ${showDate} at ${showTime}! Live bookable seat map created.`, 'success');
      await loadData();
    } catch (err) {
      addToast(err.message || 'Failed to schedule show', 'error');
    } finally {
      setLoadingShow(false);
    }
  };

  const selectedVenue = venues.find((v) => v.id === selectedVenueId) || venues[0];

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="pill-tag pill-tag-lime">ORGANISER PORTAL</span>
          <span className="pill-tag pill-tag-movie">EVENT & SHOWTIME MANAGER</span>
        </div>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 900, marginBottom: '8px' }}>
          Organiser Studio & Analytics
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Create movie and concert listings, schedule showtimes across venues, configure custom tier pricing, and monitor real-time ticket sales & revenue.
        </p>
      </div>

      {/* Revenue & Booking Summary Dashboard */}
      {analytics && (
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <BarChart3 size={20} color="var(--accent-lime)" />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Revenue & Booking Summary</h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>TOTAL PLATFORM REVENUE</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-lime)', marginTop: '4px' }}>
                ₹{analytics.totalPlatformRevenue}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>From confirmed bookings</div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>TOTAL TICKETS SOLD</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-cyan)', marginTop: '4px' }}>
                {analytics.totalTicketsSold} Tickets
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Across all active shows</div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>TOTAL ACTIVE SHOWS</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-pink)', marginTop: '4px' }}>
                {analytics.activeShows} Shows
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Scheduled in theatres</div>
            </div>
          </div>

          {/* Per Event Breakdown Table */}
          <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '14px' }}>Event Performance Breakdown</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-medium)', textAlign: 'left', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                  <th style={{ padding: '10px' }}>EVENT TITLE</th>
                  <th style={{ padding: '10px' }}>TYPE</th>
                  <th style={{ padding: '10px' }}>SHOWTIMES</th>
                  <th style={{ padding: '10px' }}>TICKETS SOLD</th>
                  <th style={{ padding: '10px' }}>TOTAL REVENUE</th>
                  <th style={{ padding: '10px' }}>OCCUPANCY</th>
                </tr>
              </thead>
              <tbody>
                {analytics.eventsSummary?.map((evt) => (
                  <tr key={evt.eventId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 10px', fontWeight: 700 }}>{evt.title}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <span className={`pill-tag ${evt.type === 'movie' ? 'pill-tag-movie' : 'pill-tag-concert'}`} style={{ fontSize: '0.7rem' }}>
                        {evt.type.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px', fontFamily: 'var(--font-mono)' }}>{evt.showsCount} scheduled</td>
                    <td style={{ padding: '12px 10px', fontFamily: 'var(--font-mono)' }}>{evt.ticketsSold} seats</td>
                    <td style={{ padding: '12px 10px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-lime)' }}>₹{evt.totalRevenue}</td>
                    <td style={{ padding: '12px 10px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{evt.occupancyRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '32px' }}>
        {/* Panel 1: Create New Event */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(204, 255, 0, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-lime)',
              }}
            >
              <Plus size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>1. Create Event Listing</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Publish new movie or concert listing</div>
            </div>
          </div>

          <form onSubmit={handleCreateEvent}>
            <div className="form-group">
              <label className="form-label">Event / Movie Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Avatar 3: Fire and Ash (IMAX 3D)"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Event Category</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEventType('movie')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${eventType === 'movie' ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                    background: eventType === 'movie' ? 'rgba(0, 240, 255, 0.12)' : 'var(--bg-surface-elevated)',
                    color: eventType === 'movie' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                    fontWeight: 700,
                  }}
                >
                  🍿 Movie (Cinema)
                </button>
                <button
                  type="button"
                  onClick={() => setEventType('concert')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${eventType === 'concert' ? 'var(--accent-pink)' : 'var(--border-subtle)'}`,
                    background: eventType === 'concert' ? 'rgba(255, 46, 99, 0.12)' : 'var(--bg-surface-elevated)',
                    color: eventType === 'concert' ? 'var(--accent-pink)' : 'var(--text-secondary)',
                    fontWeight: 700,
                  }}
                >
                  🎸 Live Concert
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Runtime</label>
                <input
                  type="text"
                  placeholder="e.g. 2h 45m"
                  value={eventRuntime}
                  onChange={(e) => setEventRuntime(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Language / Format</label>
                <input
                  type="text"
                  placeholder="e.g. English, IMAX 3D"
                  value={eventLanguage}
                  onChange={(e) => setEventLanguage(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description & Synopsis</label>
              <textarea
                rows={3}
                placeholder="Cinematic description of the event or movie..."
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                className="form-input"
                style={{ resize: 'vertical' }}
              />
            </div>

            <button
              type="submit"
              disabled={loadingEvent}
              className="btn-primary"
              style={{ width: '100%', padding: '12px' }}
            >
              {loadingEvent ? 'Creating...' : 'Publish Event Listing'}
            </button>
          </form>
        </div>

        {/* Panel 2: Schedule Show & Dynamic Pricing */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(0, 240, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)',
              }}
            >
              <Calendar size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>2. Schedule Show & Pricing</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Clone venue seat blueprint into live bookable show</div>
            </div>
          </div>

          <form onSubmit={handleScheduleShow}>
            {/* Event Dropdown - Dynamically Updated */}
            <div className="form-group">
              <label className="form-label">Select Event</label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="form-input"
              >
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.title} ({evt.type.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Venue Dropdown - Dynamically Updated */}
            <div className="form-group">
              <label className="form-label">Assigned Venue</label>
              <select
                value={selectedVenueId}
                onChange={(e) => handleVenueChange(e.target.value)}
                className="form-input"
              >
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.city || 'City'})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Show Date</label>
                <input
                  type="date"
                  required
                  value={showDate}
                  onChange={(e) => setShowDate(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Show Time</label>
                <input
                  type="time"
                  required
                  value={showTime}
                  onChange={(e) => setShowTime(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            {/* Dynamic Category Pricing Matrix */}
            <div style={{ marginBottom: '20px', background: 'var(--bg-surface-elevated)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <label className="form-label" style={{ marginBottom: '10px', color: 'var(--accent-lime)' }}>
                💰 Custom Pricing per Seat Category for this Show
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedVenue?.categories?.map((cat) => (
                  <div key={cat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{cat.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>₹</span>
                      <input
                        type="number"
                        min="50"
                        value={categoryPrices[cat.id] || 400}
                        onChange={(e) => handlePriceChange(cat.id, e.target.value)}
                        className="form-input"
                        style={{ width: '110px', padding: '6px 10px', fontFamily: 'var(--font-mono)' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingShow}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-purple) 100%)',
                color: '#FFFFFF',
              }}
            >
              {loadingShow ? 'Scheduling...' : 'Schedule Show & Open Booking'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
