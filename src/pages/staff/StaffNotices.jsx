import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, FileText, Mail, Scale, Eye, Check } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { noticeService } from '../../services'

const statusBadge = (status) => {
  const styles = {
    'In Progress': { background: '#eff6ff', color: '#1d4ed8', border: '0.5px solid #bfdbfe' },
    'Pending Action': { background: '#fffbeb', color: '#92400e', border: '0.5px solid #fcd34d' },
    'Completed': { background: '#f0fdf4', color: '#166534', border: '0.5px solid #bbf7d0' },
  }
  const s = styles[status] || styles['In Progress']
  return (
    <span style={{ ...s, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>{status}</span>
  )
}

const TlDot = ({ type }) => {
  const base = { width: 15, height: 15, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }
  if (type === 'done') return <div style={{ ...base, background: '#16a34a' }}><Check size={9} color="#fff" /></div>
  if (type === 'open') return <div style={{ ...base, background: '#2563eb' }}><div style={{ width: 5, height: 5, background: '#fff', borderRadius: '50%' }}></div></div>
  return <div style={{ ...base, border: '2px solid #d97706', background: '#fffbeb' }}></div>
}

export default function StaffNotices() {
  const [proceedings, setProceedings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('action')
  const navigate = useNavigate()

  useEffect(() => {
    noticeService.getNotices()
      .then(res => {
        const raw = res.data?.items || res.data?.data || res.data || []
        setProceedings(Array.isArray(raw) ? raw : [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const iconFor = (name = '') => {
    if (name.toLowerCase().includes('appeal')) return <Scale size={15} color="#7c3aed" />
    if (name.toLowerCase().includes('letter')) return <Mail size={15} color="#d97706" />
    return <FileText size={15} color="#2563eb" />
  }

  const statusFor = (p) => {
    if (p.status) return p.status
    return 'In Progress'
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Dashboard', path: '/staff/dashboard' }, { label: 'Notices' }]}>
      <div style={{ padding: '16px 20px' }}>
        <div style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: 19, fontWeight: 500, color: '#1e293b' }}>Notices</h2>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>View and manage notice proceedings and responses</p>
        </div>

        {/* Search + Filter */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 14, gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '0.5px solid #cbd5e1', borderRadius: 8, padding: '7px 12px', background: '#fff' }}>
            <Search size={13} color="#94a3b8" />
            <input placeholder="Search by Notice ID / PAN / Name…" style={{ border: 'none', outline: 'none', fontSize: 12, color: '#1e293b', background: 'transparent', width: 220 }} />
          </div>
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: '#fff', color: '#64748b', border: '0.5px solid #e2e8f0', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
            <Filter size={13} /> Filter
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1.5px solid #e2e8f0', marginBottom: 16 }}>
          {[['action', 'For your Action (5)'], ['info', 'For your Information (2)']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{ padding: '8px 16px', fontSize: 13, fontWeight: activeTab === key ? 500 : 400, color: activeTab === key ? '#2563eb' : '#64748b', border: 'none', background: 'none', cursor: 'pointer', borderBottom: activeTab === key ? '2px solid #2563eb' : '2px solid transparent', marginBottom: -1.5 }}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>Loading proceedings...</div>
        ) : proceedings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>No proceedings found.</div>
        ) : (
          proceedings.map((p, idx) => (
            <div key={p.id} style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ background: '#f0f4f8', borderBottom: '0.5px solid #e2e8f0', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {iconFor(p.proceeding_name)}
                  <span style={{ fontSize: 12, color: '#64748b' }}>Proceeding Name :</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>{p.proceeding_name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Assessment Year :</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>{p.assessment_year}</span>
                  <span style={{ marginLeft: 6 }}>{statusBadge(statusFor(p))}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 1fr 180px' }}>
                {/* Col 1 */}
                <div style={{ padding: '14px 16px', borderRight: '0.5px solid #e2e8f0' }}>
                  <p style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>PAN</p>
                  <p style={{ fontSize: 13, fontWeight: 500, fontFamily: 'monospace', color: '#1e293b' }}>{p.pan_number}</p>
                  <p style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3, marginTop: 10 }}>Name of assessee</p>
                  <p style={{ fontSize: 12, fontWeight: 500, color: '#1e293b' }}>{p.assessee_name}</p>
                </div>

                {/* Col 2 - Timeline */}
                <div style={{ padding: '14px 16px', borderRight: '0.5px solid #e2e8f0' }}>
                  <p style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>Activity timeline</p>
                  {(p.timeline || [{ date: '—', status: 'open' }]).map((t, ti) => (
                    <div key={ti} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10, position: 'relative' }}>
                      <TlDot type={t.type || 'open'} />
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 500, color: '#1e293b' }}>{t.date}</p>
                        <p style={{ fontSize: 11, color: t.type === 'done' ? '#16a34a' : t.type === 'open' ? '#2563eb' : '#d97706' }}>{t.label || t.status}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Col 3 */}
                <div style={{ padding: '14px 16px', borderRight: '0.5px solid #e2e8f0' }}>
                  <p style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>Financial year</p>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>{p.financial_year}</p>
                  <p style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginTop: 10, marginBottom: 3 }}>Applicable act</p>
                  <p style={{ fontSize: 12, fontWeight: 500, color: '#1e293b' }}>Income Tax Act 1961</p>
                </div>

                {/* Col 4 - Action */}
                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <button
                    onClick={() => navigate(`/staff/notice-orders/${p.proceeding_id || p.id || p.notice_id}`)}
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 14px', background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 500, cursor: 'pointer', width: '100%' }}
                  >
                    <Eye size={13} /> View Notices/Orders
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

        <p style={{ fontSize: 12, color: '#64748b', textAlign: 'center', padding: '4px 0' }}>
          Showing {proceedings.length} proceedings
        </p>
      </div>
    </DashboardLayout>
  )
}
