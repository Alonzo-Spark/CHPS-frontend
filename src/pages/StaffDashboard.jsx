import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Filter, ChevronLeft, ChevronRight,
  MoreVertical, TrendingUp, Rocket, RefreshCw,
  AlertCircle, Loader2
} from 'lucide-react';

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const BACKEND_URL      = import.meta.env.VITE_BACKEND_URL      || 'http://localhost:5000';
const AUTOMATION_URL   = import.meta.env.VITE_AUTOMATION_URL   || 'http://localhost:3001';

// ─── INLINE STYLES ───────────────────────────────────────────────────────────
const S = {
  staff: {
    display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1200,
  },
  /* KPI row */
  kpiRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3,1fr)',
    gap: 16,
  },
  kpiCard: {
    background: '#fff',
    border: '1px solid var(--gray-200)',
    borderRadius: 'var(--r-md)',
    padding: '18px 20px 14px',
    boxShadow: 'var(--shadow-sm)',
  },
  skLbl: {
    fontSize: 10, fontWeight: 600, letterSpacing: '.1em',
    color: 'var(--gray-400)', marginBottom: 6,
  },
  skVal: {
    fontSize: 27, fontWeight: 700, color: 'var(--gray-800)',
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
  },
  skGreen: { fontSize: 11, color: 'var(--green)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 },
  skRed:   { fontSize: 11, color: 'var(--red)', fontWeight: 500 },
  skBlue:  { fontSize: 11, color: 'var(--blue-primary)', fontWeight: 500 },
  redVal:  { color: 'var(--red)' },
  skBar:   { height: 3, borderRadius: 99 },
  blueBar: { background: 'var(--blue-primary)', width: '55%' },
  redBar:  { background: 'var(--red)', width: '30%' },
  /* Card */
  card: {
    background: '#fff',
    border: '1px solid var(--gray-200)',
    borderRadius: 'var(--r-md)',
    boxShadow: 'var(--shadow-sm)',
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: '20px 24px 16px', gap: 12, flexWrap: 'wrap',
  },
  cardTitle:    { fontSize: 15, fontWeight: 700, color: 'var(--gray-800)', marginBottom: 3 },
  cardSubtitle: { fontSize: 12, color: 'var(--gray-400)' },
  cardActions:  { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  searchMini: {
    padding: '7px 12px',
    border: '1.5px solid var(--gray-200)',
    borderRadius: 99,
    fontSize: 12,
    color: 'var(--gray-600)',
    background: 'var(--gray-50)',
    fontFamily: 'var(--font)',
    width: 160,
    outline: 'none',
  },
  /* Buttons */
  btnOutline: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '7px 14px', border: '1.5px solid var(--gray-200)',
    borderRadius: 8, fontSize: 12, fontWeight: 600,
    color: 'var(--gray-600)', background: '#fff', cursor: 'pointer',
  },
  btnPrimary: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '7px 14px', border: 'none',
    borderRadius: 8, fontSize: 12, fontWeight: 600,
    color: '#fff', background: 'var(--blue-primary)', cursor: 'pointer',
  },
  btnNavy: {
    padding: '9px 18px', border: 'none', borderRadius: 8,
    fontSize: 12, fontWeight: 600, color: '#fff',
    background: 'var(--navy)', cursor: 'pointer', marginTop: 14,
  },
  /* Table */
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: {
    padding: '10px 16px', textAlign: 'left', fontSize: 10,
    fontWeight: 700, letterSpacing: '.08em', color: 'var(--gray-400)',
    borderBottom: '1px solid var(--gray-100)', background: 'var(--gray-50)',
  },
  td: {
    padding: '13px 16px', borderBottom: '1px solid var(--gray-100)',
    color: 'var(--gray-700)',
  },
  tdMuted: { color: 'var(--gray-400)', fontSize: 12 },
  tdMono:  { fontFamily: 'monospace', fontWeight: 500, color: 'var(--gray-800)' },
  nameCell: { display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500 },
  avatar: {
    width: 32, height: 32, borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
  },
  iconBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--gray-400)', padding: 4, borderRadius: 4,
  },
  tableFooter: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 20px', fontSize: 12, color: 'var(--gray-400)',
    borderTop: '1px solid var(--gray-100)',
  },
  pgBtns: { display: 'flex', gap: 4 },
  pgBtn: {
    width: 28, height: 28, border: '1px solid var(--gray-200)',
    borderRadius: 6, background: '#fff', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--gray-500)',
  },
  /* Badges */
  badge: (status) => {
    const map = {
      urgent:   { background: '#fef2f2', color: '#dc2626' },
      pending:  { background: '#fffbeb', color: '#d97706' },
      settled:  { background: '#f0fdf4', color: '#16a34a' },
      reviewed: { background: '#eff6ff', color: '#2563eb' },
    };
    const b = map[status] || { background: '#f3f4f6', color: '#6b7280' };
    return {
      ...b, padding: '3px 9px', borderRadius: 99,
      fontSize: 10, fontWeight: 700, letterSpacing: '.06em',
      display: 'inline-block',
    };
  },
  /* Bottom row */
  bottom: {
    display: 'grid', gridTemplateColumns: '1fr 240px', gap: 16,
  },
  arText: { fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6 },
  /* Notice velocity panel */
  nvPanel: {
    background: 'var(--navy)', borderRadius: 'var(--r-md)', padding: 20,
  },
  nvHdr: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8,
  },
  nvHdrSpan:  { fontSize: 13, fontWeight: 600, color: '#fff' },
  nvDesc:     { fontSize: 11, color: 'rgba(255,255,255,.5)', lineHeight: 1.5, marginBottom: 16 },
  nvMetricRow:{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 600, letterSpacing: '.06em', color: 'rgba(255,255,255,.55)', marginBottom: 5 },
  nvBar:      { height: 5, background: 'rgba(255,255,255,.15)', borderRadius: 99, overflow: 'hidden' },
  nvBarFill:  (w) => ({ height: '100%', background: 'var(--blue-accent)', borderRadius: 99, width: `${w}%` }),
  nvSync:     { display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'rgba(255,255,255,.35)', letterSpacing: '.06em', marginTop: 12 },
  /* Modal */
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    background: '#fff', borderRadius: 12, padding: 28,
    width: 400, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,.25)',
  },
  modalH3:    { fontSize: 17, fontWeight: 700, color: 'var(--gray-800)', marginBottom: 18 },
  formGroup:  { marginBottom: 14 },
  formLabel:  { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', marginBottom: 5 },
  formInput: {
    width: '100%', padding: '9px 12px',
    border: '1.5px solid var(--gray-200)', borderRadius: 8,
    fontSize: 13, fontFamily: 'var(--font)', outline: 'none',
    boxSizing: 'border-box',
  },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 },
  /* States */
  stateBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '48px 24px',
    color: 'var(--gray-400)', gap: 10,
  },
  stateText: { fontSize: 13, color: 'var(--gray-400)' },
};

// ─── AVATAR COLORS ────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  '#6366f1','#f59e0b','#22c55e','#3b82f6','#ec4899',
  '#14b8a6','#f97316','#8b5cf6',
];
function colorFor(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// ─── API HELPERS ──────────────────────────────────────────────────────────────
function authHeaders() {
  const token = localStorage.getItem('accessToken');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function apiFetch(url, opts = {}) {
  const res = await fetch(url, { ...opts, headers: { ...authHeaders(), ...(opts.headers || {}) } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Request failed');
  }
  return res.json();
}

// ─── CUSTOM HOOKS ────────────────────────────────────────────────────────────
function useDashboardStats() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const fetch_ = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      // GET /api/dashboard/stats  (AUTOMATION API)
      // Expected: { totalAssigned, totalAssignedChange, pendingTasks, pendingDueToday,
      //             recentlyUpdated, recentlyUpdatedPeriod,
      //             auditDiscrepancies, processingSpeed, processingPercent, nextSyncMinutes }
      const data = await apiFetch(`${AUTOMATION_URL}/api/dashboard/stats`);
      setStats(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);
  return { stats, loading, error, refetch: fetch_ };
}

function useAssignments(page = 1, search = '') {
  const [data, setData]     = useState({ assignments: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const fetch_ = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      // GET /api/notices?page=1&limit=10&search=&status=
      // Expected: { notices: [...], total: N, page: N, limit: N }
      // Each notice: { id, name_of_assessee, user_pan, notice_us, amount_due,
      //               issued_on, response_due_date, status, reference_id }
      const qs = new URLSearchParams({ page, limit: 10, ...(search ? { search } : {}) });
      const res = await apiFetch(`${AUTOMATION_URL}/api/notices?${qs}`);
      setData({ assignments: res.notices || [], total: res.total || 0 });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetch_(); }, [fetch_]);
  return { ...data, loading, error, refetch: fetch_ };
}

// ─── NOTICE FORM ──────────────────────────────────────────────────────────────
const PENALTY_TYPES = ['Late Tax Filing','VAT Discrepancy','TDS Default','Interest Penalty','Audit Discrepancy'];

function NewNoticeModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    clientName: '', penaltyType: PENALTY_TYPES[0], amountDue: '', dueDate: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit() {
    if (!form.clientName || !form.amountDue || !form.dueDate) {
      setErr('Please fill all fields.'); return;
    }
    setSubmitting(true); setErr(null);
    try {
      // POST /api/notices
      // Body: { name_of_assessee, notice_us, amount_due, response_due_date }
      await apiFetch(`${AUTOMATION_URL}/api/notices`, {
        method: 'POST',
        body: JSON.stringify({
          name_of_assessee: form.clientName,
          notice_us: form.penaltyType,
          amount_due: form.amountDue,
          response_due_date: form.dueDate,
        }),
      });
      onCreated?.();
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <h3 style={S.modalH3}>Create New Notice</h3>

        {err && (
          <div style={{ display:'flex', gap:6, alignItems:'center', background:'#fef2f2',
            border:'1px solid #fecaca', borderRadius:8, padding:'8px 12px', marginBottom:14,
            fontSize:12, color:'#dc2626' }}>
            <AlertCircle size={13}/> {err}
          </div>
        )}

        <div style={S.formGroup}>
          <label style={S.formLabel}>Client Name</label>
          <input style={S.formInput} placeholder="e.g. Omega Tech Ltd."
            value={form.clientName} onChange={set('clientName')} />
        </div>
        <div style={S.formGroup}>
          <label style={S.formLabel}>Penalty Type</label>
          <select style={S.formInput} value={form.penaltyType} onChange={set('penaltyType')}>
            {PENALTY_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div style={S.formGroup}>
          <label style={S.formLabel}>Amount Due</label>
          <input style={S.formInput} placeholder="e.g. $2,500.00"
            value={form.amountDue} onChange={set('amountDue')} />
        </div>
        <div style={S.formGroup}>
          <label style={S.formLabel}>Due Date</label>
          <input style={S.formInput} type="date"
            value={form.dueDate} onChange={set('dueDate')} />
        </div>

        <div style={S.modalActions}>
          <button style={S.btnOutline} onClick={onClose} disabled={submitting}>Cancel</button>
          <button style={{ ...S.btnPrimary, opacity: submitting ? .6 : 1 }}
            onClick={handleSubmit} disabled={submitting}>
            {submitting ? <><Loader2 size={12} style={{ animation:'spin 1s linear infinite' }}/> Creating…</> : 'Create Notice'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, subStyle, barStyle }) {
  return (
    <div style={S.kpiCard}>
      <div style={S.skLbl}>{label}</div>
      <div style={{ ...S.skVal, ...(subStyle?.color === 'var(--red)' ? S.redVal : {}) }}>
        {value}
        {sub && <span style={subStyle}>{sub}</span>}
      </div>
      <div style={{ ...S.skBar, ...barStyle }} />
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function StaffDashboard() {
  const [modal, setModal]   = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);
  const navigate = useNavigate();

  const { stats, loading: statsLoading } = useDashboardStats();
  const { assignments, total, loading: assignLoading, error: assignError, refetch } =
    useAssignments(page, search);

  const PAGE_SIZE = 10;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  /* Derived KPI values (fallback to skeleton dashes while loading) */
  const kpiData = stats ? [
    {
      label: 'TOTAL ASSIGNED',
      value: stats.totalAssigned ?? '—',
      sub: stats.totalAssignedChange != null
        ? <><TrendingUp size={12}/> {stats.totalAssignedChange > 0 ? '+' : ''}{stats.totalAssignedChange}%</>
        : null,
      subStyle: S.skGreen,
      barStyle: { ...S.skBar, ...S.blueBar },
    },
    {
      label: 'PENDING TASKS',
      value: stats.pendingTasks ?? '—',
      sub: stats.pendingDueToday != null ? `${stats.pendingDueToday} due today` : 'Due today',
      subStyle: S.skRed,
      barStyle: { ...S.skBar, ...S.redBar },
    },
    {
      label: 'RECENTLY UPDATED',
      value: stats.recentlyUpdated ?? '—',
      sub: stats.recentlyUpdatedPeriod || 'Last 24h',
      subStyle: S.skBlue,
      barStyle: { ...S.skBar, ...S.blueBar },
    },
  ] : Array(3).fill({ label: '…', value: '—', sub: null, barStyle: { ...S.skBar, ...S.blueBar } });

  return (
    <div style={S.staff}>
      {/* ── KPI Row ── */}
      <div style={S.kpiRow}>
        {kpiData.map((k, i) => <KpiCard key={i} {...k} />)}
      </div>

      {/* ── My Assignments ── */}
      <div style={S.card}>
        <div style={S.cardHeader}>
          <div>
            <div style={S.cardTitle}>My Assignments</div>
            <div style={S.cardSubtitle}>Managing notification workflow and compliance deadlines</div>
          </div>
          <div style={S.cardActions}>
            <input
              style={S.searchMini}
              placeholder="Search assignments…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
            <button style={S.btnOutline}><Filter size={13}/> Filter</button>
            <button style={S.btnPrimary} onClick={() => setModal(true)}>
              <Plus size={13}/> New Notice
            </button>
          </div>
        </div>

        <table style={S.table}>
          <thead>
            <tr>
              {['USER/CLIENT NAME','PENALTY TYPE','AMOUNT DUE','ISSUE DATE','DUE DATE','STATUS',''].map(h => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assignLoading ? (
              <tr><td colSpan={7} style={S.td}>
                <div style={S.stateBox}><Loader2 size={20} style={{ animation:'spin 1s linear infinite' }}/><span style={S.stateText}>Loading assignments…</span></div>
              </td></tr>
            ) : assignError ? (
              <tr><td colSpan={7} style={S.td}>
                <div style={S.stateBox}><AlertCircle size={20} color="var(--red)"/><span style={S.stateText}>{assignError}</span>
                  <button style={S.btnOutline} onClick={refetch}><RefreshCw size={12}/> Retry</button>
                </div>
              </td></tr>
            ) : assignments.length === 0 ? (
              <tr><td colSpan={7} style={S.td}>
                <div style={S.stateBox}><span style={S.stateText}>No assignments found.</span></div>
              </td></tr>
            ) : assignments.map(a => {
              const clientName = a.name_of_assessee || a.clientName || '—';
              const status = (a.status || 'pending').toLowerCase();
              const color = colorFor(clientName);
              return (
                <tr key={a.id || a.reference_id}>
                  <td style={S.td}>
                    <div style={S.nameCell}>
                      <div style={{ ...S.avatar, background: color }}>{initials(clientName)}</div>
                      {clientName}
                    </div>
                  </td>
                  <td style={S.td}>{a.notice_us || a.penaltyType || '—'}</td>
                  <td style={{ ...S.td, ...S.tdMono }}>{a.amount_due || a.amountDue || '—'}</td>
                  <td style={{ ...S.td, ...S.tdMuted }}>{a.issued_on || a.issueDate || '—'}</td>
                  <td style={{ ...S.td, ...S.tdMuted }}>{a.response_due_date || a.dueDate || '—'}</td>
                  <td style={S.td}><span style={S.badge(status)}>{status.toUpperCase()}</span></td>
                  <td style={S.td}><button style={S.iconBtn}><MoreVertical size={14}/></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={S.tableFooter}>
          <span>Showing {assignments.length} of {total} assignments</span>
          <div style={S.pgBtns}>
            <button style={S.pgBtn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
              <ChevronLeft size={14}/>
            </button>
            <button style={S.pgBtn} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
              <ChevronRight size={14}/>
            </button>
          </div>
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div style={S.bottom}>
        {/* Audit Readiness */}
        <div style={{ ...S.card, padding: '22px 24px' }}>
          <div style={S.cardTitle}>Audit Readiness Report</div>
          <p style={S.arText}>
            {statsLoading
              ? 'Loading audit summary…'
              : stats?.auditDiscrepancies != null
                ? `Our automated scanning system has detected ${stats.auditDiscrepancies} new potential discrepanc${stats.auditDiscrepancies === 1 ? 'y' : 'ies'} in the Q3 compliance filings. Review these early to avoid escalating penalties.`
                : 'Our automated scanning system has detected potential discrepancies in the Q3 compliance filings. Review these early to avoid escalating penalties.'
            }
          </p>
          <button style={S.btnNavy}>Launch Audit Assistant</button>
        </div>

        {/* Notice Velocity */}
        <div style={S.nvPanel}>
          <div style={S.nvHdr}>
            <span style={S.nvHdrSpan}>Notice Velocity</span>
            <TrendingUp size={15} style={{ color: '#4ade80' }}/>
          </div>
          <p style={S.nvDesc}>
            {statsLoading
              ? 'Loading…'
              : stats?.processingSpeed != null
                ? `Current processing speed is ${Math.abs(stats.processingSpeed)}% ${stats.processingSpeed >= 0 ? 'higher' : 'lower'} than last quarter. System performance remains optimal.`
                : 'System performance metrics are being calculated.'
            }
          </p>
          <div style={{ marginBottom: 8 }}>
            <div style={S.nvMetricRow}>
              <span>PROCESSING</span>
              <span>{statsLoading ? '…' : `${stats?.processingPercent ?? 0}%`}</span>
            </div>
            <div style={S.nvBar}>
              <div style={S.nvBarFill(statsLoading ? 0 : (stats?.processingPercent ?? 0))}/>
            </div>
          </div>
          <div style={S.nvSync}>
            <Rocket size={11}/> NEXT SYNC
            {!statsLoading && stats?.nextSyncMinutes != null && (
              <span style={{ marginLeft: 4 }}>in {stats.nextSyncMinutes}m</span>
            )}
          </div>
        </div>
      </div>

      {/* ── New Notice Modal ── */}
      {modal && (
        <NewNoticeModal
          onClose={() => setModal(false)}
          onCreated={refetch}
        />
      )}

      {/* ── Spinner keyframe (injected once) ── */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}