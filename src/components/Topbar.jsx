import { Bell, Globe, Accessibility, Search, LogOut, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Topbar.css';

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="topbar">
      <div className="tb-search">
        <Search size={14} className="tb-search-icon" />
        <input placeholder={user?.type === 'admin'
          ? 'Search notices, staff, or documents…'
          : 'Search notices, clients or audit IDs…'
        } />
      </div>

      <div className="tb-right">
        <button className="tb-icon-btn"><Bell size={17} /></button>
        <button className="tb-icon-btn"><Globe size={17} /></button>
        <button className="tb-icon-btn"><Accessibility size={17} /></button>

        <div className="tb-user">
          <div className="tb-avatar">{user?.name?.[0] || 'U'}</div>
          <div>
            <span className="tb-name">{user?.name}</span>
            <span className="tb-role">{user?.role}</span>
          </div>
          <button className="tb-icon-btn"><MoreHorizontal size={16} /></button>
          <button className="tb-icon-btn logout" title="Log out"
            onClick={() => { logout(); navigate('/login'); }}>
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
