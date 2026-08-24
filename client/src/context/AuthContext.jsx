import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('pulse_user');
    return saved ? JSON.parse(saved) : null; // Defaults to null so user logs in first
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('pulse_token') || null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('pulse_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('pulse_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('pulse_token', token);
    } else {
      localStorage.removeItem('pulse_token');
    }
  }, [token]);

  const login = async ({ email, password }) => {
    const res = await authApi.login({ email, password });
    if (res && res.user) {
      setUser(res.user);
      setToken(res.token);
      return res.user;
    }
    throw new Error(res?.error || 'Login failed');
  };

  const register = async ({ name, email, password, role }) => {
    const res = await authApi.register({ name, email, password, role });
    if (res && res.user) {
      setUser(res.user);
      setToken(res.token);
      return res.user;
    }
    throw new Error(res?.error || 'Registration failed');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('pulse_user');
    localStorage.removeItem('pulse_token');
  };

  const switchDemoRole = (role) => {
    if (role === 'admin') {
      const u = { id: 'admin-01', name: 'Devin Vance (Admin)', email: 'admin@pulse.io', role: 'admin' };
      setUser(u);
      setToken('jwt-mock-admin');
    } else if (role === 'organiser') {
      const u = { id: 'org-01', name: 'Nova Stage Studio (Organiser)', email: 'producer@pulse.io', role: 'organiser' };
      setUser(u);
      setToken('jwt-mock-organiser');
    } else {
      const u = { id: 'user-customer-demo', name: 'Alex Hunter (Customer)', email: 'alex.hunter@pulse.io', role: 'customer' };
      setUser(u);
      setToken('jwt-mock-customer');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || 'guest',
        isLoggedIn: !!user,
        login,
        register,
        logout,
        switchDemoRole,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
