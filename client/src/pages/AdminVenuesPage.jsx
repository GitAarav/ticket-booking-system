import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Plus, MapPin, Grid, Trash2 } from 'lucide-react';

export function AdminVenuesPage() {
  const { addToast } = useToast();
  const [venues, setVenues] = useState([]);
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [loadingVenue, setLoadingVenue] = useState(false);

  const [categories, setCategories] = useState([
    { name: 'VIP Recliner' },
    { name: 'Prime Club' },
    { name: 'Standard Cine' },
  ]);

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
    setCategories((prev) => [...prev, { name: '' }]);
  };

  const handleRemoveCategory = (index) => {
    if (categories.length <= 1) {
      addToast('A venue must have at least one seat category', 'error');
      return;
    }
    setCategories((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCategoryChange = (index, value) => {
    setCategories((prev) => prev.map((cat, i) => (i === index ? { ...cat, name: value } : cat)));
  };

  const handleCreateVenue = async (e) => {
    e.preventDefault();
    if (!venueName.trim()) return;
    if (categories.some((c) => !c.name.trim())) {
      addToast('Every seat category needs a name', 'error');
      return;
    }
    setLoadingVenue(true);
    try {
      const venue = await adminApi.createVenue({ name: venueName, address: venueAddress });

      const createdCategories = [];
      for (const cat of categories) {
        const created = await adminApi.createCategory(venue.id, cat.name);
        createdCategories.push(created);
      }

      const rowLabels = Array.from({ length: rowsCount }, (_, i) => String.fromCharCode(65 + i));
      const seats = [];
      rowLabels.forEach((rowLabel, rIdx) => {
        const category = createdCategories[Math.min(rIdx, createdCategories.length - 1)];
        for (let seatNumber = 1; seatNumber <= seatsPerRow; seatNumber++) {
          seats.push({ categoryId: category.id, rowLabel, seatNumber, posX: seatNumber, posY: rIdx });
        }
      });
      await adminApi.bulkCreateSeats(venue.id, seats);

      addToast(`Venue "${venueName}" created with ${createdCategories.length} categories and ${seats.length} seats.`, 'success');
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
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="pill-tag pill-tag-concert">ADMIN CONSOLE</span>
          <span className="pill-tag pill-tag-lime">VENUE & SEATMAP BUILDER</span>
        </div>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 900, marginBottom: '8px' }}>Venue Management</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Register a venue with seat categories and a seat grid. Organisers pick from these venues when scheduling shows.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '32px' }}>
        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255, 46, 99, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-pink)' }}>
              <Plus size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Create New Venue</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Venue, categories, and seat grid — all in one step</div>
            </div>
          </div>

          <form onSubmit={handleCreateVenue}>
            <div className="form-group">
              <label className="form-label">Venue Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Cinepolis IMAX Grand Central"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Address</label>
              <input
                type="text"
                placeholder="e.g. Phoenix MarketCity, Kurla, Mumbai"
                value={venueAddress}
                onChange={(e) => setVenueAddress(e.target.value)}
                className="form-input"
              />
            </div>

            <div style={{ marginBottom: '20px', background: 'var(--bg-surface-elevated)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label className="form-label" style={{ margin: 0, color: 'var(--accent-cyan)' }}>Seat Categories</label>
                <button type="button" onClick={handleAddCategory} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                  <Plus size={12} /> Add Category
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {categories.map((cat, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Category name"
                      value={cat.name}
                      onChange={(e) => handleCategoryChange(idx, e.target.value)}
                      className="form-input"
                      style={{ flex: 1, padding: '6px 10px', fontSize: '0.85rem' }}
                    />
                    {categories.length > 1 && (
                      <button type="button" onClick={() => handleRemoveCategory(idx)} className="btn-icon" style={{ padding: '6px' }}>
                        <Trash2 size={14} color="var(--accent-pink)" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                Prices are set per show by the organiser, not here — a venue's categories are just tiers (e.g. VIP, Standard).
              </p>
            </div>

            <button type="submit" disabled={loadingVenue} className="btn-primary" style={{ width: '100%', padding: '12px' }}>
              {loadingVenue ? 'Creating venue, categories & seats…' : 'Create Venue'}
            </button>
          </form>
        </div>

        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(204, 255, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-lime)' }}>
              <Grid size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Seat Grid Dimensions</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {rowsCount} Rows × {seatsPerRow} Seats ({rowsCount * seatsPerRow} seats total) — rows are assigned to categories in order
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

          <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
              ✦ SEAT GRID PREVIEW ✦
            </div>
            {Array.from({ length: rowsCount }).map((_, rIdx) => {
              const rowChar = String.fromCharCode(65 + rIdx);
              const catForThisRow = categories[Math.min(rIdx, categories.length - 1)];
              return (
                <div key={rIdx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ width: '16px', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{rowChar}</span>
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

      <div style={{ marginTop: '48px' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '20px' }}>Your Registered Venues</h2>
        {venues.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No venues created yet.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {venues.map((v) => (
              <div key={v.id} className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <MapPin size={16} color="var(--accent-lime)" />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{v.name}</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>{v.address || 'No address provided'}</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {v.categories?.map((c) => (
                    <span key={c.id} className="pill-tag pill-tag-lime">{c.name}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
