import { useState } from 'react'
import { LogOut, KeyRound } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import ChangePasswordModal from '../auth/ChangePasswordModal'
export default function Topbar({ breadcrumbs = [] }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'MT'

  return (
    <>
      {/* DESKTOP / TABLET HEADER */}
      <div className="topbar-desktop" style={{ position: 'relative', height: 50, background: '#fff', borderBottom: '0.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {i > 0 && <span style={{ color: '#94a3b8' }}>›</span>}
              <span
                style={{ color: i === 0 ? '#2563eb' : i === breadcrumbs.length - 1 ? '#1e293b' : '#94a3b8', fontWeight: i === breadcrumbs.length - 1 ? 500 : 400, cursor: crumb.path ? 'pointer' : 'default' }}
                onClick={() => crumb.path && navigate(crumb.path)}
              >
                {crumb.label}
              </span>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', lineHeight: 1.2 }}>{user?.username || 'User'}</p>
            <p style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginTop: 1 }}>
              {user?.role === 'staff' ? 'Staff Administrator' : user?.role || 'Staff'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {user?.role?.toLowerCase() === 'client' && (
              <button onClick={() => setIsModalOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 3, flexShrink: 0 }} title="Change Password">
                <KeyRound size={16} />
              </button>
            )}
            <button
              className="logout-btn"
              onClick={handleLogout}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px', flexShrink: 0 }}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE HEADER */}
      <div className="topbar-mobile" style={{ display: 'none', background: '#fff', borderBottom: '0.5px solid #e2e8f0', flexDirection: 'column', padding: '10px 16px', gap: 8 }}>

        {/* Top Row: User Info & Logout (Fully Right-Aligned) */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, textAlign: 'right' }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', lineHeight: 1.2, wordBreak: 'break-word' }}>{user?.username || 'User'}</p>
              <p style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginTop: 2, wordBreak: 'break-word' }}>
                {user?.role === 'staff' ? 'Staff Administrator' : user?.role || 'Staff'}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {user?.role?.toLowerCase() === 'client' && (
                <button onClick={() => setIsModalOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0 }} title="Change Password">
                  <KeyRound size={14} />
                </button>
              )}
              <button
                onClick={handleLogout}
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 0, whiteSpace: 'nowrap' }}
              >
                <span style={{ fontSize: 12, fontWeight: 600 }}>Logout</span>
                <LogOut size={13} style={{ flexShrink: 0 }} />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Section: Back Button directly above Breadcrumbs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 0 }}>
          {/* Back Button */}
          {breadcrumbs.length > 1 && (
            <button 
              onClick={() => navigate(-1)} 
              style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', padding: 0, margin: 0, alignSelf: 'flex-start', width: 'fit-content' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Back</span>
            </button>
          )}

          {/* Breadcrumbs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {breadcrumbs.map((crumb, i) => (
              <div
                key={i}
                style={{
                  fontSize: 13,
                  color: i === breadcrumbs.length - 1 ? '#1e293b' : '#64748b',
                  fontWeight: i === breadcrumbs.length - 1 ? 600 : 400,
                  cursor: crumb.path ? 'pointer' : 'default',
                  paddingLeft: i > 0 ? (i * 12) : 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
                onClick={() => crumb.path && navigate(crumb.path)}
              >
                {i > 0 && <span style={{ color: '#cbd5e1', fontSize: 11 }}>↳</span>}
                {crumb.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {user?.role?.toLowerCase() === 'client' && (
        <ChangePasswordModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  )
}
