import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, FileText, Mail, Scale, Eye, Check } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { noticeService } from '../../services'

const statusBadge = (status) => {
  const styles = {
    'In Progress': { background: '#eff6ff', color: '#1d4ed8', border: '0.5px solid #bfdbfe' },
    'Pending': { background: '#fffbeb', color: '#92400e', border: '0.5px solid #fcd34d' },
    'Completed': { background: '#f0fdf4', color: '#166534', border: '0.5px solid #bbf7d0' },
  }
  const s = styles[status] || styles['In Progress']
  return (
    <span style={{ ...s, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>{status}</span>
  )
}

const TlDot = ({ type }) => {
  const base = { width: 14, height: 14, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 3 }
  if (type === 'done') return <div style={{ ...base, background: '#16a34a' }}></div>
  if (type === 'open') return <div style={{ ...base, background: '#2563eb' }}></div>
  if (type === 'pending') return <div style={{ ...base, border: '2.5px solid #ea580c', background: '#fff' }}></div>
  return <div style={{ ...base, border: '2.5px solid #cbd5e1', background: '#fff' }}></div>
}





export default function StaffNotices() {
  const [proceedings, setProceedings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('action')
  const navigate = useNavigate()

  useEffect(() => {
    noticeService.getNotices()
      .then(res => {
        const notices = res.data || []
        const grouped = {}
        
        notices.forEach(n => {
          const name = n.proceeding_name || n.notice_type || "Assessment Proceeding u/s 147"
          if (!grouped[name]) {
            grouped[name] = {
              id: n.id || n.notice_id || String(Math.random()),
              proceeding_name: name,
              assessment_year: n.assessment_year || "2021-22",
              status: n.status || "In Progress",
              limitation_date: n.limitation_date || "31-Mar-2027",
              closure_date: n.closure_date || "—",
              financial_year: n.financial_year || "2020-21",
              closure_order: n.closure_order || "—",
              applicable_act: n.applicable_act || "Income Tax Act 1961",
              pan: n.pan || n.pan_number || "N/A",
              assessee_name: n.user_name || n.assessee_name || "N/A",
              notices_count: 0,
              timeline: []
            }
          }
          grouped[name].notices_count += 1
          grouped[name].timeline.push({
            date: n.issued_on || "—",
            label: n.status || "Pending",
            type: (n.status || "").toLowerCase() === "completed" ? "done" : "open"
          })
        })
        
        setProceedings(Object.values(grouped))
      })
      .catch(err => {
        console.error("Failed to load notices for proceedings", err)
        setProceedings([])
      })
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

  const actionList = proceedings.filter(p => p.status?.toLowerCase() !== 'completed' && p.status?.toLowerCase() !== 'closed')
  const infoList = proceedings.filter(p => p.status?.toLowerCase() === 'completed' || p.status?.toLowerCase() === 'closed')
  const currentList = activeTab === 'action' ? actionList : infoList

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Dashboard', path: '/staff/dashboard' }, { label: 'Notices' }]}>
      <div style={{ padding: '16px 20px' }}>
        <div style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: 19, fontWeight: 500, color: '#1e293b' }}>Notices</h2>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>View and manage notice proceedings and responses</p>
        </div>

        {/* Search + Filter */}
        {activeTab !== 'info' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 14, gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '0.5px solid #cbd5e1', borderRadius: 8, padding: '7px 12px', background: '#fff' }}>
              <Search size={13} color="#94a3b8" />
              <input placeholder="Search by Notice ID / PAN / Name…" style={{ border: 'none', outline: 'none', fontSize: 12, color: '#1e293b', background: 'transparent', width: 220 }} />
            </div>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: '#fff', color: '#64748b', border: '0.5px solid #e2e8f0', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
              <Filter size={13} /> Filter
            </button>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1.5px solid #e2e8f0', marginBottom: 16 }}>
          {[['action', `For your Action (${actionList.length})`], ['info', `For your Information (${infoList.length})`]].map(([key, label]) => (
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
        ) : currentList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>No proceedings found.</div>
        ) : (
          currentList.map((p, idx) => {
            if (activeTab === 'info') {
              return (
                <div key={p.id} style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
                  {/* Info Header */}
                  <div style={{ background: '#f1f5f9', borderBottom: '0.5px solid #e2e8f0', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, color: '#64748b' }}>Proceeding Name :</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{p.proceeding_name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, color: '#64748b' }}>Assessment Year :</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{p.assessment_year}</span>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 2fr 1.5fr' }}>
                    {/* Col 1: PAN & Assessee */}
                    <div style={{ padding: '16px 20px', borderRight: '0.5px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>PAN</p>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{p.pan}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>Name of Assessee</p>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', lineHeight: 1.3 }}>{p.assessee_name}</p>
                      </div>
                    </div>

                    {/* Col 2: Timeline */}
                    <div style={{ padding: '16px 20px', borderRight: '0.5px solid #e2e8f0' }}>
                      <div style={{ position: 'relative', paddingLeft: 22, height: '100%', minHeight: 90 }}>
                        {/* Vertical line connecting dots */}
                        {p.timeline && p.timeline.length > 1 && (
                          <div style={{ 
                            position: 'absolute', 
                            left: 6, 
                            top: 8, 
                            bottom: 8, 
                            width: '1.5px', 
                            backgroundColor: '#cbd5e1', 
                            zIndex: 0 
                          }} />
                        )}
                        {p.timeline.map((t, ti) => (
                          <div key={ti} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: ti === p.timeline.length - 1 ? 0 : 16, position: 'relative', zIndex: 1 }}>
                            <div style={{ marginLeft: -22 }}>
                              <TlDot type={t.type || 'done'} />
                            </div>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 600, color: '#334155', lineHeight: '1.2' }}>{t.date}</p>
                              <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{t.label}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Col 3: Details List */}
                    <div style={{ padding: '16px 20px', borderRight: '0.5px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
                      <p style={{ fontSize: 12, color: '#64748b' }}>
                        Proceeding Limitation Date : <span style={{ fontWeight: 600, color: '#334155' }}>{p.limitation_date}</span>
                      </p>
                      <p style={{ fontSize: 12, color: '#64748b' }}>
                        Proceeding Closure Date : <span style={{ fontWeight: 600, color: '#334155' }}>{p.closure_date}</span>
                      </p>
                      <p style={{ fontSize: 12, color: '#64748b' }}>
                        Financial Year : <span style={{ fontWeight: 600, color: '#334155' }}>{p.financial_year}</span>
                      </p>
                      <p style={{ fontSize: 12, color: '#64748b' }}>
                        Proceeding Closure Order : <span style={{ fontWeight: 600, color: '#1d4ed8', fontFamily: 'monospace' }}>{p.closure_order}</span>
                      </p>
                      <p style={{ fontSize: 12, color: '#64748b' }}>
                        Applicable Act : <span style={{ fontWeight: 600, color: '#334155' }}>{p.applicable_act}</span>
                      </p>
                    </div>

                    {/* Col 4: Action Buttons */}
                    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                      <button 
                        onClick={() => navigate(`/staff/notice-orders/${p.id}`)}
                        style={{ 
                          padding: '9px 16px', 
                          background: '#1e3a8a', 
                          color: '#fff', 
                          border: 'none', 
                          borderRadius: 6, 
                          fontSize: 11, 
                          fontWeight: 600, 
                          cursor: 'pointer',
                          width: '100%',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#172554' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1e3a8a' }}
                      >
                        View Notices/Orders ({p.notices_count})
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={p.id} style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ background: '#f8fafc', borderBottom: '0.5px solid #e2e8f0', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr' }}>
                  {/* Col 1 - Timeline */}
                  <div style={{ padding: '16px 20px', borderRight: '0.5px solid #e2e8f0' }}>
                    <p style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 14 }}>Activity Timeline</p>
                    
                    <div style={{ position: 'relative', paddingLeft: 22 }}>
                      {/* Vertical line connecting dots */}
                      {p.timeline && p.timeline.length > 1 && (
                        <div style={{ 
                          position: 'absolute', 
                          left: 6, 
                          top: 8, 
                          bottom: 8, 
                          width: '1.5px', 
                          backgroundColor: '#cbd5e1', 
                          zIndex: 0 
                        }} />
                      )}
                      {(p.timeline || [{ date: '—', label: 'Open', type: 'open' }]).map((t, ti) => (
                        <div key={ti} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: ti === p.timeline.length - 1 ? 0 : 16, position: 'relative', zIndex: 1 }}>
                          <div style={{ marginLeft: -22 }}>
                            <TlDot type={t.type || 'open'} />
                          </div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 500, color: '#334155', lineHeight: '1.2' }}>{t.date}</p>
                            <p style={{ fontSize: 12, color: t.type === 'done' ? '#16a34a' : t.type === 'open' ? '#2563eb' : '#ea580c', fontWeight: 500, marginTop: 2 }}>{t.label}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Col 2 - Details */}
                  <div style={{ padding: '16px 20px', borderRight: '0.5px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {p.limitation_date && p.limitation_date !== '-' && (
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>Proceeding Limitation Date</p>
                        <p style={{ fontSize: 13, fontWeight: 500, color: '#334155' }}>{p.limitation_date}</p>
                      </div>
                    )}
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>Financial Year</p>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#334155' }}>{p.financial_year}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>Applicable Act</p>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#334155' }}>{p.applicable_act || 'Income Tax Act 1961'}</p>
                    </div>
                  </div>

                  {/* Col 3 - Action */}
                  <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <button
                      onClick={() => navigate(`/staff/notice-orders/${p.id}`)}
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: 4, 
                        padding: '12px 20px', 
                        background: '#1e3a8a', 
                        color: '#fff', 
                        border: 'none', 
                        borderRadius: 8, 
                        fontSize: 12, 
                        fontWeight: 600, 
                        cursor: 'pointer',
                        width: '100%',
                        maxWidth: 180,
                        textAlign: 'center',
                        lineHeight: '1.4'
                      }}
                    >
                      <span>View Notices/Orders</span>
                      <span>({p.notices_count || 0})</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}

        <p style={{ fontSize: 12, color: '#64748b', textAlign: 'center', padding: '4px 0' }}>
          Showing {proceedings.length} proceedings
        </p>
      </div>
    </DashboardLayout>
  )
}
