import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  Film,
  Ticket,
  Sun,
  Moon,
  User,
  ShieldAlert,
  Sparkles,
  Layers,
  LogOut,
  Menu,
  X,
  Compass,
  Info,
  Mail,
  MapPin,
  Tag,
  ChevronDown,
} from 'lucide-react';

export function Navbar({ currentView, setView }) {
  const { isDark, toggleTheme } = useTheme();
  const { user, role, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const [cityMenuOpen, setCityMenuOpen] = useState(false);

  const cities = ['Mumbai', 'Delhi NCR', 'Bengaluru', 'Hyderabad', 'Chennai'];

  const navItems = [
    { id: 'home', label: 'Home', icon: Sparkles },
    { id: 'explore', label: 'Movies & Concerts', icon: Compass },
    { id: 'bookings', label: 'My Bookings', icon: Ticket },
    { id: 'offer-redeem', label: 'Waitlist Offers', icon: Tag },
  ];

  if (role === 'organiser') {
    navItems.push({ id: 'organiser', label: 'Organiser Studio', icon: Layers });
  }
  if (role === 'admin') {
    navItems.push({ id: 'admin', label: 'Admin Venues', icon: ShieldAlert });
  }

  const handleNavClick = (id) => {
    setView(id);
    setMobileMenuOpen(false);
  };

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '72px',
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand Logo & City Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div
            onClick={() => handleNavClick('home')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--accent-lime) 0%, var(--accent-cyan) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px var(--accent-lime-glow)',
              }}
            >
              <Film size={20} color="#08090D" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.25rem', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                PULSE<span style={{ color: 'var(--accent-lime)' }}>✦</span>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                CINEMAS & EVENTS
              </div>
            </div>
          </div>

          {/* City Selector Pill */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setCityMenuOpen(!cityMenuOpen)}
              className="desktop-nav"
              style={{
                display: 'none',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
              }}
            >
              <MapPin size={13} color="var(--accent-pink)" />
              <span>{selectedCity}</span>
              <ChevronDown size={13} />
            </button>

            {cityMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '110%',
                  left: 0,
                  width: '150px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  padding: '6px',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 200,
                }}
              >
                {cities.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setSelectedCity(c); setCityMenuOpen(false); }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      color: selectedCity === c ? 'var(--accent-lime)' : 'var(--text-primary)',
                      background: selectedCity === c ? 'var(--bg-surface-elevated)' : 'transparent',
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav style={{ display: 'none', gap: '6px', alignItems: 'center' }} className="desktop-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: active ? 'var(--bg-surface-elevated)' : 'transparent',
                  border: active ? '1px solid var(--border-medium)' : '1px solid transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                <Icon size={15} color={active ? 'var(--accent-lime)' : 'currentColor'} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="btn-icon"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun size={18} color="var(--accent-lime)" /> : <Moon size={18} color="#0F172A" />}
          </button>

          {/* Logged-in role badge — reflects the real account role, not switchable */}
          {user && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 12px',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.78rem',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background:
                    role === 'admin'
                      ? 'var(--accent-pink)'
                      : role === 'organiser'
                      ? 'var(--accent-purple)'
                      : 'var(--accent-lime)',
                }}
              />
              <span>{role}</span>
            </div>
          )}

          {/* User Sign In / Profile */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => handleNavClick('auth')}
                className="btn-outline"
                style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '6px' }}
                title={`Logged in as ${user.name}`}
              >
                <User size={14} color="var(--accent-lime)" />
                <span className="desktop-nav" style={{ display: 'none' }}>{user.name.split(' ')[0]}</span>
              </button>
              <button
                onClick={logout}
                className="btn-icon"
                title="Logout"
              >
                <LogOut size={16} color="var(--text-muted)" />
              </button>
            </div>
          ) : (
            <button onClick={() => handleNavClick('auth')} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              Sign In
            </button>
          )}

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn-icon mobile-nav-trigger"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Out Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'absolute',
            top: '72px',
            left: 0,
            right: 0,
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-medium)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: active ? 'var(--accent-lime)' : 'var(--text-primary)',
                  background: active ? 'var(--bg-surface-elevated)' : 'transparent',
                }}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
          <button
            onClick={() => handleNavClick('auth')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--accent-cyan)',
            }}
          >
            <User size={18} />
            Sign In / Register
          </button>
        </div>
      )}

      {/* CSS helper for responsive desktop nav */}
      <style>{`
        @media (min-width: 900px) {
          .desktop-nav { display: inline-flex !important; }
          .mobile-nav-trigger { display: none !important; }
        }
      `}</style>
    </header>
  );
}
