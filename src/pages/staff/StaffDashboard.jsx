import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, X, Calendar } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { dashboardService, noticeService } from '../../services'


// Status: issue+due=Completed, issue only=Pending, fallback to API status
const getStatus = (item) => {
  const hasIssueDate = !!(item?.issued_on || item?.issue_date)
  const hasDueDate = !!(item?.due_date || item?.response_due_date)
  if (hasIssueDate && hasDueDate) return 'Completed'
  if (hasIssueDate && !hasDueDate) return 'Pending'
  if (item?.is_completed || (item?.status || '').toLowerCase() === 'completed') return 'Completed'
  return item?.status || item?.workflow_status || 'Pending'
}

export default function StaffDashboard() {
  const [summary, setSummary] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ month: '', year: '', assessment: '' })
  const [appliedFilters, setAppliedFilters] = useState({ month: '', year: '', assessment: '' })
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [loading, setLoading] = useState(true)
  const [allNotices, setAllNotices] = useState([])
  const [allNoticesLoaded, setAllNoticesLoaded] = useState(false)
  const [recentNotices, setRecentNotices] = useState([])
  const [recentMeta, setRecentMeta] = useState({})
  const [recentLoading, setRecentLoading] = useState(false)
  const [recentError, setRecentError] = useState(null)
  const [recentOffset, setRecentOffset] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const navigate = useNavigate()

  const [activeDashboardTab, setActiveDashboardTab] = useState('assignments')
  const [blockedNotices, setBlockedNotices] = useState([])
  const [blockedLoading, setBlockedLoading] = useState(false)

  const fetchBlockedNotices = async () => {
    setBlockedLoading(true)
    try {
      const res = await noticeService.getBlockedNotices('STAFF')
      const raw = res?.data || []
      setBlockedNotices(raw)
    } catch (err) {
      console.warn('Failed to fetch blocked notices:', err)
      setBlockedNotices([])
    } finally {
      setBlockedLoading(false)
    }
  }

  useEffect(() => {
    if (activeDashboardTab === 'blocked') {
      fetchBlockedNotices()
    }
  }, [activeDashboardTab])

  const filteredBlocked = blockedNotices.filter(item => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      String(item.notice_id || '').toLowerCase().includes(q) ||
      (item.assessee_name || '').toLowerCase().includes(q) ||
      (item.assessment_year || '').toLowerCase().includes(q) ||
      (item.status || '').toLowerCase().includes(q)
    )
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const readNoticeIds = JSON.parse(localStorage.getItem('readNoticeIds') || '[]')

        // 1) Summary
        try {
          const sumRes = await dashboardService.getSummary()
          if (sumRes.data && Object.keys(sumRes.data).length > 0) {
            setSummary(sumRes.data)
          } else {
            setSummary({ total_notices: 0, pending_notices: 0, completed_notices: 0 })
          }
        } catch (err) {
          console.warn('Summary fetch failed:', err)
          setSummary({ total_notices: 0, pending_notices: 0, completed_notices: 0 })
        }

        // 2) Recent notices
        let recentRes = null
        try {
          recentRes = await dashboardService.getRecentNotices({ limit: 10, offset: 0 })
          const raw = recentRes.data?.items || recentRes.data?.data || recentRes.data || []
          const meta = recentRes.data?.meta || recentRes.meta || {}
          const rawList = Array.isArray(raw) ? raw : []
          const mapped = rawList.map(n => {
            const noticeId = n.notice_id ?? n.id
            const permanentlyRead = readNoticeIds.includes(noticeId)
            return {
              ...n,
              notice_id: noticeId,
              file_no: n.file_name || n.file_no || n.fileNumber || n.fileId || n.client?.file_name || n.client?.file_no || 'N/A',
              user: n.assessee_name || n.user || n.user_name || n.professional_name || "N/A",
              user_name: n.assessee_name || n.user || n.user_name || n.professional_name || "N/A",
              proceeding_name: n.proceeding_name || n.notice_type || "N/A",
              assessment_year: n.assessment_year || n.financial_year || n.year || n.assessmentYear || n.ay || 'N/A',
              reference_id: n.reference_id || `REF-${noticeId}`,
              issued_on: n.issued_on || n.assigned_at || n.createdAt || "-",
              due_date: n.due_date || "-",
              assigned_professional: n.assigned_professional || n.professional_name || "—",
              status: n.status || n.workflow_status || 'N/A',
              is_read: permanentlyRead || !!(n.is_read ?? n.isRead ?? false)
            }
          })
          setRecentNotices(mapped)
          setRecentMeta(meta)
        } catch (err) {
          console.warn('Recent notices fetch failed:', err)
          setRecentNotices([])
        }

        // 3) Assignments (fallback to recent notices or defaultMockNotices when missing)
        try {
          const assignRes = await dashboardService.getAssignments()
          const hasAssign = assignRes?.data && Array.isArray(assignRes.data) && assignRes.data.length
          
          let rawList = []
          if (hasAssign) {
            rawList = assignRes.data
          } else {
            const recentRaw = recentRes?.data?.items || recentRes?.data?.data || recentRes?.data || []
            rawList = Array.isArray(recentRaw) ? recentRaw : []
          }

          const mapped = rawList.map(n => {
            const noticeId = n.notice_id ?? n.id
            const permanentlyRead = readNoticeIds.includes(noticeId)
            return {
              ...n,
              notice_id: noticeId,
              file_no: n.file_name || n.file_no || n.fileNumber || n.fileId || n.client?.file_name || n.client?.file_no || 'N/A',
              user: n.assessee_name || n.user || n.user_name || n.professional_name || "N/A",
              user_name: n.assessee_name || n.user || n.user_name || n.professional_name || "N/A",
              proceeding_name: n.proceeding_name || n.notice_type || "N/A",
              assessment_year: n.assessment_year || n.financial_year || n.year || n.assessmentYear || n.ay || 'N/A',
              reference_id: n.reference_id || `REF-${noticeId}`,
              issued_on: n.issued_on || n.assigned_at || n.createdAt || "-",
              due_date: n.due_date || "-",
              assigned_professional: n.assigned_professional || n.professional_name || "—",
              status: n.status || n.workflow_status || 'N/A',
              is_read: permanentlyRead || !!(n.is_read ?? n.isRead ?? false)
            }
          })
          setAssignments(mapped)
        } catch (err) {
          console.warn('Assignments fetch failed:', err)
          setAssignments([])
        }

      } catch (err) {
        // silent error handling
      } finally {
        setLoading(false)
      }
    }

    const fetchAllNotices = async () => {
      try {
        const readNoticeIds = JSON.parse(localStorage.getItem('readNoticeIds') || '[]')
        const res = await noticeService.getNotices()
        const extractNotices = (r) => {
          let rList = []
          if (Array.isArray(r?.data?.items)) rList = r.data.items
          else if (Array.isArray(r?.data?.data)) rList = r.data.data
          else if (Array.isArray(r?.data?.results)) rList = r.data.results
          else if (Array.isArray(r?.data)) rList = r.data
          else if (Array.isArray(r?.items)) rList = r.items
          else if (Array.isArray(r?.results)) rList = r.results
          else if (Array.isArray(r)) rList = r
          else if (r && typeof r === 'object') {
            const searchObj = r.data && typeof r.data === 'object' ? r.data : r
            for (const key of Object.keys(searchObj)) {
              if (Array.isArray(searchObj[key])) {
                rList = searchObj[key]
                break
              }
            }
          }
          return Array.isArray(rList) ? rList : []
        }
        const rawList = extractNotices(res)
        const mapped = rawList.map(n => {
          const noticeId = n.notice_id ?? n.id
          const permanentlyRead = readNoticeIds.includes(noticeId)
          return {
            ...n,
            notice_id: noticeId,
            file_no: n.file_name || n.file_no || n.fileNumber || n.fileId || n.client?.file_name || n.client?.file_no || 'N/A',
            user: n.assessee_name || n.user || n.user_name || n.professional_name || 'N/A',
            user_name: n.assessee_name || n.user || n.user_name || n.professional_name || 'N/A',
            proceeding_name: n.proceeding_name || n.notice_type || 'N/A',
            assessment_year: n.assessment_year || n.financial_year || n.year || n.assessmentYear || n.ay || 'N/A',
            reference_id: n.reference_id || `REF-${noticeId}`,
            issued_on: n.issued_on || n.assigned_at || n.createdAt || '-',
            due_date: n.due_date || '-',
            assigned_professional: n.assigned_professional || n.professional_name || '—',
            status: n.status || n.workflow_status || 'N/A',
            is_read: permanentlyRead || !!(n.is_read ?? n.isRead ?? false)
          }
        })
        setAllNotices(mapped)
        setAllNoticesLoaded(true)
      } catch (err) {
        console.warn('fetchAllNotices failed:', err)
        setAllNotices([])
        setAllNoticesLoaded(true)
      }
    }

    fetchData()
    fetchAllNotices()

    // Listen for assignment changes from other pages (e.g., Clients.jsx)
    const onAssigned = (e) => {
      try {
        const detail = e?.detail || {}
        const { userId, professionalName } = detail
        if (!userId) return

        const updateAssigned = (list) => list.map(item => {
          const matchesUser = (
            item.client?.id === userId ||
            item.client_id === userId ||
            item.user_id === userId ||
            item.user === userId ||
            String(item.client?.id) === String(userId)
          )
          if (matchesUser) return { ...item, assigned_professional: professionalName }
          return item
        })

        setAssignments(prev => Array.isArray(prev) ? updateAssigned(prev) : prev)
        setAllNotices(prev => Array.isArray(prev) ? updateAssigned(prev) : prev)
        setRecentNotices(prev => Array.isArray(prev) ? updateAssigned(prev) : prev)
      } catch (err) {
        // ignore
      }
    }

    window.addEventListener('professionalAssigned', onAssigned)
    return () => window.removeEventListener('professionalAssigned', onAssigned)
  }, [])


  const handleViewNotice = async (a) => {
    const noticeId = a.notice_id ?? a.id
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
    navigate(`/staff/notice-orders/${noticeId}`)
  }

  const isAllFilter = (val) => !val || String(val).trim() === '' || String(val).trim().toLowerCase() === 'all'
  const noFiltersApplied = isAllFilter(appliedFilters.month) && isAllFilter(appliedFilters.year) && isAllFilter(appliedFilters.assessment)
  const sourceData = noFiltersApplied ? allNotices : assignments

  // Keep unread count in sync with what's visible
  useEffect(() => {
    const count = sourceData.filter(n => !n.is_read).length
    setUnreadCount(count)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignments, allNotices, appliedFilters])

  const filtered = sourceData.filter(a => {
    const term = search.trim().toLowerCase()

    // Global search across all visible columns (User, Proceeding Name, Assessment Year, Assigned Professional, Issued On, Due Date)
    const matchesSearch = !term || (() => {
      const userName = (a?.user || a?.user_name || a?.assessee_name || '').toLowerCase()
      const referenceId = (a?.reference_id || `REF-${a?.notice_id || ''}`).toLowerCase()
      const noticeId = String(a?.notice_id ?? '')
      const assessmentYear = (a?.assessment_year || '').toString().toLowerCase()
      const proceedingName = (a?.proceeding_name || '').toLowerCase()
      
      const profObj = a?.assigned_professional
      const assignedProfessional = (
        typeof profObj === 'string' 
          ? profObj 
          : (profObj?.professional_name || profObj?.name || '—')
      ).toLowerCase()

      const statusText = (a?.status || '').toLowerCase()
      const panText = (a?.pan || a?.client?.pan || a?.user?.pan || '').toLowerCase()

      const issuedDates = getDateSearchStrings(a?.issued_on)
      const dueDates = getDateSearchStrings(a?.due_date)

      const matchesIssued = issuedDates.some(dStr => dStr.includes(term))
      const matchesDue = dueDates.some(dStr => dStr.includes(term))

      return (
        userName.includes(term) ||
        referenceId.includes(term) ||
        noticeId.includes(term) ||
        assessmentYear.includes(term) ||
        proceedingName.includes(term) ||
        assignedProfessional.includes(term) ||
        matchesIssued ||
        matchesDue ||
        statusText.includes(term) ||
        panText.includes(term)
      )
    })()

    // Filter by Month, Year, Assessment
    const assignedDate = (a?.issued_on && a?.issued_on !== '-') ? new Date(a.issued_on) : null
    const matchesMonth = isAllFilter(appliedFilters.month) || (assignedDate && assignedDate.getMonth() + 1 === parseInt(appliedFilters.month))
    const matchesYear = isAllFilter(appliedFilters.year) || (assignedDate && assignedDate.getFullYear() === parseInt(appliedFilters.year))

    const status = (a?.status || '').toLowerCase()
    const matchesAssessment = isAllFilter(appliedFilters.assessment) || status === appliedFilters.assessment.toLowerCase()

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

  const getInitials = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const avatarColors = ['#7c3aed', '#059669', '#16a34a', '#ea580c', '#1d4ed8', '#dc2626']
  const colorFor = (i) => avatarColors[i % avatarColors.length]

  const formatDate = (str) => {
    if (!str || str === '-') return '-'
    try {
      const d = new Date(str)
      if (isNaN(d.getTime())) return '-'
      return d.toLocaleDateString('en-GB')
    } catch {
      return '-'
    }
  }

  const getDateSearchStrings = (str) => {
    if (!str || str === '-') return []
    try {
      const d = new Date(str)
      if (isNaN(d.getTime())) return []
      const day = String(d.getDate()).padStart(2, '0')
      const year = String(d.getFullYear())
      const monthIndex = d.getMonth()
      const monthsFull = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ]
      const monthsAbbr = [
        'jan', 'feb', 'mar', 'apr', 'may', 'jun',
        'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
      ]
      const formattedGB = d.toLocaleDateString('en-GB')
      const fullMonthStr = `${day} ${monthsFull[monthIndex]} ${year}`
      const abbrMonthStr = `${day} ${monthsAbbr[monthIndex]} ${year}`
      return [formattedGB.toLowerCase(), fullMonthStr, abbrMonthStr, str.toLowerCase()]
    } catch {
      return []
    }
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
      <div className="staff-dashboard-content" style={{ padding: '20px 22px' }}>

        {/* Assignments table */}
        <div className="staff-dashboard-card" style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 12, overflow: 'visible' }}>
          <div className="staff-dashboard-header" style={{ padding: '14px 18px', borderBottom: '0.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#1e293b' }}>My Assignments</p>
              <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Managing notification workflow and compliance deadlines</p>
            </div>
            <div className="staff-search-filter-row" style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 auto', minWidth: 280 }}>
              {/* Search Bar */}
              <div className="staff-search-box" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px', background: '#fff', boxSizing: 'border-box', minWidth: 280 }}>
                <Search size={16} color="#64748b" />
                <input
                  type="text"
                  placeholder="Search name, PAN, year, professional, proceeding…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    border: 'none',
                    outline: 'none',
                    fontSize: 11,
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
            <div className="staff-filter-panel" style={{ padding: '12px 18px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>Month:</label>
                <select
                  value={filters.month}
                  onChange={e => setFilters({ ...filters, month: e.target.value })}
                  style={{
                    padding: '8px 10px',
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    fontSize: 11,
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
                <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>Year:</label>
                <select
                  value={filters.year}
                  onChange={e => setFilters({ ...filters, year: e.target.value })}
                  style={{
                    padding: '8px 10px',
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    fontSize: 11,
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
                <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>Assessment:</label>
                <select
                  value={filters.assessment}
                  onChange={e => setFilters({ ...filters, assessment: e.target.value })}
                  style={{
                    padding: '8px 10px',
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    fontSize: 11,
                    color: '#1e293b',
                    background: '#fff',
                    minWidth: 140,
                    cursor: 'pointer'
                  }}
                >
                  <option value="">All Assessments</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                    padding: '6px 12px',
                    background: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
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
                    padding: '6px 12px',
                    background: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
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
            </div>
          )}

<<<<<<< HEAD
          <div className="staff-table-wrapper" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '12%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '15%' }} />
              </colgroup>
              <thead>
                <tr>
                  {['File No', 'User', 'Proceeding Name', 'Assessment Year', 'Assigned Professional', 'Issued On', 'Due Date', 'Notice'].map(h => (
                    <th key={h} style={{ background: '#f8fafc', color: '#64748b', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', padding: '10px 10px', borderBottom: '0.5px solid #e2e8f0', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 11 }}>Loading assignments...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 48, color: '#94a3b8', fontSize: 11 }}>
                      No data available
                    </td>
                  </tr>
                ) : (
                  filtered.map((a, i) => (
                    <tr key={a.notice_id || i} style={{ borderBottom: '0.5px solid #f1f5f9', background: !a.is_read ? '#e0f2fe' : 'transparent', transition: 'all 0.3s ease' }}>
                      <td style={{ padding: '11px 10px', color: '#475569', fontWeight: 600, fontSize: 13, borderLeft: !a.is_read ? '4px solid #2563eb' : '4px solid transparent', transition: 'border-left-color 0.3s ease' }}>
                        {a.file_no || 'N/A'}
                      </td>
                      <td style={{ padding: '11px 10px', color: '#1e293b', verticalAlign: 'middle', fontSize: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
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
                          <span style={{ fontWeight: !a.is_read ? 700 : 500 }}>{a?.user || a?.user_name || "N/A"}</span>
                        </div>
                      </td>
                      <td
                        style={{ padding: '11px 10px', fontWeight: !a.is_read ? 700 : 600, color: !a.is_read ? '#1e293b' : '#334155', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 14 }}
                        onClick={() => {
                          const isInfo = (a.status || '').toLowerCase() === 'completed' || (a.status || '').toLowerCase() === 'closed'
                          navigate(`/staff/notices?assessee=${encodeURIComponent(a?.assessee_name || a?.user || a?.user_name || '')}&tab=${isInfo ? 'info' : 'action'}`, { state: { assesseeName: a?.assessee_name || a?.user || a?.user_name || '' } })
                        }}
                        title="Click to view e-Proceeding"
                      >
                        {a.proceeding_name}
                      </td>
                      <td style={{ padding: '11px 10px', color: '#64748b', fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.assessment_year || 'N/A'}
                      </td>
                      <td style={{ padding: '11px 10px', color: '#2563eb', fontWeight: !a.is_read ? '600' : '500', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.assigned_professional || '—'}
                      </td>
                      <td style={{ padding: '10px 10px', color: '#64748b', fontWeight: !a.is_read ? '600' : 'normal', fontSize: 12 }}>
                        {a?.issued_on && a.issued_on !== '-' ? formatDate(a.issued_on) : "-"}
                      </td>
                      <td style={{ padding: '10px 10px', color: '#dc2626', fontWeight: !a.is_read ? 700 : 500, fontSize: 12 }}>
                        {a?.due_date && a.due_date !== '-' ? formatDate(a.due_date) : "-"}
                      </td>
                      <td style={{ padding: '10px 10px' }}>
                        <button
                          onClick={() => handleViewNotice(a)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 9px', background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: '600', cursor: 'pointer', boxShadow: !a.is_read ? '0 2px 4px rgba(30, 58, 138, 0.25)' : 'none', transition: 'all 0.2s ease' }}
                        >
                          VIEW NOTICE
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
=======
          {/* Tab Selection */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: '0 18px' }}>
            <button
              onClick={() => setActiveDashboardTab('assignments')}
              style={{
                padding: '12px 16px',
                fontSize: 13,
                fontWeight: activeDashboardTab === 'assignments' ? 600 : 500,
                color: activeDashboardTab === 'assignments' ? '#2563eb' : '#64748b',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                borderBottom: activeDashboardTab === 'assignments' ? '3px solid #2563eb' : '3px solid transparent',
                marginBottom: -1,
                transition: 'all 0.2s'
              }}
            >
              My Assignments ({filtered.length})
            </button>
            <button
              onClick={() => setActiveDashboardTab('blocked')}
              style={{
                padding: '12px 16px',
                fontSize: 13,
                fontWeight: activeDashboardTab === 'blocked' ? 600 : 500,
                color: activeDashboardTab === 'blocked' ? '#2563eb' : '#64748b',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                borderBottom: activeDashboardTab === 'blocked' ? '3px solid #2563eb' : '3px solid transparent',
                marginBottom: -1,
                transition: 'all 0.2s'
              }}
            >
              Blocked Notices ({blockedNotices.length})
            </button>
>>>>>>> 1bba6ca8ff1bfc02b9149cbd8a84ffbe0587e12d
          </div>

          {activeDashboardTab === 'assignments' ? (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '18%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '13%' }} />
                    <col style={{ width: '13%' }} />
                    <col style={{ width: '15%' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      {['User', 'Proceeding Name', 'Assessment Year', 'Assigned Professional', 'Issued On', 'Due Date', 'Notice'].map(h => (
                        <th key={h} style={{ background: '#f8fafc', color: '#64748b', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', padding: '10px 10px', borderBottom: '0.5px solid #e2e8f0', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 11 }}>Loading assignments...</td></tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: 48, color: '#94a3b8', fontSize: 11 }}>
                          No data available
                        </td>
                      </tr>
                    ) : (
                      filtered.map((a, i) => (
                        <tr key={a.notice_id || i} style={{ borderBottom: '0.5px solid #f1f5f9', background: !a.is_read ? '#e0f2fe' : 'transparent', transition: 'all 0.3s ease' }}>
                          <td style={{ padding: '11px 10px', color: '#1e293b', verticalAlign: 'middle', borderLeft: !a.is_read ? '4px solid #2563eb' : '4px solid transparent', transition: 'border-left-color 0.3s ease', fontSize: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
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
                              <span style={{ fontWeight: !a.is_read ? 700 : 500 }}>{a?.user || a?.user_name || "N/A"}</span>
                            </div>
                          </td>
                          <td
                            style={{ padding: '11px 10px', fontWeight: !a.is_read ? 700 : 600, color: !a.is_read ? '#1e293b' : '#334155', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 14 }}
                            onClick={() => {
                              const isInfo = (a.status || '').toLowerCase() === 'completed' || (a.status || '').toLowerCase() === 'closed'
                              navigate(`/staff/notices?assessee=${encodeURIComponent(a?.assessee_name || a?.user || a?.user_name || '')}&tab=${isInfo ? 'info' : 'action'}`, { state: { assesseeName: a?.assessee_name || a?.user || a?.user_name || '' } })
                            }}
                            title="Click to view e-Proceeding"
                          >
                            {a.proceeding_name}
                          </td>
                          <td style={{ padding: '11px 10px', color: '#64748b', fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {a.assessment_year || 'N/A'}
                          </td>
                          <td style={{ padding: '11px 10px', color: '#2563eb', fontWeight: !a.is_read ? '600' : '500', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {a.assigned_professional || '—'}
                          </td>
                          <td style={{ padding: '10px 10px', color: '#64748b', fontWeight: !a.is_read ? '600' : 'normal', fontSize: 12 }}>
                            {a?.issued_on && a.issued_on !== '-' ? formatDate(a.issued_on) : "-"}
                          </td>
                          <td style={{ padding: '10px 10px', color: '#dc2626', fontWeight: !a.is_read ? 700 : 500, fontSize: 12 }}>
                            {a?.due_date && a.due_date !== '-' ? formatDate(a.due_date) : "-"}
                          </td>
                          <td style={{ padding: '10px 10px' }}>
                            <button
                              onClick={() => handleViewNotice(a)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 9px', background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: '600', cursor: 'pointer', boxShadow: !a.is_read ? '0 2px 4px rgba(30, 58, 138, 0.25)' : 'none', transition: 'all 0.2s ease' }}
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
                <p style={{ fontSize: 11, color: '#64748b' }}>Showing {filtered.length} of {summary?.total_notices ?? filtered.length} assignments</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['‹', '›'].map(ch => (
                    <button key={ch} style={{ width: 28, height: 28, border: '0.5px solid #e2e8f0', borderRadius: 6, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{ch}</button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '35%' }} />
                    <col style={{ width: '20%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '15%' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      {['Notice ID', 'Assessee Name', 'Assessment Year', 'Issued On', 'Status'].map(h => (
                        <th key={h} style={{ background: '#f8fafc', color: '#64748b', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', padding: '10px 10px', borderBottom: '0.5px solid #e2e8f0', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {blockedLoading ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 11 }}>Loading blocked notices...</td></tr>
                    ) : filteredBlocked.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: 48, color: '#94a3b8', fontSize: 11 }}>
                          No blocked notices found
                        </td>
                      </tr>
                    ) : (
                      filteredBlocked.map((n, i) => (
                        <tr key={n.notice_id || i} style={{ borderBottom: '0.5px solid #f1f5f9' }}>
                          <td style={{ padding: '11px 10px', color: '#1e293b', fontWeight: 600, fontSize: 14 }}>
                            {n.notice_id}
                          </td>
                          <td style={{ padding: '11px 10px', color: '#334155', fontWeight: 600, fontSize: 14 }}>
                            {n.assessee_name}
                          </td>
                          <td style={{ padding: '11px 10px', color: '#64748b', fontWeight: 500, fontSize: 13 }}>
                            {n.assessment_year || 'N/A'}
                          </td>
                          <td style={{ padding: '10px 10px', color: '#64748b', fontSize: 12 }}>
                            {n?.issued_on && n.issued_on !== '-' ? formatDate(n.issued_on) : "-"}
                          </td>
                          <td style={{ padding: '10px 10px', color: '#dc2626', fontWeight: 600, fontSize: 12 }}>
                            {n.status || 'PENDING'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ padding: '11px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '0.5px solid #f1f5f9' }}>
                <p style={{ fontSize: 11, color: '#64748b' }}>Showing {filteredBlocked.length} blocked notices</p>
              </div>
            </>
          )}
          <div className="staff-pagination" style={{ padding: '11px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '0.5px solid #f1f5f9' }}>
            <p style={{ fontSize: 11, color: '#64748b' }}>Showing {filtered.length} of {summary?.total_notices ?? filtered.length} assignments</p>
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
