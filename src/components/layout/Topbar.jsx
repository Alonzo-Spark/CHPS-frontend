import React from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const Topbar = ({ breadcrumbs }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }
  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'US'

  return (
    <header style={{ height: '50px', background: '#fff', borderBottom: '0.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#64748b' }}>
        {breadcrumbs ? breadcrumbs : (
          <><span style={{ color: '#2563eb', fontWeight: '500' }}>Dashboard</span></>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
