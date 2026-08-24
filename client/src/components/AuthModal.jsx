import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { X, Sparkles, User, Layers, ShieldAlert, ArrowRight, Lock, Mail } from 'lucide-react';

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, login, register, switchDemoRole } = useAuth();
  const { addToast } = useToast();
  const [tab, setTab] = useState('login');
  const [role, setRole] = useState('customer');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === 'login') {
        await login({ email, password });
        addToast('Welcome back to Pulse!', 'success');
      } else {
        if (!name.trim()) throw new Error('Name is required');
        await register({ name, email, password, role });
        addToast(`Account created as ${role}!`, 'success');
      }
      closeAuthModal();
    } catch (err) {
      addToast(err.message || 'Authentication error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoQuickLogin = (selectedRole) => {
    switchDemoRole(selectedRole);
    addToast(`Switched to demo ${selectedRole} profile!`, 'success');
    closeAuthModal();
  };

  return (
    <div className="modal-backdrop" onClick={closeAuthModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
        <button
          onClick={closeAuthModal}
          style={{ position: 'absolute', top: '20px', right: '20px', color: 'var(--text-muted)' }}
          className="btn-icon"
        >
          <X size={18} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--accent-lime) 0%, var(--accent-cyan) 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
            }}
          >
            <Sparkles size={22} color="#08090D" />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '6px' }}>
            {tab === 'login' ? 'Welcome Back' : 'Create Your Account'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {tab === 'login' ? 'Sign in to access your live tickets & holds' : 'Join Pulse for real-time cinema & concert passes'}
          </p>
        </div>

        {/* 1-Click Fast Profile Switcher */}
        <div
          style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            marginBottom: '20px',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
            ⚡ 1-Click Demo Logins
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleDemoQuickLogin('customer')}
              className="btn-outline"
              style={{ padding: '8px 6px', fontSize: '0.75rem', flexDirection: 'column', gap: '4px' }}
            >
              <User size={14} color="var(--accent-lime)" />
              <span>Customer</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoQuickLogin('organiser')}
              className="btn-outline"
              style={{ padding: '8px 6px', fontSize: '0.75rem', flexDirection: 'column', gap: '4px' }}
            >
              <Layers size={14} color="var(--accent-purple)" />
              <span>Organiser</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoQuickLogin('admin')}
              className="btn-outline"
              style={{ padding: '8px 6px', fontSize: '0.75rem', flexDirection: 'column', gap: '4px' }}
            >
              <ShieldAlert size={14} color="var(--accent-pink)" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            background: 'var(--bg-surface-elevated)',
            padding: '4px',
            borderRadius: 'var(--radius-full)',
            marginBottom: '20px',
          }}
        >
          <button
            type="button"
            onClick={() => setTab('login')}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: tab === 'login' ? 'var(--text-primary)' : 'var(--text-muted)',
              background: tab === 'login' ? 'var(--bg-surface)' : 'transparent',
              boxShadow: tab === 'login' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: tab === 'register' ? 'var(--text-primary)' : 'var(--text-muted)',
              background: tab === 'register' ? 'var(--bg-surface)' : 'transparent',
              boxShadow: tab === 'register' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {tab === 'register' && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Hunter"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Account Role</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setRole('customer')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      border: `1px solid ${role === 'customer' ? 'var(--accent-lime)' : 'var(--border-subtle)'}`,
                      background: role === 'customer' ? 'rgba(204, 255, 0, 0.1)' : 'var(--bg-surface-elevated)',
                      color: role === 'customer' ? 'var(--accent-lime)' : 'var(--text-secondary)',
                    }}
                  >
                    Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('organiser')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      border: `1px solid ${role === 'organiser' ? 'var(--accent-purple)' : 'var(--border-subtle)'}`,
                      background: role === 'organiser' ? 'rgba(139, 92, 246, 0.1)' : 'var(--bg-surface-elevated)',
                      color: role === 'organiser' ? 'var(--accent-purple)' : 'var(--text-secondary)',
                    }}
                  >
                    Event Organiser
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              required
              placeholder="alex@pulse.io"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '14px', marginTop: '10px' }}
          >
            {loading ? 'Processing...' : tab === 'login' ? 'Sign In' : 'Create Account'}
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
