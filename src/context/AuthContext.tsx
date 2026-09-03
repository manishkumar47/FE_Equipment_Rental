import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { AuthSession } from '../types/api.types';

interface AuthContextType {
  user: AuthSession | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (session: AuthSession) => void;
  logout: () => void;
  updateLocalUser: (updates: Partial<AuthSession>) => void;
  /**
   * Consumes the "this logout was user-initiated" flag set by `logout()`.
   * Lets ProtectedRoute skip the "please sign in" toast for a deliberate
   * sign-out (as opposed to landing on a protected route while already
   * logged out, or a session expiring mid-page).
   */
  consumeIntentionalLogout: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'equipflow_auth';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthSession | null>(() => {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = (session: AuthSession) => {
    setUser(session);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  };

  const intentionalLogoutRef = useRef(false);

  const logout = () => {
    intentionalLogoutRef.current = true;
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const consumeIntentionalLogout = () => {
    if (!intentionalLogoutRef.current) return false;
    intentionalLogoutRef.current = false;
    return true;
  };

  const updateLocalUser = (updates: Partial<AuthSession>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const isAuthenticated = !!user?.token;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        login,
        logout,
        updateLocalUser,
        consumeIntentionalLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
