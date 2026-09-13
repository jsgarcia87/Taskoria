import { useState, useCallback, useEffect } from 'react';

const API_BASE = './api';
const SESSION_KEY = 'taskoria_admin';

export function useAdminAuth() {
  const [admin, setAdmin] = useState(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      if (!data.user?.is_admin) throw new Error('Access denied — admin privileges required');
      const adminData = { id: data.user.id, username: data.user.username };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(adminData));
      setAdmin(adminData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setAdmin(null);
  }, []);

  const adminFetch = useCallback(async (action, body = {}, endpoint = 'admin') => {
    if (!admin) throw new Error('Not authenticated');
    const res = await fetch(`${API_BASE}/${endpoint}.php?action=${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_id: admin.id, ...body }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }, [admin]);

  return { admin, loading, error, login, logout, adminFetch };
}
