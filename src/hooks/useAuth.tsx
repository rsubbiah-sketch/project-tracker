import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const AUTH_BASE = API_BASE.replace(/\/api\/?$/, '');

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  picture?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(true);

  // Handle OAuth callback — check URL for token param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const redirect = params.get('redirect') || '/';

    if (urlToken) {
      localStorage.setItem('auth_token', urlToken);
      setToken(urlToken);
      // Clean URL
      window.history.replaceState({}, '', redirect === '/' ? window.location.pathname : redirect);
    }
  }, []);

  // Fetch user profile when token is available
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${AUTH_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          // Token invalid/expired
          localStorage.removeItem('auth_token');
          setToken(null);
        }
      } catch {
        // API unavailable — keep token, user stays null
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const login = useCallback(() => {
    const currentPath = window.location.pathname;
    window.location.href = `${AUTH_BASE}/auth/google?state=${encodeURIComponent(currentPath)}`;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
    // Try server logout (non-blocking)
    if (token) {
      fetch(`${AUTH_BASE}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
