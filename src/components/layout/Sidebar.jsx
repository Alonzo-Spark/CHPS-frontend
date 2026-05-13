import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CheckSquare, FileText } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const Sidebar = () => {
  const { user } = useAuth()
  
  const getDashboardPath = () => {
    if (!user) return '/staff/dashboard'
    const role = user.role.toLowerCase()
    const roleMap = { admin: '/admin/dashboard', professor: '/professor/dashboard', staff: '/staff/dashboard', professional: '/professional/dashboard' }
    return roleMap[role] || '/staff/dashboard'
  }

  const navItems = [
    { to: getDashboardPath(), icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/staff/tasks',     icon: CheckSquare,     label: 'Tasks' },
    { to: '/staff/documents', icon: FileText,        label: 'Documents' },
  ]

  return (
    <aside style={{ width: '185px', background: '#1a2340', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '14px 13px', borderBottom: '0.5px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '9px' }}>
        <div style={{ width: '30px', height: '30px', background: '#2563eb', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600', color: '#fff', flexShrink: 0 }}>AP</div>
        <div>
          <p style={{ color: '#fff', fontSize: '13px', fontWeight: '600', lineHeight: '1.2' }}>Audit Portal</p>
          <p style={{ color: '#64748b', fontSize: '10px', letterSpacing: '0.04em', marginTop: '3px', textTransform: 'uppercase' }}>Internal Management</p>
        </div>
      </div>
      <nav style={{ padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 10px',
            borderRadius: '8px', color: isActive ? '#fff' : '#94a3b8',
            background: isActive ? '#2563eb' : 'transparent', fontWeight: isActive ? '500' : '400',
            fontSize: '13px', textDecoration: 'none', cursor: 'pointer',
          })} onClick={() => console.log('Sidebar navigation clicked', label, to)}>
            <Icon size={15} />{label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
