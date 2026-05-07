import { Bell, Globe, Accessibility, Search, LogOut, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Topbar.css';

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="topbar">

      <div className="tb-right">
        <div className="tb-user">
          <div className="tb-avatar">{user?.name?.[0] || 'U'}</div>
          <div>
            <span className="tb-name">{user?.name}</span>
            <span className="tb-role">{user?.role}</span>
          </div>
          <button className="tb-icon-btn logout" title="Log out"
            onClick={() => { logout(); navigate('/login'); }}>
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
