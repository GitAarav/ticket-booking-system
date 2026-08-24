import React, { useEffect, useState } from 'react';
import { subscribeToSeatmap } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Sparkles, Radio, Users, Lock, Check } from 'lucide-react';

export function LiveSeatMap({
  showId,
  seatmap,
  setSeatmap,
  selectedSeats,
  onToggleSeat,
  onOpenWaitlist,
  pricingByCategory = {},
}) {
  const { addToast } = useToast();
  const [hoveredSeat, setHoveredSeat] = useState(null);

  useEffect(() => {
    if (!showId) return;
    const unsubscribe = subscribeToSeatmap(showId, (updatedMap) => {
      setSeatmap(updatedMap);
    });
    return () => unsubscribe();
  }, [showId, setSeatmap]);

  const getCategoryColor = (catName = '') => {
    const lower = catName.toLowerCase();
    if (lower.includes('vip') || lower.includes('recliner')) return 'var(--cat-vip)';
    if (lower.includes('prime') || lower.includes('pit') || lower.includes('club')) return 'var(--cat-premium)';
    return 'var(--cat-standard)';
  };

  const categoryStats = {};
  seatmap?.forEach((row) => {
    row.seats.forEach((st) => {
      const catId = st.category?.id || 'std';
      if (!categoryStats[catId]) {
        categoryStats[catId] = {
          name: st.category?.name || 'Standard',
          price: pricingByCategory[catId],
          total: 0,
          available: 0,
        };
      }
      categoryStats[catId].total += 1;
      if (st.status === 'available') {
        categoryStats[catId].available += 1;
      }
    });
  });

  return (
    <div className="cinema-container glass-panel">
      {/* Live Status Bar & Categories Legend */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="status-dot live" />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            LIVE THEATRE GRID • REAL-TIME SEAT SYNC
          </span>
        </div>

        {/* Categories Legend */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {Object.entries(categoryStats).map(([catId, stat]) => (
            <div key={catId} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '3px',
                  background: getCategoryColor(stat.name),
                }}
              />
              <span style={{ fontWeight: 600 }}>{stat.name}</span>
              <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                ₹{stat.price ?? '—'}
              </span>
              {stat.available === 0 && (
                <button
                  onClick={() => onOpenWaitlist(catId, stat.name)}
                  className="pill-tag pill-tag-concert"
                  style={{ fontSize: '0.65rem', padding: '2px 8px', cursor: 'pointer' }}
                >
                  SOLD OUT • JOIN WAITLIST
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Curved Cinema Screen with Projection Glow */}
      <div className="cinema-screen-wrap">
        <div className="cinema-screen-curve" />
        <div className="cinema-screen-beam" />
        <div className="cinema-screen-label">✦ ALL EYES ON THE SCREEN ✦</div>
      </div>

      {/* Visual Seat Grid */}
      <div className="seat-grid-wrap">
        {seatmap && seatmap.length > 0 ? (
          seatmap.map((row) => (
            <div key={row.rowLabel} className="seat-row">
              <div className="row-label">{row.rowLabel}</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {row.seats.map((seat) => {
                  const isSelected = selectedSeats.some((s) => s.id === seat.id);
                  const isHeld = seat.status === 'held';
                  const isBooked = seat.status === 'booked';

                  return (
                    <button
                      key={seat.id}
                      disabled={isBooked || isHeld}
                      onClick={() => onToggleSeat({ ...seat, rowLabel: row.rowLabel })}
                      onMouseEnter={() => setHoveredSeat(seat)}
                      onMouseLeave={() => setHoveredSeat(null)}
                      className={`seat-btn ${seat.status} ${isSelected ? 'selected' : ''}`}
                      title={`${row.rowLabel}${seat.seatNumber} • ${seat.category?.name || 'Standard'} (₹${pricingByCategory[seat.category?.id] ?? '—'}) - Status: ${seat.status}`}
                    >
                      {isSelected ? (
                        <Check size={14} strokeWidth={3} />
                      ) : isBooked ? (
                        '✕'
                      ) : isHeld ? (
                        <Lock size={12} />
                      ) : (
                        seat.seatNumber
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="row-label">{row.rowLabel}</div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Loading live cinema seatmap...
          </div>
        )}
      </div>

      {/* Seat Status Legend */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          marginTop: '36px',
          flexWrap: 'wrap',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="seat-btn" style={{ width: '22px', height: '22px', fontSize: '0.65rem' }}>1</div>
          <span>Available</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="seat-btn selected" style={{ width: '22px', height: '22px', fontSize: '0.65rem' }}>✓</div>
          <span>Selected (You)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="seat-btn held" style={{ width: '22px', height: '22px', fontSize: '0.65rem' }}>🔒</div>
          <span>Held (10m Lock)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="seat-btn booked" style={{ width: '22px', height: '22px', fontSize: '0.65rem' }}>✕</div>
          <span>Booked</span>
        </div>
      </div>

      {/* Hover Tooltip Overlay */}
      {hoveredSeat && (
        <div
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Sparkles size={14} color="var(--accent-lime)" />
          <span>
            SEAT <strong>{hoveredSeat.seatNumber}</strong> • {hoveredSeat.category?.name || 'Standard'} • ₹{pricingByCategory[hoveredSeat.category?.id] ?? '—'} • STATUS:{' '}
            <strong style={{ color: hoveredSeat.status === 'available' ? 'var(--accent-lime)' : 'var(--accent-pink)' }}>
              {hoveredSeat.status.toUpperCase()}
            </strong>
          </span>
        </div>
      )}
    </div>
  );
}
