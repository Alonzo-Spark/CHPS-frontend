import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, X, Calendar } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { dashboardService } from '../../services'

export default function StaffDashboard() {
  const [summary, setSummary] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sumRes, assignRes] = await Promise.all([
          dashboardService.getSummary(),
          dashboardService.getAssignments(),
        ])
        setSummary(sumRes.data)
        setAssignments(assignRes.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filtered = assignments.filter(a => {
    const term = search.trim().toLowerCase()
    if (!term) return true

    const professionalName = a.professional_name?.toLowerCase() ?? ''
    const referenceId = (a.reference_id || `REF-${a.notice_id}`).toLowerCase()
    const noticeId = String(a.notice_id)

    return professionalName.includes(term) || referenceId.includes(term) || noticeId.includes(term)
  })

  const handleSearch = () => {
    setSearch(query)
  }

  const handleCancel = () => {
    setQuery('')
    setSearch('')
  }

  const getInitials = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const avatarColors = ['#7c3aed', '#059669', '#16a34a', '#ea580c', '#1d4ed8', '#dc2626']
  const colorFor = (i) => avatarColors[i % avatarColors.length]

  const formatDate = (str) => {
    if (!str) return '-'
    const d = new Date(str)
    return d.toLocaleDateString('en-GB')
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Dashboard' }]}>
      <div style={{ padding: '20px 22px' }}>
        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total Users', value: summary?.total_users ?? '—', color: '#2563eb', sub: '↑ +12%', subColor: '#16a34a' },
            { label: 'Pending Tasks', value: summary?.pending_notices ?? '—', color: '#dc2626', sub: 'Due today', subColor: '#64748b' },
            { label: 'Users', value: summary?.active_users ?? '—', color: '#1e293b', sub: 'Active', subColor: '#64748b' },
          ].map(({ label, value, color, sub, subColor }) => (
            <div key={label} style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 10, padding: '18px 20px' }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.07em' }}>{label}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
                <p style={{ fontSize: 28, fontWeight: 700, color }}>{loading ? '...' : value}</p>
                <span style={{ fontSize: 11, color: subColor, fontWeight: 600 }}>{sub}</span>
              </div>
              <div style={{ height: 3, background: color, borderRadius: 2, width: 44, marginTop: 12 }}></div>
            </div>
          ))}
        </div>

        {/* Assignments table */}
        <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 12, overflow: 'visible' }}>
          <div style={{ padding: '14px 18px', borderBottom: '0.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>My Assignments</p>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Managing notification workflow and compliance deadlines</p>
            </div>
            <div style={{ flex: '1 1 auto', minWidth: 0, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <div style={{ flex: '1 1 260px', minWidth: 0, display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px', background: '#fff', boxSizing: 'border-box' }}>
                <Search size={16} color="#64748b" />
                <input
                  type="text"
                  placeholder="Search user..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    border: 'none',
                    outline: 'none',
                    fontSize: 13,
                    color: '#1e293b',
                    background: 'transparent'
                  }}
                />
              </div>
              <button
                onClick={handleSearch}
                style={{
                  padding: '10px 18px',
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 13,
                  cursor: 'pointer',
                  minWidth: 90
                }}
              >
                Search
              </button>
              <button
                onClick={handleCancel}
                style={{
                  padding: '10px 18px',
                  background: '#f3f4f6',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: 10,
                  fontSize: 13,
                  cursor: 'pointer',
                  minWidth: 90
                }}
              >
                Cancel
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '18%' }} /><col style={{ width: '17%' }} /><col style={{ width: '12%' }} />
                <col style={{ width: '18%' }} /><col style={{ width: '12%' }} /><col style={{ width: '12%' }} /><col style={{ width: '11%' }} />
              </colgroup>
              <thead>
                <tr>
                  {['User', 'Proceeding Name', 'Reference ID', 'Issued On', 'Due Date', 'Notice'].map(h => (
                    <th key={h} style={{ background: '#f8fafc', color: '#64748b', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', padding: '9px 10px', borderBottom: '0.5px solid #e2e8f0', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 13 }}>Loading assignments...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 13 }}>No assignments found.</td></tr>
                ) : (
                  filtered.map((a, i) => (
                    <tr key={a.notice_id} style={{ borderBottom: '0.5px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 10px', color: '#1e293b', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: colorFor(i), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                            {getInitials(a.professional_name)}
                          </div>
                          <span style={{ fontWeight: 500 }}>{a.professional_name}</span>
                        </div>
                      </td>
                      <td
                        style={{ padding: '10px 10px', fontWeight: 600, color: '#1e293b', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        onClick={() => navigate(`/staff/proceeding/${a.notice_id}`)}
                        title="Click to view proceeding"
                      >
                        {a.proceeding_name || 'Assessment Proceeding'}
                      </td>
                      <td style={{ padding: '10px 10px', fontFamily: 'monospace', fontSize: 10, color: '#1d4ed8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.reference_id || `REF-${a.notice_id}`}</td>
                      <td style={{ padding: '10px 10px', color: '#64748b' }}>{formatDate(a.assigned_at)}</td>
                      <td style={{ padding: '10px 10px', color: '#dc2626', fontWeight: 500 }}>{a.due_date ? formatDate(a.due_date) : '-'}</td>
                      <td style={{ padding: '10px 10px' }}>
                        <button
                          onClick={() => navigate(`/staff/notice-orders/${a.notice_id}`)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 9px', background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: 7, fontSize: 10, fontWeight: 500, cursor: 'pointer' }}
                        >
                          VIEW NOTICE
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '11px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '0.5px solid #f1f5f9' }}>
            <p style={{ fontSize: 12, color: '#64748b' }}>Showing {filtered.length} of {summary?.total_notices ?? filtered.length} assignments</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {['‹', '›'].map(ch => (
                <button key={ch} style={{ width: 28, height: 28, border: '0.5px solid #e2e8f0', borderRadius: 6, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{ch}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
