import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, X, Calendar } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { dashboardService } from '../../services'

export default function StaffDashboard() {
  const [summary, setSummary] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [loading, setLoading] = useState(true)
  const [recentNotices, setRecentNotices] = useState([])
  const [recentMeta, setRecentMeta] = useState({})
  const [recentLoading, setRecentLoading] = useState(false)
  const [recentError, setRecentError] = useState(null)
  const [recentOffset, setRecentOffset] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1) Summary
        try {
          const sumRes = await dashboardService.getSummary()
          setSummary(sumRes.data)
        } catch (err) {
          console.warn('Summary fetch failed', err)
        }

        // 2) Recent notices
        let recentRes = null
        try {
          recentRes = await dashboardService.getRecentNotices({ limit: 10, offset: 0 })
          const raw = recentRes.data?.items || recentRes.data?.data || recentRes.data || []
          const meta = recentRes.data?.meta || recentRes.meta || {}
          const mapped = (Array.isArray(raw) ? raw : []).map(mapNotice)
          setRecentNotices(mapped)
          setRecentMeta(meta)
        } catch (err) {
          console.warn('Recent notices fetch failed', err)
        }

        // 3) Assignments (fallback to recent notices when missing)
        try {
          const assignRes = await dashboardService.getAssignments()
          const hasAssign = assignRes?.data && Array.isArray(assignRes.data) && assignRes.data.length
          if (hasAssign) {
            setAssignments(assignRes.data)
          } else {
            const rawNotices = recentRes?.data?.items || recentRes?.data?.data || recentRes?.data || []
            const mappedAssignments = (Array.isArray(rawNotices) ? rawNotices : []).map(n => ({
              notice_id: n.notice_id ?? n.id,
              professional_name: n.user_name || n.assigned_to || '',
              proceeding_name: n.proceeding_name || n.notice_type || '',
              reference_id: n.reference_id || '',
              assigned_at: n.issued_on || n.assigned_at || n.createdAt || null,
              due_date: n.due_date || null,
            }))
            setAssignments(mappedAssignments)
          }
        } catch (err) {
          console.warn('Assignments fetch failed, falling back to recent notices', err)
          const rawNotices = recentRes?.data?.items || recentRes?.data?.data || recentRes?.data || []
          const mappedAssignments = (Array.isArray(rawNotices) ? rawNotices : []).map(n => ({
            notice_id: n.notice_id ?? n.id,
            professional_name: n.user_name || n.assigned_to || '',
            proceeding_name: n.proceeding_name || n.notice_type || '',
            reference_id: n.reference_id || '',
            assigned_at: n.issued_on || n.assigned_at || n.createdAt || null,
            due_date: n.due_date || null,
          }))
          setAssignments(mappedAssignments)
        }

      } catch (err) {
        console.error('Unexpected fetch error', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filtered = assignments.filter(a => {
    const term = search.trim().toLowerCase()

    // Search filter
    const matchesSearch = !term || (() => {
      const professionalName = a.professional_name?.toLowerCase() ?? ''
      const referenceId = (a.reference_id || `REF-${a.notice_id}`).toLowerCase()
      const noticeId = String(a.notice_id)
      return professionalName.includes(term) || referenceId.includes(term) || noticeId.includes(term)
    })()

    // Date filter
    const assignedDate = a.assigned_at ? new Date(a.assigned_at) : null
    const fromDate = dateFrom ? new Date(dateFrom) : null
    const toDate = dateTo ? new Date(dateTo) : null

    const matchesDateRange = (() => {
      if (!assignedDate) return !dateFrom && !dateTo
      if (fromDate && assignedDate < fromDate) return false
      if (toDate) {
        const tomorrowDate = new Date(toDate)
        tomorrowDate.setDate(tomorrowDate.getDate() + 1)
        if (assignedDate >= tomorrowDate) return false
      }
      return true
    })()

    return matchesSearch && matchesDateRange
  })

  const getInitials = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const avatarColors = ['#7c3aed', '#059669', '#16a34a', '#ea580c', '#1d4ed8', '#dc2626']
  const colorFor = (i) => avatarColors[i % avatarColors.length]

  const formatDate = (str) => {
    if (!str) return '-'
    const d = new Date(str)
    return d.toLocaleDateString('en-GB')
  }

  const mapNotice = (item) => ({
    id: item.id ?? item.notice_id,
    title: item.proceeding_name || item.notice_type || `Notice ${item.notice_id ?? item.id}`,
    summary: item.reference_id ? `${item.reference_id} • ${item.user_name || ''}`.trim() : (item.status || ''),
    body: item.body ?? null,
    type: item.notice_type ?? 'notification',
    severity: item.severity ?? 'info',
    relatedUrl: item.view_notice?.proceeding_id ? `/staff/proceeding/${item.view_notice.proceeding_id}` : `/staff/notice-orders/${item.notice_id ?? item.id}`,
    isRead: !!item.is_read || !!item.isRead || false,
    createdAt: item.issued_on || item.createdAt || item.created_at || null,
  })

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Dashboard' }]}>
      <div style={{ padding: '20px 22px' }}>
        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
          {[
              { label: 'Total Assigned', value: summary?.total_assigned ?? summary?.total_notices ?? '—', color: '#2563eb', sub: 'Assigned', subColor: '#16a34a' },
              { label: 'Pending Tasks', value: summary?.pending_tasks ?? summary?.pending_notices ?? '—', color: '#dc2626', sub: 'Due today', subColor: '#64748b' },
              { label: 'Recently Updated', value: summary?.recently_updated ?? '—', color: '#1e293b', sub: 'Updated', subColor: '#64748b' },
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
          <div style={{ padding: '14px 18px', borderBottom: '0.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>My Assignments</p>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Managing notification workflow and compliance deadlines</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 auto', minWidth: 280 }}>
              {/* Search Bar */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px', background: '#fff', boxSizing: 'border-box', minWidth: 280 }}>
                <Search size={16} color="#64748b" />
                <input
                  type="text"
                  placeholder="Search user, reference ID..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
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

              {/* Filter Icon Button */}
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  border: '1px solid #cbd5e1',
                  borderRadius: 10,
                  background: showFilterPanel ? '#e0e7ff' : '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                title="Filter by issued date"
              >
                <Filter size={18} color={showFilterPanel ? '#2563eb' : '#64748b'} />
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilterPanel && (
            <div style={{ padding: '12px 18px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>Issued Date From:</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  style={{
                    padding: '8px 10px',
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    fontSize: 12,
                    color: '#1e293b',
                    background: '#fff',
                    minWidth: 140,
                    cursor: 'pointer'
                  }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>To:</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  style={{
                    padding: '8px 10px',
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    fontSize: 12,
                    color: '#1e293b',
                    background: '#fff',
                    minWidth: 140,
                    cursor: 'pointer'
                  }}
                />
              </div>
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => {
                    setDateFrom('')
                    setDateTo('')
                  }}
                  style={{
                    padding: '6px 12px',
                    background: '#f3f4f6',
                    color: '#64748b',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

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

        {/* Recent Notices */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>Recent Notices</p>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Latest system and assignment notifications</p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={async () => {
                  try {
                    setRecentLoading(true)
                    await dashboardService.markAllNoticesRead()
                    setRecentNotices(prev => prev.map(it => ({ ...it, isRead: true })))
                    setRecentMeta(m => ({ ...m, unreadCount: 0 }))
                  } catch (err) {
                    console.error(err)
                    setRecentError('Failed to mark all read')
                  } finally { setRecentLoading(false) }
                }}
                style={{ padding: '8px 12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}
              >
                Mark all read
              </button>
            </div>
          </div>

          <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
            {recentLoading && recentNotices.length === 0 ? (
              <p style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>Loading notices...</p>
            ) : recentNotices.length === 0 ? (
              <p style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>No notices found.</p>
            ) : (
              <ul role="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {recentNotices.map((n) => (
                  <li key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={async () => {
                    try {
                      // optimistic
                      setRecentNotices(prev => prev.map(it => it.id === n.id ? { ...it, isRead: true } : it))
                      setRecentMeta(m => ({ ...m, unreadCount: Math.max(0, (m.unreadCount || 0) - (n.isRead ? 0 : 1)) }))
                      // mark read on backend
                      await dashboardService.markNoticeRead(n.id)
                      if (n.relatedUrl) navigate(n.relatedUrl)
                    } catch (err) {
                      console.error(err)
                      setRecentError('Failed to open notice')
                    }
                  }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: n.isRead ? '#e6e7eb' : '#2563eb', marginTop: 6 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{n.title}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{(function timeAgo(ts) {
                          if (!ts) return '-'
                          const d = new Date(ts)
                          const diff = Math.floor((Date.now() - d.getTime()) / 1000)
                          if (diff < 60) return `${diff}s`
                          if (diff < 3600) return `${Math.floor(diff/60)}m`
                          if (diff < 86400) return `${Math.floor(diff/3600)}h`
                          return `${Math.floor(diff/86400)}d`
                        })(n.createdAt)}</div>
                      </div>
                      <div style={{ color: '#64748b', fontSize: 13, marginTop: 6 }}>{n.summary}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {recentMeta?.hasMore ? (
              <div style={{ padding: 12, textAlign: 'center' }}>
                <button onClick={async () => {
                  try {
                    setRecentLoading(true)
                    const nextOffset = recentOffset + (recentMeta.limit || 20)
                    const res = await dashboardService.getRecentNotices({ limit: recentMeta.limit || 20, offset: nextOffset })
                    const raw = res.data?.items || res.data?.data || res.data || []
                    const meta = res.data?.meta || res.meta || {}
                    const mapped = (Array.isArray(raw) ? raw : []).map(mapNotice)
                    setRecentNotices(prev => [...prev, ...mapped])
                    setRecentMeta(meta)
                    setRecentOffset(nextOffset)
                  } catch (err) {
                    console.error(err)
                    setRecentError('Failed to load more')
                  } finally { setRecentLoading(false) }
                }} style={{ padding: '8px 12px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, cursor: 'pointer' }}>{recentLoading ? 'Loading...' : 'Load more'}</button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
