import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { SeatSelectionPage } from './pages/SeatSelectionPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { OfferClaimPage } from './pages/OfferClaimPage';
import { OrganiserStudioPage } from './pages/OrganiserStudioPage';
import { AdminVenuesPage } from './pages/AdminVenuesPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { AuthPage } from './pages/AuthPage';
import { customerApi } from './services/api';
import { useToast } from './context/ToastContext';

export function AppContent() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [offerTokenFromUrl] = useState(() => new URLSearchParams(window.location.search).get('offerToken'));
  const [currentView, setView] = useState(() => {
    if (offerTokenFromUrl) return 'offer-redeem';
    return localStorage.getItem('pulse_user') ? 'home' : 'auth';
  });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedShow, setSelectedShow] = useState(null);

  // If user logs out, immediately route to auth page — except the offer-claim
  // page, which works without being logged in (the token itself is the
  // credential, matching the backend's unauthenticated /offers/:token/confirm).
  useEffect(() => {
    if (!user && currentView !== 'auth' && currentView !== 'offer-redeem') {
      setView('auth');
    }
  }, [user, currentView]);

  const handleSelectEvent = async (evt, show = null) => {
    if (!user) {
      setView('auth');
      return;
    }

    let targetShow = show;
    if (!targetShow) {
      // No specific showtime picked (e.g. clicked "Book Tickets" straight from a
      // card) — look up this event's real showtimes instead of guessing one.
      try {
        const shows = await customerApi.getShowsForEvent(evt.id);
        if (shows.length === 0) {
          addToast('No showtimes scheduled for this event yet.', 'error');
          return;
        }
        targetShow = shows[0];
      } catch (err) {
        addToast(err.message || 'Could not load showtimes for this event', 'error');
        return;
      }
    }

    setSelectedEvent(evt);
    setSelectedShow(targetShow);
    setView('seats');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBookingSuccess = () => {
    setView('bookings');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigation = (viewId) => {
    setView(viewId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-container">
      <Navbar currentView={currentView} setView={handleNavigation} />

      <main className="main-content">
        {/* Offer claims work without being logged in — the token is the credential */}
        {currentView === 'offer-redeem' ? (
          <OfferClaimPage setView={handleNavigation} initialToken={offerTokenFromUrl} />
        ) : !user || currentView === 'auth' ? (
          <AuthPage setView={handleNavigation} />
        ) : (
          <>
            {currentView === 'home' && (
              <HomePage
                setView={handleNavigation}
                onSelectEvent={handleSelectEvent}
              />
            )}

            {currentView === 'explore' && (
              <ExplorePage
                onSelectEvent={handleSelectEvent}
              />
            )}

            {currentView === 'seats' && (
              <SeatSelectionPage
                event={selectedEvent}
                show={selectedShow}
                onBack={() => handleNavigation('explore')}
                onBookingSuccess={handleBookingSuccess}
              />
            )}

            {currentView === 'bookings' && (
              <MyBookingsPage
                setView={handleNavigation}
                onSelectEvent={handleSelectEvent}
              />
            )}

            {currentView === 'organiser' && (
              <OrganiserStudioPage
                setView={handleNavigation}
              />
            )}

            {currentView === 'admin' && (
              <AdminVenuesPage
                setView={handleNavigation}
              />
            )}

            {currentView === 'about' && (
              <AboutPage
                setView={handleNavigation}
              />
            )}

            {currentView === 'contact' && (
              <ContactPage />
            )}
          </>
        )}
      </main>

      <Footer setView={handleNavigation} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
