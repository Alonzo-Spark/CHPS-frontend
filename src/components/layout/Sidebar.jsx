import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, CheckSquare, FileText } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const role = user?.role?.toLowerCase() || 'staff'

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: role === 'professional' ? '/professional-dashboard' : role === 'admin' ? '/admin/dashboard' : '/staff/dashboard' },
    { label: 'Clients', icon: Users, path: '/staff/clients' },
    { label: 'Tasks', icon: CheckSquare, path: '#' },
    { label: 'Documents', icon: FileText, path: '#' },
  ].filter(item => {
    if (role === 'professional' || role === 'admin') {
      return item.label === 'Dashboard'
    } else {
      return item.label === 'Dashboard' || item.label === 'Clients'
    }
  })

  return (
    <aside className="sidebar-aside" style={{ width: 250, background: '#1a2340', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '15px 14px', borderBottom: '0.5px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{ width: 30, height: 30, background: '#2563eb', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#fff', flexShrink: 0 }}>AP</div>
        <div>
          <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>Audit Portal</p>
          <p style={{ color: '#64748b', fontSize: 9, letterSpacing: '.05em', textTransform: 'uppercase', marginTop: 2 }}>Internal Management</p>
        </div>
      </div>
      <nav style={{ padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {navItems.map(({ label, icon: Icon, path }) => {
          const active = location.pathname === path
          return (
            <div
              key={label}
              onClick={() => path !== '#' && navigate(path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px',
                color: active ? '#fff' : '#94a3b8', fontSize: 13, cursor: 'pointer',
                background: active ? '#2563eb' : 'transparent', fontWeight: active ? 500 : 400,
                borderRadius: 6,
              }}
            >
              <Icon size={15} />
              {label}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
