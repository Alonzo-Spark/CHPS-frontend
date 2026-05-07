import { useState, useEffect, useCallback } from 'react';
import {
  Download, UserPlus, TrendingUp, Users, Activity,
  ChevronLeft, ChevronRight, Pencil, Trash2, Filter,
  MoreVertical, Bell, CheckCircle, Loader2, AlertCircle,
  RefreshCw, Cpu, Database, Zap, FileText, Clock,
} from 'lucide-react';
import { dashboard, admin, users as usersApi } from '../services/api';
import './AdminDashboard.css';

// ── Small helpers ──────────────────────────────────────────────────────────────
function StatusBadge({ val, positiveLabel, negativeLabel }) {
  const ok = ['active', 'connected', 'running'].includes(String(val).toLowerCase());
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
      background: ok ? '#dcfce7' : '#fef2f2',
      color: ok ? '#16a34a' : '#dc2626',
      letterSpacing: '.05em',
    }}>
      {ok ? (positiveLabel || val) : (negativeLabel || val)}
    </span>
  );
}

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
      <Loader2 size={22} color="#2563eb" style={{ animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
}

function ErrorBox({ msg, onRetry }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      padding: '32px 16px', color: '#dc2626', fontSize: 13,
    }}>
      <AlertCircle size={20} />
      <span>{msg}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px',
            border: '1.5px solid #fecaca', borderRadius: 8, fontSize: 12,
            fontWeight: 600, color: '#dc2626', background: '#fef2f2', cursor: 'pointer',
          }}
        >
          <RefreshCw size={12} /> Retry
        </button>
      )}
    </div>
  );
}

// ── Add User Modal ─────────────────────────────────────────────────────────────
function AddUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff', panNumber: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit() {
    if (!form.name || !form.email || !form.password) { setErr('Name, email, and password are required.'); return; }
    setLoading(true); setErr('');
    try {
      const data = await usersApi.create({ ...form, status: 'active' });
      if (!data.success) { setErr(data.message || 'Failed to create user.'); return; }
      onCreated?.();
      onClose();
    } catch { setErr('Network error. Please try again.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Add Staff Member</h3>
        {err && <p style={{ color: '#dc2626', fontSize: 12, marginBottom: 10 }}>{err}</p>}
        <div className="form-group"><label>Full Name</label>
          <input className="form-input" placeholder="e.g. Priya Sharma" value={form.name} onChange={set('name')} />
        </div>
        <div className="form-group"><label>Email</label>
          <input className="form-input" type="email" placeholder="priya@audit.gov" value={form.email} onChange={set('email')} />
        </div>
        <div className="form-group"><label>Password</label>
          <input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} />
        </div>
        <div className="form-group"><label>Role</label>
          <select className="form-input" value={form.role} onChange={set('role')}>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="form-group"><label>PAN Number (optional)</label>
          <input className="form-input" placeholder="AHMPV4480E" value={form.panNumber}
            onChange={(e) => setForm((f) => ({ ...f, panNumber: e.target.value.toUpperCase() }))} maxLength={10} />
        </div>
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <><Loader2 size={13} style={{ animation: 'spin .8s linear infinite' }} /> Adding…</> : 'Add Member'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [modal, setModal]           = useState(false);
  const [kpi, setKpi]               = useState(null);
  const [kpiLoading, setKpiLoading] = useState(true);
  const [kpiError, setKpiError]     = useState('');

  const [systemInfo, setSystemInfo]   = useState(null);
  const [sysLoading, setSysLoading]   = useState(true);

  const [userList, setUserList]       = useState([]);
  const [userTotal, setUserTotal]     = useState(0);
  const [userPage, setUserPage]       = useState(1);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError]     = useState('');

  const [activity, setActivity]       = useState([]);
  const [actLoading, setActLoading]   = useState(true);

  const [toast, setToast]             = useState('');
  const USER_LIMIT = 5;

  // ── Fetch KPI ────────────────────────────────────────────────────────────────
  const fetchKpi = useCallback(async () => {
    setKpiLoading(true); setKpiError('');
    try {
      const data = await dashboard.getSummary();
      if (data.success) setKpi(data.dashboard);
      else setKpiError(data.message || 'Failed to load dashboard data.');
    } catch { setKpiError('Network error loading dashboard.'); }
    finally { setKpiLoading(false); }
  }, []);

  // ── Fetch System Monitoring ───────────────────────────────────────────────────
  const fetchSystem = useCallback(async () => {
    setSysLoading(true);
    try {
      const data = await admin.getSystemMonitoring();
      if (data.success) setSystemInfo(data.system);
    } catch { /* silent */ }
    finally { setSysLoading(false); }
  }, []);

  // ── Fetch Users ───────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async (page = 1) => {
    setUserLoading(true); setUserError('');
    try {
      const data = await admin.getUsers(page, USER_LIMIT);
      if (data.success) {
        setUserList(data.users || []);
        setUserTotal(data.count || 0);
      } else {
        setUserError(data.message || 'Failed to load users.');
      }
    } catch { setUserError('Network error loading users.'); }
    finally { setUserLoading(false); }
  }, []);

  // ── Fetch Recent Activity ─────────────────────────────────────────────────────
  const fetchActivity = useCallback(async () => {
    setActLoading(true);
    try {
      const data = await dashboard.getRecentActivity();
      if (data.success || data.activities) setActivity(data.activities || []);
    } catch { /* silent */ }
    finally { setActLoading(false); }
  }, []);

  useEffect(() => {
    fetchKpi();
    fetchSystem();
    fetchUsers(1);
    fetchActivity();
  }, [fetchKpi, fetchSystem, fetchUsers, fetchActivity]);

  const handlePageChange = (newPage) => {
    setUserPage(newPage);
    fetchUsers(newPage);
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const data = await usersApi.delete(id);
      if (data.success) {
        showToast('User deleted successfully.');
        fetchUsers(userPage);
      } else {
        showToast(data.message || 'Failed to delete user.', true);
      }
    } catch { showToast('Network error.', true); }
  };

  function showToast(msg, isErr = false) {
    setToast({ msg, isErr });
    setTimeout(() => setToast(''), 3000);
  }

  const totalPages = Math.ceil(userTotal / USER_LIMIT) || 1;

  return (
    <div className="adm fade-in">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.isErr ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${toast.isErr ? '#fecaca' : '#bbf7d0'}`,
          color: toast.isErr ? '#dc2626' : '#166534',
          borderRadius: 10, padding: '12px 18px', fontSize: 13,
          fontWeight: 500, boxShadow: '0 4px 20px rgba(0,0,0,.12)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="adm-header">
        <div>
          <h1 className="adm-title"><span>Admin</span> Dashboard</h1>
          <p className="adm-sub">Manage staff assignments and global audit performance.</p>
        </div>
        <div className="adm-actions">
          <button className="btn btn-outline"><Download size={14} /> Export Reports</button>
          <button className="btn btn-primary" onClick={() => setModal(true)}><UserPlus size={14} /> Add Staff Member</button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="kpi-row">
        {kpiLoading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="kpi-card" style={{ opacity: 0.5 }}>
              <div className="kpi-lbl">LOADING…</div>
              <div className="kpi-val">—</div>
            </div>
          ))
        ) : kpiError ? (
          <div style={{ gridColumn: '1/-1' }}><ErrorBox msg={kpiError} onRetry={fetchKpi} /></div>
        ) : (
          <>
            <div className="kpi-card">
              <div className="kpi-lbl">TOTAL USERS</div>
              <div className="kpi-val">{kpi?.totalUsers ?? '—'}</div>
              <div className="kpi-tag green"><TrendingUp size={11} /> Active: {kpi?.activeUsers ?? '—'}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-lbl">TOTAL RECORDS</div>
              <div className="kpi-val">{kpi?.totalRecords ?? '—'}</div>
              <div className="kpi-tag blue"><FileText size={11} /> All notices</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-lbl">NEW NOTICES</div>
              <div className="kpi-val">{kpi?.newNotices ?? '—'}</div>
              <div className="kpi-tag blue"><Bell size={11} /> This period</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-lbl">AUTOMATION SUCCESS</div>
              <div className="kpi-val">{kpi?.automationSuccessCount ?? '—'}</div>
              <div className="kpi-bar">
                <div className="kpi-bar-fill" style={{
                  width: kpi
                    ? `${Math.round((kpi.automationSuccessCount / (kpi.automationSuccessCount + kpi.automationFailedCount || 1)) * 100)}%`
                    : '0%'
                }} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Two-column section */}
      <div className="adm-mid">
        {/* Users Table */}
        <div className="card" style={{ flex: '1 1 0', minWidth: 0 }}>
          <div className="card-header">
            <div>
              <div className="card-title">User Management</div>
              <div className="card-subtitle">Showing {userList.length} of {userTotal} users</div>
            </div>
            <div className="card-actions">
              <button className="icon-btn"><Filter size={14} /></button>
              <button className="icon-btn" onClick={() => fetchUsers(userPage)}><RefreshCw size={14} /></button>
            </div>
          </div>

          {userLoading ? <Spinner /> : userError ? (
            <ErrorBox msg={userError} onRetry={() => fetchUsers(userPage)} />
          ) : (
            <>
              <table className="data-table">
                <thead><tr>
                  <th>NAME</th><th>EMAIL</th><th>ROLE</th><th>STATUS</th><th>ACTIONS</th>
                </tr></thead>
                <tbody>
                  {userList.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 13 }}>
                      No users found.
                    </td></tr>
                  ) : userList.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="dt-name-cell">
                          <div className="avatar" style={{ background: '#2563eb' }}>
                            {(u.name?.[0] || 'U').toUpperCase()}
                          </div>
                          {u.name}
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: '#64748b' }}>{u.email}</td>
                      <td><span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                        background: u.role === 'admin' ? '#eff6ff' : '#f0fdf4',
                        color: u.role === 'admin' ? '#1d4ed8' : '#166534',
                      }}>{u.role?.toUpperCase()}</span></td>
                      <td><StatusBadge val={u.status} positiveLabel="ACTIVE" negativeLabel="INACTIVE" /></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="icon-btn ib-blue" title="Edit"><Pencil size={13} /></button>
                          <button className="icon-btn ib-red" title="Delete" onClick={() => handleDeleteUser(u.id)}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="table-footer">
                <span>Page {userPage} of {totalPages}</span>
                <div className="pg-btns">
                  <button className="pg-btn" onClick={() => handlePageChange(userPage - 1)} disabled={userPage <= 1}>
                    <ChevronLeft size={14} />
                  </button>
                  <button className="pg-btn" onClick={() => handlePageChange(userPage + 1)} disabled={userPage >= totalPages}>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* System Monitoring + Quick Insights */}
        <div className="insights-panel">
          <div className="ip-title">System Status</div>
          {sysLoading ? <Spinner /> : systemInfo ? (
            <>
              {[
                { icon: <Activity size={13} />, label: 'Server', val: systemInfo.serverStatus, cls: 'green' },
                { icon: <Database size={13} />, label: 'Database', val: systemInfo.databaseStatus, cls: 'green' },
                { icon: <Zap size={13} />, label: 'Automation', val: systemInfo.automationStatus, cls: 'orange' },
                { icon: <Cpu size={13} />, label: 'CPU Usage', val: systemInfo.cpuUsage, cls: 'blue' },
                { icon: <Users size={13} />, label: 'Connections', val: systemInfo.activeConnections, cls: 'blue' },
              ].map(({ icon, label, val, cls }) => (
                <div key={label} className="ip-item">
                  <div className={`ip-icon ${cls}`}>{icon}</div>
                  <div>
                    <div className="ip-item-title">{label}</div>
                    <div className="ip-item-body">{val ?? '—'}</div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="ip-item">
              <div className="ip-icon green"><CheckCircle size={13} /></div>
              <div>
                <div className="ip-item-title">All Systems Nominal</div>
                <div className="ip-item-body">Connect to backend to see live status.</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Recent Activity</div>
            <div className="card-subtitle">LIVE SYSTEM ACTIVITY FEED</div>
          </div>
          <button className="icon-btn" onClick={fetchActivity}><RefreshCw size={14} /></button>
        </div>
        {actLoading ? <Spinner /> : activity.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', fontSize: 13, color: '#94a3b8' }}>
            No recent activity.
          </div>
        ) : (
          <table className="data-table">
            <thead><tr>
              <th>ACTIVITY</th><th>USER</th><th>TIMESTAMP</th>
            </tr></thead>
            <tbody>
              {activity.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Clock size={13} color="#94a3b8" />
                      {a.activity}
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>{a.user}</td>
                  <td style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>{a.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add User Modal */}
      {modal && (
        <AddUserModal
          onClose={() => setModal(false)}
          onCreated={() => fetchUsers(1)}
        />
      )}
    </div>
  );
}
