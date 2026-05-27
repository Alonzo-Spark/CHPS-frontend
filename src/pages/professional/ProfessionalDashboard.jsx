import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { dashboardService, professionalDashboardService, noticeService, noticeControlService } from '../../services'


// Status: issue+due=Completed, issue only=Pending
const getStatus = (item) => {
  const hasIssueDate = !!(item?.issued_on || item?.issue_date)
  const hasDueDate = !!(item?.due_date || item?.response_due_date)
  if (hasIssueDate && hasDueDate) return 'Completed'
  if (hasIssueDate && !hasDueDate) return 'Pending'
  if (item?.is_completed || (item?.status || '').toLowerCase() === 'completed') return 'Completed'
  return item?.status || item?.workflow_status || 'Pending'
}

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
  const [noticeControl, setNoticeControl] = useState({})
  const [yearDropdownOpen, setYearDropdownOpen] = useState(null)
  const [selectedYears, setSelectedYears] = useState({})

  const ALL_YEARS = ['2019-20', '2020-21', '2021-22', '2022-23', '2023-24', '2024-25']

  const navigate = useNavigate()

  useEffect(() => {
    fetchDashboard()
    fetchAllNotices()
  }, [])

  const fetchDashboard = async () => {
    try {
      const readNoticeIds = JSON.parse(localStorage.getItem('readNoticeIds') || '[]')

      // SUMMARY
      try {
        const sumRes = await dashboardService.getSummary()
        if (sumRes.data && Object.keys(sumRes.data).length > 0) {
          setSummary(sumRes.data)
        } else {
          setSummary({ total_notices: 0, pending_notices: 0, completed_notices: 0 })
        }
      } catch (err) {
        console.warn('Summary fetch failed', err)
        setSummary({ total_notices: 0, pending_notices: 0, completed_notices: 0 })
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

        const rawList = Array.isArray(raw) ? raw : []

       const mapped = rawList.map(n => {
         const noticeId = n.notice_id ?? n.id
         const permanentlyRead = readNoticeIds.includes(noticeId)
         const uName = n.user_name || n.client_name || n.user || 'N/A'
         return {
           notice_id: noticeId,
           client_id: n.client_id || n.user_id || n.id || 0,
           user: uName,
           user_name: uName,
           proceeding_name: n.proceeding_name || n.notice_type || 'N/A',
           professional_name: n.professional_name || n.assigned_professional?.professional_name || n.assigned_professional || '—',
           reference_id: n.reference_id || `REF-${noticeId}`,
           assessment_year: n.assessment_year || n.year || 'N/A',
           issued_on: n.issued_on || '-',
           due_date: n.response_due_date || n.due_date || '-',
           status: n.workflow_status || n.status || 'N/A',
           is_read: permanentlyRead || !!(n.is_read ?? n.isRead ?? false)
         }
       })

        setAssignments(mapped)

      } catch (err) {
        console.error('Recent notices API failed:', err)
        setAssignments([])
      }

    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllNotices = async () => {
    try {
      const readNoticeIds = JSON.parse(localStorage.getItem('readNoticeIds') || '[]')
      const res = await noticeService.getNotices()
      const raw = res?.data?.items || res?.data || []
      const rawList = Array.isArray(raw) ? raw : []
      const mapped = rawList.map(n => {
        const noticeId = n.notice_id ?? n.id
        const permanentlyRead = readNoticeIds.includes(noticeId)
        const uName = n.user_name || n.client_name || n.user || 'N/A'
        return {
          notice_id: noticeId,
          client_id: n.client_id || n.user_id || n.id || 0,
          user: uName,
          user_name: uName,
          proceeding_name: n.proceeding_name || n.notice_type || 'N/A',
          professional_name: n.professional_name || n.assigned_professional?.professional_name || n.assigned_professional || '—',
          reference_id: n.reference_id || `REF-${noticeId}`,
          assessment_year: n.assessment_year || n.year || 'N/A',
          issued_on: n.issued_on || '-',
          due_date: n.response_due_date || n.due_date || '-',
          status: n.workflow_status || n.status || 'N/A',
          is_read: permanentlyRead || !!(n.is_read ?? n.isRead ?? false)
        }
      })
      setAllNotices(mapped)
      setAllNoticesLoaded(true)
    } catch (err) {
      console.error('fetchAllNotices failed:', err)
      setAllNotices([])
      setAllNoticesLoaded(true)
    }
  }

  // Fetch notice control data for each client once assignments/notices are loaded
  useEffect(() => {
    const list = filtered || assignments || []
    if (list.length === 0) return
    list.forEach(a => {
      const cid = a.client_id
      if (!cid) return
      if (noticeControl[cid]) return // already fetched
      noticeControlService.getNoticeControl(cid).then(res => {
        if (res.data && res.data.available_years) {
          setNoticeControl(prev => ({ ...prev, [cid]: { available_years: res.data.available_years, blocked_years: res.data.blocked_years || [] } }))
        } else {
          setNoticeControl(prev => ({ ...prev, [cid]: { available_years: [...ALL_YEARS], blocked_years: [] } }))
        }
      }).catch(() => {
        setNoticeControl(prev => ({ ...prev, [cid]: { available_years: [...ALL_YEARS], blocked_years: [] } }))
      })
    })
  }, [assignments, allNotices])

  const handleBlockYears = async (clientId) => {
    const sel = selectedYears[clientId] || []
    if (sel.length === 0) return
    const res = await noticeControlService.blockYears(clientId, sel)
    setNoticeControl(prev => {
      const cur = prev[clientId] || { available_years: [...ALL_YEARS], blocked_years: [] }
      const newBlocked = [...new Set([...cur.blocked_years, ...sel])]
      const newAvailable = cur.available_years.filter(y => !sel.includes(y))
      return { ...prev, [clientId]: { available_years: newAvailable, blocked_years: newBlocked } }
    })
    setSelectedYears(prev => ({ ...prev, [clientId]: [] }))
  }

  const handleUnblockYears = async (clientId) => {
    const cur = noticeControl[clientId]
    if (!cur || cur.blocked_years.length === 0) return
    const res = await noticeControlService.unblockYears(clientId, cur.blocked_years)
    setNoticeControl(prev => {
      const c = prev[clientId]
      const newAvailable = [...new Set([...c.available_years, ...c.blocked_years])].sort()
      return { ...prev, [clientId]: { available_years: newAvailable, blocked_years: [] } }
    })
    setSelectedYears(prev => ({ ...prev, [clientId]: [] }))
  }

  const toggleYearSelection = (clientId, year) => {
    setSelectedYears(prev => {
      const cur = prev[clientId] || []
      return { ...prev, [clientId]: cur.includes(year) ? cur.filter(y => y !== year) : [...cur, year] }
    })
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
      const readNoticeIds = JSON.parse(localStorage.getItem('readNoticeIds') || '[]')
      if (!readNoticeIds.includes(noticeId)) {
        readNoticeIds.push(noticeId)
        localStorage.setItem('readNoticeIds', JSON.stringify(readNoticeIds))
      }

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
      (a.professional_name || '').toLowerCase().includes(term) ||
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
              <p style={{ fontSize: 20, fontWeight: 700, color: '#2563eb', margin: 0 }}>{loading ? '...' : unreadCount}</p>
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
                  fontSize: 15,
                  fontWeight: 600,
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
                    background: 'transparent',
                    fontSize: 11
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
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
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
                  fontSize: 11,
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
                  fontSize: 11,
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
                  fontSize: 11,
                  color: '#1e293b',
                  background: '#fff',
                  cursor: 'pointer',
                  minWidth: 140,
                  outline: 'none'
                }}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>

              </select>

              <button 
                onClick={handleApplyFilters}
                style={{
                  padding: '8px 16px',
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 11,
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
                  background: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  boxShadow: '0 2px 4px rgba(59, 130, 246, 0.15)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2563eb' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#3b82f6' }}
              >
                Clear
              </button>

              <button 
                onClick={() => setShowFilterPanel(false)}
                style={{
                  padding: '8px 16px',
                  background: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  boxShadow: '0 2px 4px rgba(59, 130, 246, 0.15)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2563eb' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#3b82f6' }}
              >
                Cancel
              </button>

            </div>
          )}

          {/* TABLE */}
          <div style={{ overflowX: 'auto' }}>

            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                tableLayout: 'fixed'
              }}
            >
              <colgroup>
                <col style={{ width: '13%' }} />
                <col style={{ width: '17%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '10%' }} />
              </colgroup>

              <thead>

                <tr
                  style={{
                    background: '#f8fafc'
                  }}
                >

                  {[
                    'User',
                    'Proceeding Name',
                    'Professional Name',
                    'Assessment Year',
                    'Issued On',
                    'Due Date',
                    'Notice Control',
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
                      colSpan={8}
                      style={{
                        textAlign: 'center',
                        padding: 40,
                        fontSize: 11
                      }}
                    >
                      Loading...
                    </td>
                  </tr>

                ) : filtered.length === 0 ? (

                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        textAlign: 'center',
                        padding: 40,
                        color: '#94a3b8',
                        fontSize: 11
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
                          fontWeight: !a.is_read ? '700' : 'normal',
                          fontSize: 13
                        }}
                      >
                        <div 
                          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#1e293b' }} 
                          onClick={() => navigate('/staff/notices')}
                          onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                        >
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
                          cursor: 'pointer',
                          fontSize: 13
                        }}
                        onClick={() => handleViewNotice(a)}
                      >
                        {a.proceeding_name}
                      </td>

                      {/* PROFESSIONAL NAME */}
                      <td
                        style={{
                          padding: 12,
                          color: '#2563eb',
                          fontWeight: !a.is_read ? '600' : 'normal',
                          fontSize: 13
                        }}
                      >
                        {a.professional_name}
                      </td>

                      {/* ASSESSMENT YEAR */}
                      <td
                        style={{
                          padding: 12,
                          color: '#475569',
                          fontWeight: !a.is_read ? '600' : 'normal',
                          fontSize: 13
                        }}
                      >
                        {a.assessment_year || 'N/A'}
                      </td>

                      {/* ISSUED */}
                      <td style={{ padding: 12, fontWeight: !a.is_read ? '600' : 'normal', fontSize: 13 }}>
                        {formatDate(a.issued_on)}
                      </td>

                      {/* DUE */}
                      <td
                        style={{
                          padding: 12,
                          color: '#dc2626',
                          fontWeight: !a.is_read ? '700' : 'normal',
                          fontSize: 13
                        }}
                      >
                        {formatDate(a.due_date)}
                      </td>

                      {/* NOTICE CONTROL */}
                      <td style={{ padding: '8px 6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <div style={{ position: 'relative' }}>
                            <button
                              onClick={() => setYearDropdownOpen(yearDropdownOpen === (a.client_id || index) ? null : (a.client_id || index))}
                              style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff', fontSize: 10, cursor: 'pointer', color: '#1e293b', minWidth: 70, textAlign: 'left', whiteSpace: 'nowrap' }}
                            >
                              {(selectedYears[a.client_id] || []).length > 0 ? `${(selectedYears[a.client_id]).length} selected` : 'Years ▾'}
                            </button>
                            {yearDropdownOpen === (a.client_id || index) && (
                              <>
                                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }} onClick={() => setYearDropdownOpen(null)} />
                                <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: 130, marginTop: 4, maxHeight: 180, overflowY: 'auto' }}>
                                  {((noticeControl[a.client_id] || {}).available_years || ALL_YEARS).length === 0 ? (
                                    <div style={{ padding: '8px 10px', fontSize: 10, color: '#94a3b8' }}>All years blocked</div>
                                  ) : (
                                    ((noticeControl[a.client_id] || {}).available_years || ALL_YEARS).map(year => (
                                      <label key={year} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', fontSize: 11, cursor: 'pointer', borderBottom: '0.5px solid #f1f5f9' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                      >
                                        <input type="checkbox" checked={(selectedYears[a.client_id] || []).includes(year)} onChange={() => toggleYearSelection(a.client_id, year)} style={{ accentColor: '#1e3a8a', cursor: 'pointer' }} />
                                        {year}
                                      </label>
                                    ))
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                          <button
                            onClick={() => handleBlockYears(a.client_id)}
                            style={{ padding: '4px 10px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}
                          >
                            Block
                          </button>
                          <button
                            onClick={() => handleUnblockYears(a.client_id)}
                            disabled={!((noticeControl[a.client_id] || {}).blocked_years || []).length}
                            style={{ padding: '4px 10px', background: ((noticeControl[a.client_id] || {}).blocked_years || []).length ? '#16a34a' : '#d1d5db', color: '#fff', border: 'none', borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: ((noticeControl[a.client_id] || {}).blocked_years || []).length ? 'pointer' : 'default' }}
                          >
                            Unblock
                          </button>
                          {((noticeControl[a.client_id] || {}).blocked_years || []).length > 0 && (
                            <div style={{ fontSize: 9, color: '#dc2626', marginTop: 2, width: '100%' }}>
                              Blocked: {(noticeControl[a.client_id].blocked_years).join(', ')}
                            </div>
                          )}
                        </div>
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
                            transition: 'all 0.2s ease',
                            fontSize: 11
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
                fontSize: 11,
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