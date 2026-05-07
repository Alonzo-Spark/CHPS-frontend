import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, saveAuthTokens, clearAuthTokens } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) || null; }
    catch { return null; }
  });
  const [permissions, setPermissions] = useState([]);
  const [accessChecks, setAccessChecks] = useState({});
  const [authLoading, setAuthLoading] = useState(true);

  // On mount – validate stored token with /api/auth/me
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setAuthLoading(false); return; }

    auth.me()
      .then((data) => {
        if (data.success && data.user) {
          const u = normalise(data.user);
          setUser(u);
          localStorage.setItem('user', JSON.stringify(u));
          localStorage.setItem('role', u.role);
          return auth.getRole();
        }
        // token invalid / expired – wipe storage but stay on current page
        clearAuthTokens();
        setUser(null);
      })
      .then((roleData) => {
        if (roleData?.success) setPermissions(roleData.permissions || []);
      })
      .catch(() => {
        // network error – keep stale user so UI doesn't flash to login
      })
      .finally(() => setAuthLoading(false));
  }, []);

  /** Normalise API user → add .type for backward-compat with existing UI */
  function normalise(apiUser) {
    return { ...apiUser, type: apiUser.role }; // role === 'admin' | 'staff'
  }

  // ── LOGIN ────────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const data = await auth.login(email, password);
    if (!data.success) return { success: false, error: data.message };

    saveAuthTokens({ token: data.token, refreshToken: data.refreshToken, user: data.user });
    const u = normalise(data.user);
    setUser(u);

    // Fetch permissions after login
    try {
      const roleData = await auth.getRole();
      if (roleData?.success) setPermissions(roleData.permissions || []);
      const access = await auth.checkAccess();
      if (access) setAccessChecks(access);
    } catch { /* non-critical */ }

    return { success: true, role: u.role };
  }, []);

  // ── LOGOUT ───────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await auth.logout(); } catch { /* ignore */ }
    clearAuthTokens();
    setUser(null);
    setPermissions([]);
    setAccessChecks({});
  }, []);

  // ── REGISTER ─────────────────────────────────────────────────────────────────
  const signup = useCallback(async (payload) => {
    const data = await auth.register(payload);
    if (!data.success) return { success: false, error: data.message };
    if (data.token) {
      saveAuthTokens({ token: data.token, user: data.user });
      setUser(normalise(data.user));
    }
    return { success: true, message: data.message };
  }, []);

  // ── PERMISSION HELPERS ───────────────────────────────────────────────────────
  const hasPermission  = (p) => permissions.includes(p);
  const isAdmin        = () => user?.role === 'admin';
  const isStaff        = () => user?.role === 'staff';

  return (
    <AuthContext.Provider value={{
      user, permissions, accessChecks, authLoading,
      login, logout, signup,
      hasPermission, isAdmin, isStaff,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
