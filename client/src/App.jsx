import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';

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

export function AppContent() {
  const { user } = useAuth();
  const [currentView, setView] = useState(() => {
    return localStorage.getItem('pulse_user') ? 'home' : 'auth';
  });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedShow, setSelectedShow] = useState(null);

  // If user logs out, immediately route to auth page
  useEffect(() => {
    if (!user && currentView !== 'auth') {
      setView('auth');
    }
  }, [user, currentView]);

  const handleSelectEvent = (evt, show = null) => {
    if (!user) {
      setView('auth');
      return;
    }
    setSelectedEvent(evt);
    setSelectedShow(
      show || {
        id: 'show-01',
        event_id: evt.id,
        show_date: '2026-09-10',
        show_time: '18:30',
        venue_name: 'PVR INOX Neo-Plex Horizon',
        venue_address: 'Lower Parel, Mumbai',
      }
    );
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
        {/* If user is not logged in, always present Auth login view first */}
        {!user || currentView === 'auth' ? (
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

            {currentView === 'offer-redeem' && (
              <OfferClaimPage
                setView={handleNavigation}
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
      <AuthModal />
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
