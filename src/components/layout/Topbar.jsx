import { LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Topbar({ breadcrumbs = [] }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'MT'

  return (
    <div className="topbar-container" style={{ height: 50, background: '#fff', borderBottom: '0.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0 }}>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', lineHeight: 1.2 }}>{user?.username || 'User'}</p>
          <p style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginTop: 1 }}>
            {user?.role === 'staff' ? 'Staff Administrator' : user?.role || 'Staff'}
          </p>
        </div>
        <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 3 }}>
          <LogOut size={16} />
        </button>
      </div>
    </div>
  )
}
