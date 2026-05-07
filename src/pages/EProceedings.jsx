import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, Filter, Download, Search,
  CheckCircle2, Clock, FileText, Mail, UserPlus, Eye,
  Loader2, AlertCircle, RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notices as noticesApi } from '../services/api';
import './EProceedings.css';

const NAV_TABS = ['For your Action', 'For your Information'];

export default function EProceedings() {
  const [tab, setTab]       = useState(0);
  const [view, setView]     = useState('self');
  const [search, setSearch] = useState('');
  const [proceedings, setProceedings] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchProceedings = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await noticesApi.getAll({ page: 1, limit: 50 });
      const list = data.data || data.notices || (Array.isArray(data) ? data : []);
      setProceedings(list);
    } catch (e) {
      setError('Failed to load proceedings. ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProceedings(); }, [fetchProceedings]);

  const filtered = proceedings.filter(p => {
    const q = search.toLowerCase();
    return (
      (p.assessee_name || p.name_of_assessee || '').toLowerCase().includes(q) ||
      (p.pan_number || p.user_pan || '').toLowerCase().includes(q) ||
      (p.notice_type || p.notice_us || '').toLowerCase().includes(q)
    );
  });

  async function handleDownload(p) {
    try {
      await noticesApi.downloadPdf(p.id, p.pdf_file_name || `notice_${p.id}.pdf`);
    } catch (e) {
      alert('Download failed: ' + e.message);
    }
  }

  function getIcon(p) {
    const t = (p.notice_type || p.notice_us || '').toLowerCase();
    return t.includes('letter') || t.includes('issue') ? 'mail' : 'file';
  }

  function getStatus(p) {
    const s = (p.notice_status || p.status || 'open').toLowerCase();
    if (s === 'open' || s === 'new') return { key: 'in-progress', label: 'IN PROGRESS' };
    if (s === 'pending' || s === 'assigned') return { key: 'pending-action', label: 'PENDING ACTION' };
    if (s === 'completed') return { key: 'completed', label: 'COMPLETED' };
    return { key: 'in-progress', label: s.toUpperCase() };
  }

  return (
    <div className="ep fade-in">
      {/* ── Top Portal Bar ── */}
      <div className="ep-portal-bar">
        <div className="ep-portal-left">
          <div className="ep-portal-logo">
            <div className="ep-logo-icon">🏛</div>
            <div>
              <div className="ep-portal-name">Audit Portal - Anywhere Anytime</div>
              <div className="ep-portal-dept">GOVERNMENT AUDIT DEPARTMENT</div>
            </div>
          </div>
        </div>
        <div className="ep-portal-right">
          <div className="ep-user-chip">
            <div className="ep-user-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
            <div>
              <div className="ep-user-name">{user?.name?.toUpperCase() || 'USER'}</div>
              <div className="ep-user-role">{user?.role?.toUpperCase() || 'STAFF'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Portal Nav ── */}
      <div className="ep-portal-nav">
        {['Dashboard','e-File','Authorized Partners','Services','AIS','Pending Actions','Grievances','Help'].map(n => (
          <button key={n} className={`ep-nav-item ${n==='Services'?'ep-nav-active':''}`}>{n}</button>
        ))}
        <div className="ep-session"><Clock size={12}/> Session: 14:59</div>
      </div>

      {/* ── Breadcrumb ── */}
      <div className="ep-breadcrumb">
        <button onClick={() => navigate('/dashboard')} className="ep-bc-link">Dashboard</button>
        <ChevronRight size={13} className="ep-bc-sep"/>
        <span className="ep-bc-link" onClick={() => navigate('/tasks')}>Pending Actions</span>
        <ChevronRight size={13} className="ep-bc-sep"/>
        <span className="ep-bc-current">e-Proceedings</span>
      </div>

      {/* ── Page Header ── */}
      <div className="ep-page-header">
        <div className="ep-page-left">
          <h1 className="ep-page-title">e-Proceedings</h1>
          <div className="ep-toggle">
            <button className={`ep-toggle-btn ${view==='self'?'active':''}`} onClick={() => setView('self')}>Self</button>
            <button className={`ep-toggle-btn ${view==='other'?'active':''}`} onClick={() => setView('other')}>Of Other ID</button>
          </div>
        </div>
        <div className="ep-page-right">
          <div className="ep-search">
            <Search size={13} className="ep-search-icon"/>
            <input placeholder="Search by PAN or Name…" value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <button className="btn btn-outline"><Filter size={13}/> Filter</button>
          <button className="btn btn-navy" onClick={fetchProceedings}><RefreshCw size={13}/> Refresh</button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="ep-tabs">
        {NAV_TABS.map((t, i) => (
          <button key={t} className={`ep-tab ${tab===i?'ep-tab-active':''}`} onClick={() => setTab(i)}>
            {t} {i === 0 ? `(${filtered.length})` : '(0)'}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10,padding:'60px 24px',color:'#94a3b8'}}>
          <Loader2 size={24} style={{animation:'spin 0.8s linear infinite'}}/>
          <span style={{fontSize:13}}>Loading proceedings…</span>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : error ? (
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10,padding:'60px 24px',color:'#dc2626'}}>
          <AlertCircle size={24}/>
          <span style={{fontSize:13}}>{error}</span>
          <button onClick={fetchProceedings} style={{display:'flex',alignItems:'center',gap:5,padding:'7px 16px',border:'1.5px solid #fecaca',borderRadius:8,fontSize:12,fontWeight:600,color:'#dc2626',background:'#fef2f2',cursor:'pointer'}}>
            <RefreshCw size={12}/> Retry
          </button>
        </div>
      ) : (
        <div className="ep-list">
          {tab === 0 && (
            filtered.length === 0 ? (
              <div className="ep-empty">No proceedings found{search ? ' matching your search' : ''}.</div>
            ) : filtered.map(p => {
              const status = getStatus(p);
              const icon   = getIcon(p);
              const name   = p.assessee_name || p.name_of_assessee || '—';
              const pan    = p.pan_number || p.user_pan || '—';
              return (
                <div key={p.id} className="ep-card">
                  <div className="ep-card-top">
                    <div className="ep-card-icon">
                      {icon === 'file' ? <FileText size={20}/> : <Mail size={20}/>}
                    </div>
                    <div className="ep-card-name-block">
                      <div className="ep-card-name">{p.notice_type || p.notice_us || 'Notice'}</div>
                      <div className="ep-card-year">ASSESSMENT YEAR: {p.assessment_year || '—'}</div>
                    </div>
                    <span className={`badge badge-${status.key}`}>{status.label}</span>
                  </div>

                  <div className="ep-card-grid">
                    <div className="ep-field">
                      <div className="ep-field-lbl">PAN / AUDIT ID</div>
                      <div className="ep-field-val bold">{pan}</div>
                    </div>
                    <div className="ep-field">
                      <div className="ep-field-lbl">ISSUE DATE</div>
                      <div className="ep-field-val">{p.issue_date || p.issued_on || '—'}</div>
                    </div>
                    <div className="ep-field">
                      <div className="ep-field-lbl">DUE DATE</div>
                      <div className={`ep-field-val ${p.response_due_date ? 'txt-red' : ''}`}>
                        {p.response_due_date || '—'}
                      </div>
                    </div>
                    <div className="ep-field">
                      <div className="ep-field-lbl">ASSESSEE NAME</div>
                      <div className="ep-field-val bold">{name}</div>
                    </div>
                    <div className="ep-field">
                      <div className="ep-field-lbl">CURRENT STATUS</div>
                      <div className="ep-cur-status">
                        <Clock size={13} style={{color:'var(--orange)',flexShrink:0}}/>
                        <div>
                          <div className="ep-cur-date">{p.notice_status || p.status || 'Open'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="ep-card-actions">
                    <button className="btn btn-primary" onClick={() => handleDownload(p)}>
                      <Download size={13}/> Download Notice
                    </button>
                    <button className="btn btn-outline">
                      <Eye size={13}/> View Details
                    </button>
                    <button className="btn btn-outline">
                      <UserPlus size={13}/> Add Representative
                    </button>
                  </div>
                </div>
              );
            })
          )}
          {tab === 1 && (
            <div className="ep-empty">No informational proceedings at this time.</div>
          )}
        </div>
      )}
    </div>
  );
}
