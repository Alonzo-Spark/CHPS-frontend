import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { dashboardService, professionalDashboardService, noticeService } from '../../services'

export default function ProfessionalDashboard() {
  const [summary, setSummary] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    month: '',
    year: '',
    assessment: ''
  })

  const [appliedFilters, setAppliedFilters] = useState({
    month: '',
    year: '',
    assessment: ''
  })

  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [loading, setLoading] = useState(true)
  const [allNotices, setAllNotices] = useState([])
  const [allNoticesLoaded, setAllNoticesLoaded] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const navigate = useNavigate()

  useEffect(() => {
    fetchDashboard()
    fetchAllNotices()
  }, [])

  const fetchDashboard = async () => {
    try {

      // SUMMARY
      try {
        const sumRes = await dashboardService.getSummary()
        setSummary(sumRes.data)
      } catch (err) {
        console.warn('Summary fetch failed', err)
      }

      // RECENT NOTICES
      try {
        const recentRes =
          await professionalDashboardService.getRecentNotices({
            limit: 10,
            offset: 0
          })

        console.log('FULL API RESPONSE:', recentRes.data)

        const raw = Array.isArray(recentRes.data)
  ? recentRes.data
  : recentRes.data?.notice_orders ||
    recentRes.data?.recent_notices ||
    recentRes.data?.items ||
    recentRes.data?.data ||
    []

        console.log('RAW ARRAY:', raw)

       const mapped = (Array.isArray(raw) ? raw : []).map(n => ({
  notice_id: n.notice_id ?? n.id,

  user:
    n.user_name ||
    n.client_name ||
    n.user ||
    'N/A',

  user_name:
    n.user_name ||
    n.client_name ||
    n.user ||
    'N/A',

  proceeding_name:
    n.proceeding_name ||
    n.notice_type ||
    'N/A',

  reference_id:
    n.reference_id ||
    `REF-${n.notice_id ?? n.id}`,

  issued_on:
    n.issued_on ||
    '-',

  due_date:
    n.response_due_date ||
    n.due_date ||
    '-',

  status:
    n.workflow_status ||
    n.status ||
    'N/A',
  is_read: n.is_read ?? n.isRead ?? false
}))

        setAssignments(mapped)

      } catch (err) {
        console.error('Recent notices API failed:', err)
      }

    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllNotices = async () => {
    try {
      const res = await noticeService.getNotices()
      const raw = res?.data?.items || res?.data || []
      const mapped = (Array.isArray(raw) ? raw : []).map(n => ({
        notice_id: n.notice_id ?? n.id,
        user: n.user_name || n.client_name || n.user || 'N/A',
        user_name: n.user_name || n.client_name || n.user || 'N/A',
        proceeding_name: n.proceeding_name || n.notice_type || 'N/A',
        reference_id: n.reference_id || `REF-${n.notice_id ?? n.id}`,
        issued_on: n.issued_on || '-',
        due_date: n.response_due_date || n.due_date || '-',
        status: n.workflow_status || n.status || 'N/A',
        is_read: n.is_read ?? n.isRead ?? false
      }))
      setAllNotices(mapped)
      setAllNoticesLoaded(true)
    } catch (err) {
      setAllNoticesLoaded(true)
    }
  }



  const handleViewNotice = async (notice) => {
    console.log('Clicked Notice:', notice)
    const noticeId = notice.notice_id ?? notice.id

    try {
      if (noticeId) {
        await dashboardService.markNoticeRead(noticeId)
      }
    } catch (err) {
      console.warn("Failed to mark notice as read on backend", err)
    }

    if (noticeId) {
      setAssignments(prev => prev.map(item => (item.notice_id === noticeId || item.id === noticeId) ? { ...item, is_read: true } : item))
      setAllNotices(prev => prev.map(item => (item.notice_id === noticeId || item.id === noticeId) ? { ...item, is_read: true } : item))
    }

    if (noticeId) {
      navigate(`/staff/notice-orders/${noticeId}`)
    }
  }

  const formatDate = (date) => {
    if (!date || date === '-') return '-'

    try {
      return new Date(date).toLocaleDateString('en-GB')
    } catch {
      return '-'
    }
  }

  // FILTERING
  const noFiltersApplied = !appliedFilters.month && !appliedFilters.year && !appliedFilters.assessment
  const sourceData = (noFiltersApplied && allNoticesLoaded && allNotices.length > 0) ? allNotices : assignments

  // Keep unread count in sync with what's visible
  useEffect(() => {
    const count = sourceData.filter(n => !n.is_read).length
    setUnreadCount(count)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignments, allNotices, appliedFilters])

  const filtered = sourceData.filter((a) => 
    {

    const term = search.trim().toLowerCase()

    const matchesSearch =
      !term ||
      (a.user || '').toLowerCase().includes(term) ||
      (a.reference_id || '').toLowerCase().includes(term) ||
      String(a.notice_id || '').includes(term)

    const issuedDate =
      a.issued_on && a.issued_on !== '-'
        ? new Date(a.issued_on)
        : null

    const matchesMonth =
      !appliedFilters.month ||
      (
        issuedDate &&
        issuedDate.getMonth() + 1 === Number(appliedFilters.month)
      )

    const matchesYear =
      !appliedFilters.year ||
      (
        issuedDate &&
        issuedDate.getFullYear() === Number(appliedFilters.year)
      )

    const status = (a.status || '').toLowerCase()

    const matchesAssessment =
      !appliedFilters.assessment ||
      status === appliedFilters.assessment.toLowerCase()

    return (
      matchesSearch &&
      matchesMonth &&
      matchesYear &&
      matchesAssessment
    )
  })

  const handleApplyFilters = () => {
    setAppliedFilters(filters)
    setShowFilterPanel(false)
  }

  const handleClearFilters = () => {
    const reset = {
      month: '',
      year: '',
      assessment: ''
    }

    setFilters(reset)
    setAppliedFilters(reset)
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Dashboard' }]}>

      <div style={{ padding: '20px 22px' }}>

        {/* Recent Notices Summary Card */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 10, padding: '18px 20px', minWidth: 240, display: 'inline-block' }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.07em', margin: 0 }}>Recent Notices</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#2563eb', margin: 0 }}>{loading ? '...' : unreadCount}</p>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Unread</span>
            </div>
            <div style={{ height: 3, background: '#2563eb', borderRadius: 2, width: 44, marginTop: 12 }}></div>
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            overflow: 'hidden'
          }}
        >

          {/* HEADER */}
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12
            }}
          >

            <div>
              <p
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#1e293b'
                }}
              >
                My Assignments
              </p>

              <p
                style={{
                  fontSize: 12,
                  color: '#94a3b8',
                  marginTop: 4
                }}
              >
                Managing notification workflow and compliance deadlines
              </p>
            </div>

            {/* SEARCH + FILTER */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flex: 1,
                maxWidth: 500
              }}
            >

              {/* SEARCH */}
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  border: '1px solid #cbd5e1',
                  borderRadius: 10,
                  padding: '10px 12px'
                }}
              >
                <Search size={16} color="#64748b" />

                <input
                  type="text"
                  placeholder="Search user, reference ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent'
                  }}
                />
              </div>

              {/* FILTER BUTTON */}
              <button
                onClick={() =>
                  setShowFilterPanel(!showFilterPanel)
                }
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  cursor: 'pointer'
                }}
              >
                <Filter size={18} />
              </button>

            </div>
          </div>

          {/* FILTER PANEL */}
          {showFilterPanel && (
            <div
              style={{
                padding: 16,
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap'
              }}
            >

              {/* MONTH */}
              <select
                value={filters.month}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    month: e.target.value
                  })
                }
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#1e293b',
                  background: '#fff',
                  cursor: 'pointer',
                  minWidth: 140,
                  outline: 'none'
                }}
              >
                <option value="">All Months</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
              </select>

              {/* YEAR */}
              <select
                value={filters.year}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    year: e.target.value
                  })
                }
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#1e293b',
                  background: '#fff',
                  cursor: 'pointer',
                  minWidth: 100,
                  outline: 'none'
                }}
              >
                <option value="">All Years</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>

              {/* STATUS */}
              <select
                value={filters.assessment}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    assessment: e.target.value
                  })
                }
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#1e293b',
                  background: '#fff',
                  cursor: 'pointer',
                  minWidth: 140,
                  outline: 'none'
                }}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="in progress">In Progress</option>
              </select>

              <button 
                onClick={handleApplyFilters}
                style={{
                  padding: '8px 16px',
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  boxShadow: '0 2px 4px rgba(37, 99, 235, 0.15)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1d4ed8' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2563eb' }}
              >
                Apply
              </button>

              <button 
                onClick={handleClearFilters}
                style={{
                  padding: '8px 16px',
                  background: '#eff6ff',
                  color: '#2563eb',
                  border: '1px solid #bfdbfe',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dbeafe' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff' }}
              >
                Clear
              </button>

            </div>
          )}

          {/* TABLE */}
          <div style={{ overflowX: 'auto' }}>

            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}
            >

              <thead>

                <tr
                  style={{
                    background: '#f8fafc'
                  }}
                >

                  {[
                    'User',
                    'Proceeding Name',
                    'Reference ID',
                    'Issued On',
                    'Due Date',
                    'Notice'
                  ].map((head) => (

                    <th
                      key={head}
                      style={{
                        padding: 12,
                        textAlign: 'left',
                        fontSize: 12,
                        color: '#64748b'
                      }}
                    >
                      {head}
                    </th>

                  ))}

                </tr>

              </thead>

              <tbody>

                {loading ? (

                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: 'center',
                        padding: 40
                      }}
                    >
                      Loading...
                    </td>
                  </tr>

                ) : filtered.length === 0 ? (

                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: 'center',
                        padding: 40,
                        color: '#94a3b8'
                      }}
                    >
                      No data available
                    </td>
                  </tr>

                ) : (

                  filtered.map((a, index) => (

                    <tr
                      key={a.notice_id || index}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: !a.is_read ? '#e0f2fe' : 'transparent',
                        transition: 'all 0.3s ease'
                      }}
                    >

                      {/* USER */}
                      <td 
                        style={{ 
                          padding: 12,
                          borderLeft: !a.is_read ? '4px solid #2563eb' : '4px solid transparent',
                          transition: 'border-left-color 0.3s ease',
                          fontWeight: !a.is_read ? '700' : 'normal'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {!a.is_read && (
                            <span 
                              style={{
                                display: 'inline-block',
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: '#2563eb',
                                boxShadow: '0 0 8px #3b82f6',
                                flexShrink: 0
                              }} 
                              title="New/Unread"
                            />
                          )}
                          <span>{a.user}</span>
                        </div>
                      </td>

                      {/* PROCEEDING */}
                      <td
                        style={{
                          padding: 12,
                          fontWeight: !a.is_read ? '700' : '600',
                          color: !a.is_read ? '#1e293b' : '#334155',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleViewNotice(a)}
                      >
                        {a.proceeding_name}
                      </td>

                      {/* REFERENCE */}
                      <td
                        style={{
                          padding: 12,
                          color: '#2563eb',
                          fontWeight: !a.is_read ? '600' : 'normal'
                        }}
                      >
                        {a.reference_id}
                      </td>

                      {/* ISSUED */}
                      <td style={{ padding: 12, fontWeight: !a.is_read ? '600' : 'normal' }}>
                        {formatDate(a.issued_on)}
                      </td>

                      {/* DUE */}
                      <td
                        style={{
                          padding: 12,
                          color: '#dc2626',
                          fontWeight: !a.is_read ? '700' : 'normal'
                        }}
                      >
                        {formatDate(a.due_date)}
                      </td>

                      {/* BUTTON */}
                      <td style={{ padding: 12 }}>

                        <button
                          onClick={() => handleViewNotice(a)}
                          style={{
                            padding: '8px 12px',
                            background: '#1e3a8a',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontWeight: '600',
                            boxShadow: !a.is_read ? '0 2px 4px rgba(30, 58, 138, 0.25)' : 'none',
                            transition: 'all 0.2s ease'
                          }}
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

          {/* FOOTER */}
          <div
            style={{
              padding: 14,
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >

            <p
              style={{
                fontSize: 12,
                color: '#64748b'
              }}
            >
              Showing {filtered.length} assignments
            </p>

          </div>

        </div>

      </div>

    </DashboardLayout>
  )
}