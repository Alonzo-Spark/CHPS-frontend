import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, Filter, Download, Search,
  CheckCircle2, Clock, FileText, Mail, UserPlus, Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './EProceedings.css';

const PROCEEDINGS = [
  {
    id: 'EP-001',
    icon: 'file',
    name: 'Assessment Proceeding u/s 147',
    year: '2021-22',
    status: 'in-progress',
    statusLabel: 'IN PROGRESS',
    auditId: 'AHMPV4480E',
    assessee: 'BABJI VANACHARLA',
    limitDate: '31-Mar-2027',
    limitUrgent: true,
    finYear: '2020-21',
    act: 'Audit Act 1961',
    activities: [
      { done: true,  label: 'Notice Issued',          date: '24-Apr-2026' },
      { done: true,  label: 'E-Verification Complete', date: '22-Apr-2026' },
    ],
    noticeCount: 4,
    currentStatus: null,
  },
  {
    id: 'EP-002',
    icon: 'mail',
    name: 'Issue Letter',
    year: '2020-21',
    status: 'pending-action',
    statusLabel: 'PENDING ACTION',
    auditId: 'AHMPV4480E',
    assessee: 'BABJI VANACHARLA',
    limitDate: null,
    finYear: '2019-20',
    act: 'Audit Act 1961',
    activities: [],
    noticeCount: 1,
    currentStatus: { date: '14-May-2025', label: 'Open', note: 'Waiting for staff review' },
  },
];

const NAV_TABS = ['For your Action (5)', 'For your Information (2)'];
const TOP_NAV  = ['Dashboard','e-File','Authorized Partners','Services','AIS','Pending Actions','Grievances','Help'];

export default function EProceedings() {
  const [tab, setTab]     = useState(0);
  const [view, setView]   = useState('self');
  const [search, setSearch] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const filtered = PROCEEDINGS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.auditId.toLowerCase().includes(search.toLowerCase()) ||
    p.assessee.toLowerCase().includes(search.toLowerCase())
  );

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
            <div className="ep-user-avatar">{user?.name?.[0] || 'B'}</div>
            <div>
              <div className="ep-user-name">{user?.name?.toUpperCase() || 'BABJI VANACHARLA'}</div>
              <div className="ep-user-role">STAFF</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Portal Nav ── */}
      <div className="ep-portal-nav">
        {TOP_NAV.map((n, i) => (
          <button key={n} className={`ep-nav-item ${n==='Services'?'ep-nav-active':''}`}>{n}</button>
        ))}
        <div className="ep-session"><Clock size={12}/> Session: 14:59</div>
      </div>

      {/* ── Breadcrumb ── */}
      <div className="ep-breadcrumb">
        <button onClick={() => navigate('/dashboard')} className="ep-bc-link">Dashboard</button>
        <ChevronRight size={13} className="ep-bc-sep"/>
        <span className="ep-bc-link" onClick={()=>navigate('/tasks')}>Pending Actions</span>
        <ChevronRight size={13} className="ep-bc-sep"/>
        <span className="ep-bc-current">e-Proceedings</span>
      </div>

      {/* ── Page Header ── */}
      <div className="ep-page-header">
        <div className="ep-page-left">
          <h1 className="ep-page-title">e-Proceedings</h1>
          <div className="ep-toggle">
            <button className={`ep-toggle-btn ${view==='self'?'active':''}`} onClick={()=>setView('self')}>Self</button>
            <button className={`ep-toggle-btn ${view==='other'?'active':''}`} onClick={()=>setView('other')}>Of Other ID</button>
          </div>
        </div>
        <div className="ep-page-right">
          <div className="ep-search">
            <Search size={13} className="ep-search-icon"/>
            <input placeholder="Search by ID or Name…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <button className="btn btn-outline"><Filter size={13}/> Filter</button>
          <button className="btn btn-navy"><Download size={13}/> Excel Download</button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="ep-tabs">
        {NAV_TABS.map((t, i) => (
          <button key={t} className={`ep-tab ${tab===i?'ep-tab-active':''}`} onClick={()=>setTab(i)}>{t}</button>
        ))}
      </div>

      {/* ── Proceedings List ── */}
      <div className="ep-list">
        {filtered.map(p => (
          <div key={p.id} className="ep-card">
            {/* Card top row */}
            <div className="ep-card-top">
              <div className="ep-card-icon">
                {p.icon === 'file' ? <FileText size={20}/> : <Mail size={20}/>}
              </div>
              <div className="ep-card-name-block">
                <div className="ep-card-name">{p.name}</div>
                <div className="ep-card-year">ASSESSMENT YEAR: {p.year}</div>
              </div>
              <span className={`badge badge-${p.status}`}>{p.statusLabel}</span>
            </div>

            {/* Card grid */}
            <div className="ep-card-grid">
              <div className="ep-field">
                <div className="ep-field-lbl">AUDIT ID / PAN</div>
                <div className="ep-field-val bold">{p.auditId}</div>
              </div>
              {p.limitDate && (
                <div className="ep-field">
                  <div className="ep-field-lbl">LIMITATION DATE</div>
                  <div className={`ep-field-val ${p.limitUrgent?'txt-red':''}`}>{p.limitDate}</div>
                </div>
              )}
              <div className="ep-field">
                <div className="ep-field-lbl">FINANCIAL YEAR</div>
                <div className="ep-field-val">{p.finYear}</div>
              </div>

              {/* Activity / Status */}
              {p.activities.length > 0 ? (
                <div className="ep-field ep-activities">
                  <div className="ep-field-lbl">RECENT ACTIVITY</div>
                  {p.activities.map(a => (
                    <div key={a.label} className="ep-activity">
                      <CheckCircle2 size={13} className="ep-act-icon done"/>
                      <div>
                        <div className="ep-act-label">{a.label}</div>
                        <div className="ep-act-date">{a.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ep-field">
                  <div className="ep-field-lbl">CURRENT STATUS</div>
                  {p.currentStatus && (
                    <div className="ep-cur-status">
                      <Clock size={13} style={{color:'var(--orange)', flexShrink:0}}/>
                      <div>
                        <div className="ep-cur-date">{p.currentStatus.date} · {p.currentStatus.label}</div>
                        <div className="ep-cur-note">{p.currentStatus.note}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="ep-field">
                <div className="ep-field-lbl">ASSESSEE NAME</div>
                <div className="ep-field-val bold">{p.assessee}</div>
              </div>

              <div className="ep-field">
                <div className="ep-field-lbl">APPLICABLE ACT</div>
                <div className="ep-field-val">{p.act}</div>
              </div>
            </div>

            {/* Card actions */}
            <div className="ep-card-actions">
              <button className="btn btn-primary">
                <Eye size={13}/> View Notices/Orders ({p.noticeCount})
              </button>
              <button className="btn btn-outline">
                <UserPlus size={13}/> + Add / View Authorized Representative
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="ep-empty">No proceedings found matching your search.</div>
        )}
      </div>
    </div>
  );
}
