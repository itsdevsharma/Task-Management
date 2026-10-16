import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('taskflow_user');
    try { return storedUser ? JSON.parse(storedUser) : null; } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('taskflow_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !token) logout();
    setLoading(false);
  }, []);

  const login = ({ user: nextUser, token: nextToken }) => {
    localStorage.setItem('taskflow_user', JSON.stringify(nextUser));
    localStorage.setItem('taskflow_token', nextToken);
    setUser(nextUser);
    setToken(nextToken);
  };

  const logout = () => {
    localStorage.removeItem('taskflow_user');
    localStorage.removeItem('taskflow_token');
    setUser(null);
    setToken(null);
  };

  useEffect(() => {
    window.addEventListener('taskflow:unauthorized', logout);
    return () => window.removeEventListener('taskflow:unauthorized', logout);
  }, []);

  useEffect(() => {
    if (!token) return;
    try {
      const { exp } = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      const remaining = exp * 1000 - Date.now();
      if (!Number.isFinite(remaining) || remaining <= 0) { logout(); return; }
      let timer;
      const checkExpiration = () => {
        const delay = exp * 1000 - Date.now();
        if (delay <= 0) { logout(); return; }
        timer = setTimeout(checkExpiration, Math.min(delay, 2147483647));
      };
      checkExpiration();
      return () => clearTimeout(timer);
    } catch { logout(); }
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!token,
      loading,
      login,
      logout,
      setUser: (nextUser) => { localStorage.setItem('taskflow_user', JSON.stringify(nextUser)); setUser(nextUser); },
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
