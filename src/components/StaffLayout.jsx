import React from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, Bell, CheckSquare, FileText, Building2, LogOut } from 'lucide-react'
import './SidebarLayout.css'

const NAV = [
  { to: '/staff/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/staff/notices',    icon: Bell,            label: 'Notices'   },
  { to: '/staff/tasks',      icon: CheckSquare,     label: 'Tasks'     },
  { to: '/staff/documents',  icon: FileText,        label: 'Documents' },
]

export default function StaffLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'S'

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo"><Building2 size={20} /></div>
          <div className="sidebar-brand">
            <span className="brand-title">AUDIT PORTAL</span>
            <span className="brand-sub">INTERNAL MANAGEMENT</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}>
              <Icon size={18} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <span className="user-name">{user?.name || 'Staff'}</span>
              <span className="user-role">Staff</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
