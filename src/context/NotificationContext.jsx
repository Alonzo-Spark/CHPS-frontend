import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { notifications as notifApi, createWebSocket } from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [alerts, setAlerts]         = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading]       = useState(false);
  const [toasts, setToasts]         = useState([]);          // real-time WS toasts
  const wsRef = useRef(null);
  const pollRef = useRef(null);

  // ── Fetch from REST ──────────────────────────────────────────────────────────
  const fetchAlerts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await notifApi.getAlerts(1, 20);
      if (data.success && data.alerts) {
        setAlerts(data.alerts);
        setUnreadCount(data.alerts.filter((a) => a.status === 'unread').length);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [user]);

  // ── Mark as read ─────────────────────────────────────────────────────────────
  const markRead = useCallback(async (notificationId) => {
    try {
      await notifApi.markRead(notificationId);
      setAlerts((prev) =>
        prev.map((a) => a.id === notificationId ? { ...a, status: 'read' } : a)
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* silent */ }
  }, []);

  // ── WebSocket for real-time ───────────────────────────────────────────────────
  const handleWsMessage = useCallback((data) => {
    const newAlert = {
      id: Date.now(),
      title: data.title || 'New Notification',
      message: data.message || '',
      createdAt: new Date().toISOString(),
      status: 'unread',
    };
    setAlerts((prev) => [newAlert, ...prev]);
    setUnreadCount((c) => c + 1);
    // Show toast for 5 seconds
    const toastId = Date.now();
    setToasts((prev) => [...prev, { id: toastId, ...newAlert }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 5000);
  }, []);

  // ── Setup on login, teardown on logout ───────────────────────────────────────
  useEffect(() => {
    if (!user) {
      // Clean up
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); wsRef.current = null; }
      clearInterval(pollRef.current);
      setAlerts([]);
      setUnreadCount(0);
      return;
    }

    fetchAlerts();

    // WebSocket
    wsRef.current = createWebSocket(handleWsMessage);

    // Poll every 60 s as fallback
    pollRef.current = setInterval(fetchAlerts, 60_000);

    return () => {
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); wsRef.current = null; }
      clearInterval(pollRef.current);
    };
  }, [user, fetchAlerts, handleWsMessage]);

  const dismissToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <NotificationContext.Provider value={{
      alerts, unreadCount, loading, toasts,
      fetchAlerts, markRead, dismissToast,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
