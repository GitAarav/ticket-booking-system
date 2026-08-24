import React, { createContext, useContext, useState } from 'react';
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

  // localStorage is written synchronously here, not via a useEffect keyed on
  // user/token — the page that appears right after login fires its own
  // authenticated requests immediately, and a useEffect write can lose that
  // race (request goes out before the token is persisted), which looks like
  // "login doesn't work" when it's really a 401 bouncing you back out.
  const applySession = (nextUser, nextToken) => {
    if (nextUser) localStorage.setItem('pulse_user', JSON.stringify(nextUser));
    else localStorage.removeItem('pulse_user');

    if (nextToken) localStorage.setItem('pulse_token', nextToken);
    else localStorage.removeItem('pulse_token');

    setUser(nextUser);
    setToken(nextToken);
  };

  const login = async ({ email, password }) => {
    const res = await authApi.login({ email, password });
    applySession(res.user, res.token);
    return res.user;
  };

  const register = async ({ name, email, password, role }) => {
    const res = await authApi.register({ name, email, password, role });
    applySession(res.user, res.token);
    return res.user;
  };

  const logout = () => {
    applySession(null, null);
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
