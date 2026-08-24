import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { ShieldAlert, Plus, MapPin, Grid, Layers, Sparkles, Trash2 } from 'lucide-react';

export function AdminVenuesPage() {
  const { addToast } = useToast();
  const [venues, setVenues] = useState([]);
  const [venueName, setVenueName] = useState('');
  const [venueCity, setVenueCity] = useState('Mumbai');
  const [venueAddress, setVenueAddress] = useState('');
  const [loadingVenue, setLoadingVenue] = useState(false);

  // Category Configuration
  const [categories, setCategories] = useState([
    { id: 'cat-vip', name: 'VIP Recliner', price: '750' },
    { id: 'cat-premium', name: 'Prime Club', price: '500' },
    { id: 'cat-standard', name: 'Standard Cine', price: '320' },
  ]);

  // Bulk Grid Dimensions
  const [rowsCount, setRowsCount] = useState(4);
  const [seatsPerRow, setSeatsPerRow] = useState(8);

  const fetchVenues = async () => {
    const v = await adminApi.getVenues();
    setVenues(v);
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  const handleAddCategory = () => {
    const newId = `cat-custom-${Date.now()}`;
    setCategories((prev) => [...prev, { id: newId, name: 'Executive Gold', price: '450' }]);
  };

  const handleRemoveCategory = (index) => {
    if (categories.length <= 1) {
      addToast('A venue must have at least one seat category', 'error');
      return;
    }
    setCategories((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCategoryChange = (index, field, value) => {
    setCategories((prev) =>
      prev.map((cat, i) => (i === index ? { ...cat, [field]: value } : cat))
    );
  };

  const handleCreateVenue = async (e) => {
    e.preventDefault();
    if (!venueName.trim()) return;
    setLoadingVenue(true);
    try {
      const rows = Array.from({ length: rowsCount }, (_, i) => String.fromCharCode(65 + i));
      await adminApi.createVenue({
        name: venueName,
        city: venueCity,
        address: venueAddress,
        categories,
        rows,
        seatsPerRow,
      });

      addToast(`🎉 Venue "${venueName}" created with ${categories.length} seat categories!`, 'success');
      setVenueName('');
      setVenueAddress('');
      await fetchVenues();
    } catch (err) {
      addToast(err.message || 'Error creating venue', 'error');
    } finally {
      setLoadingVenue(false);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="pill-tag pill-tag-concert">ADMIN CONSOLE</span>
          <span className="pill-tag pill-tag-lime">VENUE & SEATMAP ARCHITECT</span>
        </div>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 900, marginBottom: '8px' }}>
          Venue Management & Blueprint Builder
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Register cinema halls, multiplexes, and concert stadiums with custom tier categories and seat grid dimensions.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '32px' }}>
        {/* Create Venue Form */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(255, 46, 99, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-pink)',
              }}
            >
              <Plus size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Create New Venue</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Define multiplex / stadium location</div>
            </div>
          </div>

          <form onSubmit={handleCreateVenue}>
            <div className="form-group">
              <label className="form-label">Venue / Multiplex Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Cinepolis IMAX Grand Central"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                className="form-input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">City</label>
                <select
                  value={venueCity}
                  onChange={(e) => setVenueCity(e.target.value)}
                  className="form-input"
                >
                  <option value="Mumbai">Mumbai</option>
                  <option value="Delhi NCR">Delhi NCR</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Chennai">Chennai</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Physical Address</label>
                <input
                  type="text"
                  placeholder="e.g. Phoenix MarketCity, Kurla"
                  value={venueAddress}
                  onChange={(e) => setVenueAddress(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            {/* Custom Seat Categories */}
            <div style={{ marginBottom: '20px', background: 'var(--bg-surface-elevated)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label className="form-label" style={{ margin: 0, color: 'var(--accent-cyan)' }}>
                  Seat Categories & Base Pricing
                </label>
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="btn-outline"
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                >
                  <Plus size={12} /> Add Tier
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {categories.map((cat, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Category Name"
                      value={cat.name}
                      onChange={(e) => handleCategoryChange(idx, 'name', e.target.value)}
                      className="form-input"
                      style={{ flex: 2, padding: '6px 10px', fontSize: '0.85rem' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>₹</span>
                      <input
                        type="number"
                        min="50"
                        placeholder="Price"
                        value={cat.price}
                        onChange={(e) => handleCategoryChange(idx, 'price', e.target.value)}
                        className="form-input"
                        style={{ padding: '6px 8px', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}
                      />
                    </div>
                    {categories.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(idx)}
                        className="btn-icon"
                        style={{ padding: '6px' }}
                      >
                        <Trash2 size={14} color="var(--accent-pink)" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingVenue}
              className="btn-primary"
              style={{ width: '100%', padding: '12px' }}
            >
              {loadingVenue ? 'Registering...' : 'Register Venue & Categories'}
            </button>
          </form>
        </div>

        {/* Blueprint Layout Grid Preview */}
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
              <Grid size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Seat Grid Dimensions</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Configured: {rowsCount} Rows × {seatsPerRow} Seats ({rowsCount * seatsPerRow} Seats)
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div className="form-group">
              <label className="form-label">Total Rows</label>
              <input
                type="number"
                min="1"
                max="8"
                value={rowsCount}
                onChange={(e) => setRowsCount(Math.min(8, Math.max(1, Number(e.target.value))))}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Seats per Row</label>
              <input
                type="number"
                min="2"
                max="10"
                value={seatsPerRow}
                onChange={(e) => setSeatsPerRow(Math.min(10, Math.max(2, Number(e.target.value))))}
                className="form-input"
              />
            </div>
          </div>

          {/* Blueprint Mini-Grid */}
          <div
            style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
              ✦ SCREEN BLUEPRINT ORIENTATION ✦
            </div>
            {Array.from({ length: rowsCount }).map((_, rIdx) => {
              const rowChar = String.fromCharCode(65 + rIdx);
              const catForThisRow = categories[Math.min(rIdx, categories.length - 1)];
              return (
                <div key={rIdx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ width: '16px', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {rowChar}
                  </span>
                  {Array.from({ length: seatsPerRow }).map((_, sIdx) => (
                    <div
                      key={sIdx}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        background: rIdx === 0 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(0, 240, 255, 0.2)',
                        border: `1px solid ${rIdx === 0 ? 'var(--cat-vip)' : 'var(--accent-cyan)'}`,
                        fontSize: '0.6rem',
                        fontFamily: 'var(--font-mono)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title={`${rowChar}${sIdx + 1} (${catForThisRow?.name || 'Standard'})`}
                    >
                      {sIdx + 1}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Registered Venues List */}
      <div style={{ marginTop: '48px' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '20px' }}>Active Registered Venues</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {venues.map((v) => (
            <div key={v.id} className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <MapPin size={16} color="var(--accent-lime)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{v.name}</h3>
                <span className="pill-tag pill-tag-movie" style={{ fontSize: '0.7rem' }}>{v.city || 'Mumbai'}</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
                {v.address || 'Standard Multiplex Address'}
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {v.categories?.map((c) => (
                  <span key={c.id} className="pill-tag pill-tag-lime">
                    {c.name} (₹{c.price})
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
