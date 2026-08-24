import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Layers, ShieldAlert, ArrowRight, Lock, Mail, Sparkles, CheckCircle2, Film } from 'lucide-react';

export function AuthPage({ setView }) {
  const { login, register, switchDemoRole } = useAuth();
  const { addToast } = useToast();
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [role, setRole] = useState('customer'); // 'customer' | 'organiser'
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === 'login') {
        await login({ email, password });
        addToast(`Welcome back, ${email}!`, 'success');
      } else {
        if (!name.trim()) throw new Error('Name is required');
        await register({ name, email, password, role });
        addToast(`Account created as ${role}!`, 'success');
      }
      setView('explore');
    } catch (err) {
      addToast(err.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (selectedRole) => {
    switchDemoRole(selectedRole);
    addToast(`Signed in as demo ${selectedRole}!`, 'success');
    if (selectedRole === 'organiser') setView('organiser');
    else if (selectedRole === 'admin') setView('admin');
    else setView('explore');
  };

  return (
    <div className="container" style={{ maxWidth: '520px', paddingBottom: '60px' }}>
      <div className="glass-panel" style={{ padding: '36px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--accent-lime) 0%, var(--accent-cyan) 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
              color: '#08090D',
            }}
          >
            <Film size={24} />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '6px' }}>
            {tab === 'login' ? 'Sign In to Pulse' : 'Create Your Account'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            {tab === 'login'
              ? 'Access your tickets, seat holds, and waitlist allocations'
              : 'Book movie seats, manage events, or configure venue layouts'}
          </p>
        </div>

        {/* 1-Click Fast Demo Logins */}
        <div
          style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px',
            marginBottom: '20px',
          }}
        >
          <div style={{ fontSize: '0.7rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
            ⚡ 1-Click Instant Evaluation Logins
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleQuickDemo('customer')}
              className="btn-outline"
              style={{ padding: '8px 4px', fontSize: '0.75rem', flexDirection: 'column', gap: '4px' }}
            >
              <User size={14} color="var(--accent-lime)" />
              <span>Customer</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('organiser')}
              className="btn-outline"
              style={{ padding: '8px 4px', fontSize: '0.75rem', flexDirection: 'column', gap: '4px' }}
            >
              <Layers size={14} color="var(--accent-purple)" />
              <span>Organiser</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              className="btn-outline"
              style={{ padding: '8px 4px', fontSize: '0.75rem', flexDirection: 'column', gap: '4px' }}
            >
              <ShieldAlert size={14} color="var(--accent-pink)" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Tab Toggle */}
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
            Register New Account
          </button>
        </div>

        {/* Form */}
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
                <label className="form-label">Register As</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setRole('customer')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      border: `1px solid ${role === 'customer' ? 'var(--accent-lime)' : 'var(--border-subtle)'}`,
                      background: role === 'customer' ? 'rgba(204, 255, 0, 0.12)' : 'var(--bg-surface-elevated)',
                      color: role === 'customer' ? 'var(--accent-lime)' : 'var(--text-secondary)',
                    }}
                  >
                    👤 Movie Goer (Customer)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('organiser')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      border: `1px solid ${role === 'organiser' ? 'var(--accent-purple)' : 'var(--border-subtle)'}`,
                      background: role === 'organiser' ? 'rgba(139, 92, 246, 0.12)' : 'var(--bg-surface-elevated)',
                      color: role === 'organiser' ? 'var(--accent-purple)' : 'var(--text-secondary)',
                    }}
                  >
                    🎬 Event Organiser
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
            {loading ? 'Processing...' : tab === 'login' ? 'Sign In to Account' : 'Create Account & Start Booking'}
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
