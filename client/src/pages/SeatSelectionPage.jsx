import React, { useState, useEffect } from 'react';
import { customerApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { LiveSeatMap } from '../components/LiveSeatMap';
import { HoldTimerDrawer } from '../components/HoldTimerDrawer';
import { BookingModal } from '../components/BookingModal';
import { WaitlistModal } from '../components/WaitlistModal';
import { ArrowLeft, Calendar, Clock, MapPin, ShieldCheck } from 'lucide-react';

export function SeatSelectionPage({ event, show, onBack, onBookingSuccess }) {
  const { addToast } = useToast();
  const { user } = useAuth();
  const [seatmap, setSeatmap] = useState([]);
  const [pricingByCategory, setPricingByCategory] = useState({});
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [isHeld, setIsHeld] = useState(false);
  const [heldUntil, setHeldUntil] = useState(null);
  const [loadingHold, setLoadingHold] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [waitlistModalData, setWaitlistModalData] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const showId = show?.id;

  useEffect(() => {
    if (!showId) return;
    setLoadError(null);

    Promise.all([customerApi.getSeatmap(showId), customerApi.getShowDetail(showId)])
      .then(([map, detail]) => {
        const priceByCategory = {};
        for (const p of detail.pricing || []) priceByCategory[p.category_id] = Number(p.price);
        setPricingByCategory(priceByCategory);
        setSeatmap(map);

        // If seats on this show are already held by me (e.g. I navigated away
        // mid-checkout and came back), pick that hold back up instead of
        // leaving no way back to the payment step.
        const myHeldSeats = [];
        for (const row of map) {
          for (const seat of row.seats) {
            if (seat.heldByCustomerId && seat.heldByCustomerId === user?.id) {
              myHeldSeats.push({ ...seat, rowLabel: row.rowLabel, price: priceByCategory[seat.category?.id] || 0 });
            }
          }
        }
        if (myHeldSeats.length > 0) {
          setSelectedSeats(myHeldSeats);
          setIsHeld(true);
          setHeldUntil(myHeldSeats[0].heldUntil);
          addToast('You already have seats on hold for this show — continue below to pay.', 'info');
        }
      })
      .catch((err) => setLoadError(err.message || 'Could not load the seat map'));
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
      const price = pricingByCategory[seat.category?.id] || 0;
      setSelectedSeats((prev) => [...prev, { ...seat, price }]);
      setIsHeld(false);
      setHeldUntil(null);
    }
  };

  // The live seat map updates on its own (polling/SSE), but that's a
  // different piece of state than "seats I've selected/held" — without this,
  // a hold that expired (or got taken by someone else) never clears your
  // selection, and you're left staring at a "pay" button that will just 409.
  useEffect(() => {
    if (!isHeld || selectedSeats.length === 0) return;

    const liveById = {};
    for (const row of seatmap) for (const s of row.seats) liveById[s.id] = s;

    const stillMine = selectedSeats.filter((s) => {
      const live = liveById[s.id];
      return live && live.status === 'held' && live.heldByCustomerId === user?.id;
    });

    if (stillMine.length !== selectedSeats.length) {
      setSelectedSeats(stillMine);
      if (stillMine.length === 0) {
        setIsHeld(false);
        setHeldUntil(null);
        addToast('Your hold expired (or the seat was taken) — please reselect.', 'error');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seatmap]);

  const handleHoldSeats = async () => {
    if (selectedSeats.length === 0) return;
    setLoadingHold(true);
    try {
      const seatIds = selectedSeats.map((s) => s.id);
      const res = await customerApi.holdSeats(showId, seatIds);
      setIsHeld(true);
      setHeldUntil(res.seats?.[0]?.held_until || new Date(Date.now() + 10 * 60 * 1000).toISOString());
      // Patch the local seatmap to match immediately — otherwise the
      // reconciliation effect above sees stale "available" seats (the next
      // poll hasn't landed yet) and instantly undoes the hold we just got.
      setSeatmap((prev) =>
        prev.map((row) => ({
          ...row,
          seats: row.seats.map((s) => {
            const held = res.seats?.find((rs) => rs.id === s.id);
            return held ? { ...s, status: 'held', heldByCustomerId: user?.id, heldUntil: held.held_until } : s;
          }),
        }))
      );
      addToast('Seats held! Complete checkout before the hold expires.', 'success');
    } catch (err) {
      addToast(err.message || 'One or more selected seats are no longer available', 'error');
    } finally {
      setLoadingHold(false);
    }
  };

  const handleProceedCheckout = () => {
    setIsBookingModalOpen(true);
  };

  const handleConfirmSuccess = async () => {
    const seatIds = selectedSeats.map((s) => s.id);
    const res = await customerApi.confirmBooking(showId, seatIds);
    setSelectedSeats([]);
    setIsHeld(false);
    setHeldUntil(null);
    if (onBookingSuccess) onBookingSuccess(res.booking);
  };

  return (
    <div className="container" style={{ paddingBottom: '140px' }}>
      <div style={{ marginBottom: '24px' }}>
        <button onClick={onBack} className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.85rem', marginBottom: '16px' }}>
          <ArrowLeft size={16} /> Back to Shows
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className={`pill-tag ${event?.type === 'movie' ? 'pill-tag-movie' : 'pill-tag-concert'}`}>
                {event?.type?.toUpperCase() || 'SHOW'}
              </span>
              <span className="pill-tag pill-tag-lime">LIVE SEAT SELECTOR</span>
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '6px' }}>{event?.title}</h1>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} color="var(--accent-lime)" /> {show?.show_date}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} color="var(--accent-cyan)" /> {show?.show_time}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} color="var(--accent-pink)" /> {show?.venue_name}
              </span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-medium)', padding: '12px 18px', borderRadius: 'var(--radius-lg)', textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>RESERVATION GUARANTEE</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-lime)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} /> Time-Limited Hold
            </div>
          </div>
        </div>
      </div>

      {loadError ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--accent-pink)' }}>
          {loadError}
        </div>
      ) : (
        <LiveSeatMap
          showId={showId}
          seatmap={seatmap}
          setSeatmap={setSeatmap}
          selectedSeats={selectedSeats}
          onToggleSeat={handleToggleSeat}
          pricingByCategory={pricingByCategory}
          onOpenWaitlist={(categoryId, categoryName) => setWaitlistModalData({ categoryId, categoryName })}
        />
      )}

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

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        show={{ ...show, title: event?.title }}
        selectedSeats={selectedSeats}
        onConfirmSuccess={handleConfirmSuccess}
      />

      {waitlistModalData && (
        <WaitlistModal
          isOpen={!!waitlistModalData}
          onClose={() => setWaitlistModalData(null)}
          showId={showId}
          showTitle={event?.title}
          categoryId={waitlistModalData.categoryId}
          categoryName={waitlistModalData.categoryName}
        />
      )}
    </div>
  );
}
