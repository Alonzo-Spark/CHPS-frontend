import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { dashboardService } from '../../services'


export default function ProfessionalDashboard() {
  const [summary, setSummary] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ month: '', year: '', assessment: '' })
  const [appliedFilters, setAppliedFilters] = useState({ month: '', year: '', assessment: '' })
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [loading, setLoading] = useState(true)
  const [recentNotices, setRecentNotices] = useState([])
  const [recentMeta, setRecentMeta] = useState({})
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
          console.log("API DATA: Recent Notices", raw);
          const meta = recentRes.data?.meta || recentRes.meta || {}
          const mapped = (Array.isArray(raw) ? raw : []).map(n => ({
            ...n,
            notice_id: n.notice_id ?? n.id,
            user: n.user || n.user_name || n.professional_name || "N/A",
            user_name: n.user || n.user_name || n.professional_name || "N/A",
            proceeding_name: n.proceeding_name || n.notice_type || "N/A",
            reference_id: n.reference_id || `REF-${n.notice_id ?? n.id}`,
            issued_on: n.issued_on || n.assigned_at || n.createdAt || "-",
            due_date: n.due_date || "-",
            status: n.status || "N/A"
          }))
          setRecentNotices(mapped)
          setRecentMeta(meta)
        } catch (err) {
          console.warn('Recent notices fetch failed', err)
        }

        // 3) Assignments (fallback to recent notices or defaultMockData when missing)
        try {
          const assignRes = await dashboardService.getAssignments()
          console.log("API DATA: Assignments", assignRes?.data);
          const hasAssign = assignRes?.data && Array.isArray(assignRes.data) && assignRes.data.length
          
          let rawList = []
          if (hasAssign) {
            rawList = assignRes.data
          } else {
            const recentRaw = recentRes?.data?.items || recentRes?.data?.data || recentRes?.data || []
            if (recentRaw && recentRaw.length > 0) {
              rawList = recentRaw
            } else {
              rawList = []
            }
          }

          const mapped = rawList.map(n => ({
            ...n,
            notice_id: n.notice_id ?? n.id,
            user: n.user || n.user_name || n.professional_name || "N/A",
            user_name: n.user || n.user_name || n.professional_name || "N/A",
            proceeding_name: n.proceeding_name || n.notice_type || "N/A",
            reference_id: n.reference_id || `REF-${n.notice_id ?? n.id}`,
            issued_on: n.issued_on || n.assigned_at || n.createdAt || "-",
            due_date: n.due_date || "-",
            status: n.status || "N/A"
          }))
          setAssignments(mapped)
        } catch (err) {
          console.warn('Assignments fetch failed, falling back to mock data', err)
          const recentRaw = recentRes?.data?.items || recentRes?.data?.data || recentRes?.data || []
          const rawList = (recentRaw && recentRaw.length > 0) ? recentRaw : []
          const mappedAssignments = rawList.map(n => ({
            ...n,
            notice_id: n.notice_id ?? n.id,
            user: n.user || n.user_name || "N/A",
            user_name: n.user || n.user_name || "N/A",
            proceeding_name: n.proceeding_name || n.notice_type || "N/A",
            reference_id: n.reference_id || `REF-${n.notice_id ?? n.id}`,
            issued_on: n.issued_on || n.assigned_at || n.createdAt || "-",
            due_date: n.due_date || "-",
            status: n.status || "N/A"
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
      const userName = (a?.user || a?.user_name || '').toLowerCase()
      const referenceId = (a?.reference_id || `REF-${a?.notice_id}`).toLowerCase()
      const noticeId = String(a?.notice_id ?? '')
      return userName.includes(term) || referenceId.includes(term) || noticeId.includes(term)
    })()

    // Filter by Month, Year, Assessment
    const assignedDate = (a?.issued_on && a?.issued_on !== '-') ? new Date(a.issued_on) : null
    const matchesMonth = !appliedFilters.month || (assignedDate && assignedDate.getMonth() + 1 === parseInt(appliedFilters.month))
    const matchesYear = !appliedFilters.year || (assignedDate && assignedDate.getFullYear() === parseInt(appliedFilters.year))
    
    const status = (a?.status || 'pending').toLowerCase()
    const matchesAssessment = !appliedFilters.assessment || status === appliedFilters.assessment.toLowerCase()

    return matchesSearch && matchesMonth && matchesYear && matchesAssessment
  })

  const handleClearFilters = () => {
    setFilters({ month: '', year: '', assessment: '' })
    setAppliedFilters({ month: '', year: '', assessment: '' })
  }

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters })
    setShowFilterPanel(false)
  }

  const formatDate = (str) => {
    if (!str || str === '-') return '-'
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
                <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>Month:</label>
                <select
                  value={filters.month}
                  onChange={e => setFilters({ ...filters, month: e.target.value })}
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
                >
                  <option value="">All Months</option>
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>Year:</label>
                <select
                  value={filters.year}
                  onChange={e => setFilters({ ...filters, year: e.target.value })}
                  style={{
                    padding: '8px 10px',
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    fontSize: 12,
                    color: '#1e293b',
                    background: '#fff',
                    minWidth: 100,
                    cursor: 'pointer'
                  }}
                >
                  <option value="">All Years</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>Assessment:</label>
                <select
                  value={filters.assessment}
                  onChange={e => setFilters({ ...filters, assessment: e.target.value })}
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
                >
                  <option value="">All Assessments</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="in_progress">In Progress</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={handleClearFilters}
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
                <button
                  onClick={handleApplyFilters}
                  style={{
                    padding: '6px 12px',
                    background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '16.66%' }} /><col style={{ width: '16.66%' }} /><col style={{ width: '16.66%' }} />
                <col style={{ width: '16.66%' }} /><col style={{ width: '16.66%' }} /><col style={{ width: '16.66%' }} />
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
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 48, color: '#94a3b8', fontSize: 13 }}>
                      No data available
                    </td>
                  </tr>
                ) : (
                  filtered.map((a, i) => (
                    <tr key={a.notice_id || i} style={{ borderBottom: '0.5px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 10px', color: '#1e293b', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ fontWeight: 500 }}>{a?.user || a?.user_name || "N/A"}</span>
                        </div>
                      </td>
                      <td
                        style={{ padding: '10px 10px', fontWeight: 600, color: '#1e293b', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        onClick={() => navigate(`/staff/notice-orders/${a.notice_id}`)}
                        title="Click to view proceeding"
                      >
                        {a?.proceeding_name || "N/A"}
                      </td>
                      <td style={{ padding: '10px 10px', fontFamily: 'monospace', fontSize: 10, color: '#1d4ed8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a?.reference_id || "N/A"}
                      </td>
                      <td style={{ padding: '10px 10px', color: '#64748b' }}>
                        {a?.issued_on && a.issued_on !== '-' ? formatDate(a.issued_on) : "-"}
                      </td>
                      <td style={{ padding: '10px 10px', color: '#dc2626', fontWeight: 500 }}>
                        {a?.due_date && a.due_date !== '-' ? formatDate(a.due_date) : "-"}
                      </td>
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
