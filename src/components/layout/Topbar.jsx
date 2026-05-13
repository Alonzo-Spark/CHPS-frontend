import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { notificationService } from '../../services/notificationService'
import { resolveUuid } from '../../services/paramHelpers'

const Topbar = ({ breadcrumbs }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadNotifications = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await notificationService.getNotifications()
      const payload = response.data || response
      setNotifications(payload.items || [])
      setUnreadCount(payload.unread_count ?? 0)
    } catch {
      setNotifications([])
      setUnreadCount(0)
      setError('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const handleToggleNotifications = () => {
    setOpen((current) => !current)
    if (!open) {
      loadNotifications()
    }
  }

  const handleRead = async (id) => {
    try {
      await notificationService.markAsRead(id)
      await loadNotifications()
    } catch {
      // keep dropdown stable even if mark-as-read fails
    }
  }

  const formattedNotifications = useMemo(
    () => notifications.map((notification) => ({
      ...notification,
      isUnread: !notification.is_read,
    })),
    [notifications]
  )

  const handleLogout = () => { logout(); navigate('/login') }
  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'US'

  return (
    <header style={{ height: '50px', background: '#fff', borderBottom: '0.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#64748b' }}>
        {breadcrumbs ? breadcrumbs : (
          <><span style={{ color: '#2563eb', fontWeight: '500' }}>Dashboard</span></>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
        <button
          onClick={handleToggleNotifications}
          style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
          aria-label="Notifications"
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span style={{ position: 'absolute', top: '-3px', right: '-3px', minWidth: '16px', height: '16px', borderRadius: '999px', background: '#dc2626', color: '#fff', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
              {unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div style={{ position: 'absolute', top: '42px', right: '70px', width: '320px', maxHeight: '420px', overflowY: 'auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 16px 40px rgba(15,23,42,0.12)', zIndex: 20 }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>Notifications</p>
              <span style={{ fontSize: '11px', color: '#64748b' }}>{unreadCount} unread</span>
            </div>
            {loading ? (
              <div style={{ padding: '14px', fontSize: '12px', color: '#64748b' }}>Loading notifications...</div>
            ) : error ? (
              <div style={{ padding: '14px' }}>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>{error}</p>
                <button
                  onClick={loadNotifications}
                  style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#334155', fontSize: '12px', cursor: 'pointer' }}
                >
                  Retry
                </button>
              </div>
            ) : formattedNotifications.length === 0 ? (
              <div style={{ padding: '14px', fontSize: '12px', color: '#64748b' }}>No notifications found</div>
            ) : (
              formattedNotifications.map((notification) => (
                <button
                  key={resolveUuid(notification.notification_id, notification.id) || notification.message}
                  onClick={() => {
                    const notificationId = resolveUuid(notification.notification_id, notification.id)
                    if (notificationId) {
                      handleRead(notificationId)
                    }
                  }}
                  style={{ width: '100%', textAlign: 'left', padding: '12px 14px', border: 'none', background: notification.isUnread ? '#eff6ff' : '#fff', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                    <div>
                      <p style={{ fontSize: '11px', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>
                        {notification.notification_type || 'Notification'}
                      </p>
                      <p style={{ fontSize: '12px', color: '#1e293b', lineHeight: '1.4' }}>{notification.message}</p>
                      <p style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>{notification.created_at}</p>
                    </div>
                    {notification.isUnread && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb', flexShrink: 0, marginTop: '4px' }} />}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '12px', fontWeight: '500', color: '#1e293b', lineHeight: '1.2' }}>{user?.username || 'User'}</p>
          <p style={{ fontSize: '10px', color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '2px' }}>{user?.role || 'Staff'}</p>
        </div>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '500', color: '#fff' }}>{initials}</div>
        <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}><LogOut size={16} /></button>
      </div>
    </header>
  )
}

export default Topbar
