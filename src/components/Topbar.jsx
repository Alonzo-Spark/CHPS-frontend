import { useState, useRef, useEffect } from 'react';
import { Bell, LogOut, CheckCheck, Loader2 } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import './Topbar.css';

export default function Topbar() {
  const { user, logout } = useAuth();
  const { alerts, unreadCount, loading, markRead, fetchAlerts } = useNotifications();
  const navigate = useNavigate();

  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleBellClick = () => {
    setNotifOpen((o) => !o);
    if (!notifOpen) fetchAlerts();
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch { return ts; }
  };

  return (
    <header className="topbar">
      <div className="tb-right">

        {/* ── Notification Bell ── */}
        <div className="tb-notif-wrap" ref={notifRef}>
          <button
            id="notif-bell"
            className="tb-icon-btn"
            onClick={handleBellClick}
            title="Notifications"
            aria-label={`${unreadCount} unread notifications`}
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>

          {notifOpen && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="notif-unread-chip">{unreadCount} new</span>
                )}
              </div>

              <div className="notif-body">
                {loading ? (
                  <div className="notif-empty">
                    <Loader2 size={18} className="spin-icon" />
                    <span>Loading…</span>
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="notif-empty">
                    <Bell size={22} color="#cbd5e1" />
                    <span>No notifications yet</span>
                  </div>
                ) : (
                  alerts.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      className={`notif-item ${n.status === 'unread' ? 'notif-item-unread' : ''}`}
                      onClick={() => n.status === 'unread' && markRead(n.id)}
                    >
                      <div className="notif-dot-wrap">
                        {n.status === 'unread' && <span className="notif-dot" />}
                      </div>
                      <div className="notif-content">
                        <div className="notif-title">{n.title}</div>
                        <div className="notif-msg">{n.message}</div>
                        <div className="notif-time">{formatTime(n.createdAt)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {alerts.length > 0 && (
                <div className="notif-footer">
                  <button
                    className="notif-mark-all"
                    onClick={() => alerts.filter(a => a.status === 'unread').forEach(a => markRead(a.id))}
                  >
                    <CheckCheck size={12} /> Mark all as read
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── User Chip ── */}
        <div className="tb-user">
          <div className="tb-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
          <div>
            <span className="tb-name">{user?.name}</span>
            <span className="tb-role">{user?.role?.toUpperCase()}</span>
          </div>
          <button
            id="logout-btn"
            className="tb-icon-btn logout"
            title="Log out"
            onClick={handleLogout}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
