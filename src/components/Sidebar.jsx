import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Bell, CheckSquare, FileText, Settings, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

export default function Sidebar() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Bell,            label: 'Notices',   path: '/notices'   },
    { icon: CheckSquare,     label: 'Tasks',      path: '/tasks'     },
    { icon: FileText,        label: 'Documents',  path: '/documents' },
    ...(user?.type === 'admin' ? [{ icon: Settings, label: 'Settings', path: '/settings' }] : []),
  ];

  return (
    <aside className="sidebar">
      <div className="sb-logo">
        <div className="sb-logo-icon"><Building2 size={18} /></div>
        <div>
          <span className="sb-logo-title">AUDIT PORTAL</span>
          <span className="sb-logo-sub">INTERNAL MANAGEMENT</span>
        </div>
      </div>

      <nav className="sb-nav">
        {navItems.map(({ icon: Icon, label, path }) => (
          <button
            key={path}
            className={`sb-link ${location.pathname === path ? 'active' : ''}`}
            onClick={() => navigate(path)}
          >
            <Icon size={17} />
            <span>{label}</span>
          </button>
        ))}
      </nav>


    </aside>
  );
}
