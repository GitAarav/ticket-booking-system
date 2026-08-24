import React, { useState, useEffect } from 'react';
import { customerApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { LiveSeatMap } from '../components/LiveSeatMap';
import { HoldTimerDrawer } from '../components/HoldTimerDrawer';
import { BookingModal } from '../components/BookingModal';
import { WaitlistModal } from '../components/WaitlistModal';
import { ArrowLeft, Calendar, Clock, MapPin, Sparkles, ShieldCheck, Film } from 'lucide-react';

export function SeatSelectionPage({ event, show, onBack, onBookingSuccess }) {
  const { addToast } = useToast();
  const { user } = useAuth();
  const [seatmap, setSeatmap] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [isHeld, setIsHeld] = useState(false);
  const [heldUntil, setHeldUntil] = useState(null);
  const [loadingHold, setLoadingHold] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  
  // Waitlist modal state
  const [waitlistModalData, setWaitlistModalData] = useState(null);

  const showId = show?.id || 'show-01';

  useEffect(() => {
    customerApi.getSeatmap(showId).then((map) => setSeatmap(map));
  }, [showId]);

  const handleToggleSeat = (seat) => {
    if (selectedSeats.some((s) => s.id === seat.id)) {
      setSelectedSeats((prev) => prev.filter((s) => s.id !== seat.id));
      setIsHeld(false);
      setHeldUntil(null);
    } else {
      if (selectedSeats.length >= 10) {
        addToast('Maximum 10 seats can be selected per transaction.', 'error');
        return;
      }
      setSelectedSeats((prev) => [...prev, seat]);
      setIsHeld(false);
      setHeldUntil(null);
    }
  };

  const handleHoldSeats = async () => {
    if (selectedSeats.length === 0) return;
    setLoadingHold(true);
    try {
      const seatIds = selectedSeats.map((s) => s.id);
      const res = await customerApi.holdSeats(showId, seatIds);
      if (res && res.ok) {
        setIsHeld(true);
        // Set 10 min TTL
        const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        setHeldUntil(expires);
        addToast('🔒 Seats held for 10 minutes! Complete checkout before expiration.', 'success');
      } else {
        addToast(res?.error || 'One or more selected seats are no longer available', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Hold failed', 'error');
    } finally {
      setLoadingHold(false);
    }
  };

  const handleProceedCheckout = () => {
    setIsBookingModalOpen(true);
  };

  const handleConfirmSuccess = async (customerDetails) => {
    const seatIds = selectedSeats.map((s) => s.id);
    const res = await customerApi.confirmBooking(showId, seatIds, customerDetails);
    if (res && res.ok) {
      setSelectedSeats([]);
      setIsHeld(false);
      setHeldUntil(null);
      if (onBookingSuccess) onBookingSuccess(res.booking);
    } else {
      throw new Error(res?.error || 'Confirmation failed');
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '140px' }}>
      {/* Back Button & Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={onBack}
          className="btn-outline"
          style={{ padding: '8px 16px', fontSize: '0.85rem', marginBottom: '16px' }}
        >
          <ArrowLeft size={16} /> Back to Shows
        </button>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className={`pill-tag ${event?.type === 'movie' ? 'pill-tag-movie' : 'pill-tag-concert'}`}>
                {event?.type?.toUpperCase() || 'CINEMA'}
              </span>
              <span className="pill-tag pill-tag-lime">LIVE SEAT SELECTOR</span>
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '6px' }}>
              {event?.title || 'Dune: Part Two (IMAX 70mm)'}
            </h1>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} color="var(--accent-lime)" /> {show?.show_date || '2026-09-10'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} color="var(--accent-cyan)" /> {show?.show_time || '18:30'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} color="var(--accent-pink)" /> {show?.venue_name || 'PVR INOX Neo-Plex Horizon'}
              </span>
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-medium)',
              padding: '12px 18px',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'right',
            }}
          >
            <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              RESERVATION GUARANTEE
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-lime)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} /> 10-Minute Hold Window
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Seatmap Grid */}
      <LiveSeatMap
        showId={showId}
        seatmap={seatmap}
        setSeatmap={setSeatmap}
        selectedSeats={selectedSeats}
        onToggleSeat={handleToggleSeat}
        onOpenWaitlist={(categoryId, categoryName) =>
          setWaitlistModalData({ categoryId, categoryName })
        }
      />

      {/* Bottom Sticky Hold Progress Drawer */}
      <HoldTimerDrawer
        selectedSeats={selectedSeats}
        isHeld={isHeld}
        heldUntil={heldUntil}
        onHoldSeats={handleHoldSeats}
        onProceedCheckout={handleProceedCheckout}
        onClearSelection={() => {
          setSelectedSeats([]);
          setIsHeld(false);
          setHeldUntil(null);
        }}
        loading={loadingHold}
      />

      {/* Booking Checkout Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        show={{
          ...show,
          title: event?.title || 'Live Show',
          venue_name: show?.venue_name || 'PVR INOX Neo-Plex',
        }}
        selectedSeats={selectedSeats}
        onConfirmSuccess={handleConfirmSuccess}
      />

      {/* Waitlist Modal */}
      {waitlistModalData && (
        <WaitlistModal
          isOpen={!!waitlistModalData}
          onClose={() => setWaitlistModalData(null)}
          showId={showId}
          showTitle={event?.title || 'Live Show'}
          categoryId={waitlistModalData.categoryId}
          categoryName={waitlistModalData.categoryName}
        />
      )}
    </div>
  );
}
