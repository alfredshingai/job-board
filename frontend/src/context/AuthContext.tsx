import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../api/client';
import type { AuthUser } from '../api/types';

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; role?: string }) => Promise<void>;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthState | null>(null);

const STORAGE_KEY = 'devhire_auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { user: AuthUser; token: string };
        setUser(parsed.user);
        setToken(parsed.token);
      }
    } catch {
      // ignore corrupt storage
    } finally {
      setLoading(false);
    }
  }, []);

  const persist = (u: AuthUser, t: string) => {
    setUser(u);
    setToken(t);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: u, token: t }));
  };

  const login = async (email: string, password: string) => {
    const res = await api.post<{ user: AuthUser; token: string }>('/api/auth/login', { email, password });
    persist(res.user, res.token);
  };

  const register = async (data: { email: string; password: string; name: string; role?: string }) => {
    const res = await api.post<{ user: AuthUser; token: string }>('/api/auth/register', data);
    persist(res.user, res.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(() => ({ user, token, login, register, logout, loading }), [user, token, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
