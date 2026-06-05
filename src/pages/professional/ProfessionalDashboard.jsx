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
  const getNoticeReadState = (n, permanentlyRead) => {
    if (permanentlyRead) return true
    if (n.is_read || n.isRead) return true
    const dateStr = n.issued_on || n.assigned_at || n.createdAt
    if (!dateStr || dateStr === '-') return true
    try {
      const noticeDate = new Date(dateStr)
      if (isNaN(noticeDate.getTime())) return true
      const limitDate = new Date('2026-03-01T00:00:00')
      return noticeDate < limitDate
    } catch (e) {
      return true
    }
  }

  const [summary, setSummary] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [search, setSearch] = useState('')
  const [searchFields, setSearchFields] = useState({
    user: '',
    proceedingName: '',
    professionalName: '',
  })
  const [tempIssuedOn, setTempIssuedOn] = useState('')
  const [appliedIssuedOn, setAppliedIssuedOn] = useState('')
  const [isIssuedOnPickerOpen, setIsIssuedOnPickerOpen] = useState(false)
  const [selectedUnblockYears, setSelectedUnblockYears] = useState({})
  const [unblockDropdownOpen, setUnblockDropdownOpen] = useState(null)
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: '', // 'block' or 'unblock'
    clientId: null,
    years: []
  })

  const handleSearchFieldChange = (field, value) => {
    setSearchFields(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const toggleUnblockYearSelection = (clientId, year) => {
    setSelectedUnblockYears(prev => {
      const cur = prev[clientId] || []
      return { ...prev, [clientId]: cur.includes(year) ? cur.filter(y => y !== year) : [...cur, year] }
    })
  }

  const handleBlockYearsClick = (clientId) => {
    const sel = selectedYears[clientId] || []
    if (sel.length === 0) return
    setYearDropdownOpen(null)
    setUnblockDropdownOpen(null)
    setConfirmModal({
      isOpen: true,
      type: 'block',
      clientId,
      years: sel
    })
  }

  const handleUnblockYearsClick = (clientId) => {
    const sel = selectedUnblockYears[clientId] || []
    if (sel.length === 0) return
    setYearDropdownOpen(null)
    setUnblockDropdownOpen(null)
    setConfirmModal({
      isOpen: true,
      type: 'unblock',
      clientId,
      years: sel
    })
  }

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

  const getDynamicYears = () => {
    const list = []
    const startYear = 2012
    const currentYear = new Date().getFullYear()
    for (let yr = startYear; yr <= currentYear; yr++) {
      const nextYearAbbr = String(yr + 1).slice(-2)
      list.push(`${yr}-${nextYearAbbr}`)
    }
    return list
  }

  const ALL_YEARS = getDynamicYears()

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
          const defaultIsRead = getNoticeReadState(n, permanentlyRead)
          const uName = n.user_name || n.client_name || n.user || 'N/A'
          return {
            notice_id: noticeId,
            client_id: n.client_id || n.user_id || n.id || 0,
            file_no: n.file_name || n.file_no || n.fileNumber || n.fileId || n.client?.file_name || n.client?.file_no || 'N/A',
            user: uName,
            user_name: uName,
            proceeding_name: n.proceeding_name || n.notice_type || 'N/A',
            professional_name: n.professional_name || n.assigned_professional?.professional_name || n.assigned_professional || '—',
            reference_id: n.reference_id || `REF-${noticeId}`,
            assessment_year: n.assessment_year || n.financial_year || n.year || n.assessmentYear || n.ay || 'N/A',
            issued_on: n.issued_on || '-',
            due_date: n.response_due_date || n.due_date || '-',
            status: n.workflow_status || n.status || 'N/A',
            is_read: defaultIsRead,
            isRead: defaultIsRead
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
        const defaultIsRead = getNoticeReadState(n, permanentlyRead)
        const uName = n.user_name || n.client_name || n.user || 'N/A'
        return {
          notice_id: noticeId,
          client_id: n.client_id || n.user_id || n.id || 0,
          file_no: n.file_name || n.file_no || n.fileNumber || n.fileId || n.client?.file_name || n.client?.file_no || 'N/A',
          user: uName,
          user_name: uName,
          proceeding_name: n.proceeding_name || n.notice_type || 'N/A',
          professional_name: n.professional_name || n.assigned_professional?.professional_name || n.assigned_professional || '—',
          reference_id: n.reference_id || `REF-${noticeId}`,
          assessment_year: n.assessment_year || n.financial_year || n.year || n.assessmentYear || n.ay || 'N/A',
          issued_on: n.issued_on || '-',
          due_date: n.response_due_date || n.due_date || '-',
          status: n.workflow_status || n.status || 'N/A',
          is_read: defaultIsRead,
          isRead: defaultIsRead
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

  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (!e.target.closest('.notice-control-dropdown')) {
        setYearDropdownOpen(null)
        setUnblockDropdownOpen(null)
      }
    }
    document.addEventListener('click', handleDocumentClick)
    return () => document.removeEventListener('click', handleDocumentClick)
  }, [])

  // Fetch notice control data for each client once assignments/notices are loaded
  useEffect(() => {
    const list = filtered || assignments || []
    if (list.length === 0) return

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    const username = currentUser.username || 'default_prof'
    const profBlocked = JSON.parse(localStorage.getItem(`professionalBlockedYears_${username}`) || '{}')

    list.forEach(a => {
      const cid = a.client_id
      if (!cid) return
      if (noticeControl[cid]) return // already fetched

      const blockedForClient = profBlocked[cid] || []

      Promise.all([
        noticeControlService.getNoticeControl(cid).catch(() => null),
        noticeControlService.getAssessmentYears(cid).catch(() => null)
      ]).then(([ncRes, ayRes]) => {
        const commonYearsRaw = ayRes?.data?.data || ayRes?.data?.years || ayRes?.data?.available_years || ayRes?.data || ayRes?.years || ayRes?.available_years || ayRes || null
        const commonYears = Array.isArray(commonYearsRaw) ? commonYearsRaw : null
        
        const ncData = ncRes?.data || {}
        
        let blocked = blockedForClient
        if (!profBlocked[cid]) {
          blocked = ncData.blocked_years || []
          profBlocked[cid] = blocked
          localStorage.setItem(`professionalBlockedYears_${username}`, JSON.stringify(profBlocked))
        }
        
        let available = commonYears || ncData.available_years || []
        if (blocked.length > 0) {
          available = available.filter(y => !blocked.includes(y))
        }
        
        setNoticeControl(prev => ({
          ...prev,
          [cid]: {
            available_years: available,
            blocked_years: blocked
          }
        }))
      }).catch(() => {
        setNoticeControl(prev => ({ ...prev, [cid]: { available_years: [], blocked_years: blockedForClient } }))
      })
    })
  }, [assignments, allNotices])

  const handleBlockYears = async (clientId, yearsToBlock) => {
    if (!yearsToBlock || yearsToBlock.length === 0) return
    noticeControlService.blockYears(clientId, yearsToBlock).catch(() => null)

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    const username = currentUser.username || 'default_prof'
    const profBlocked = JSON.parse(localStorage.getItem(`professionalBlockedYears_${username}`) || '{}')
    const currentBlocked = profBlocked[clientId] || []
    const newBlocked = [...new Set([...currentBlocked, ...yearsToBlock])]
    profBlocked[clientId] = newBlocked
    localStorage.setItem(`professionalBlockedYears_${username}`, JSON.stringify(profBlocked))

    setNoticeControl(prev => {
      const cur = prev[clientId] || { available_years: [], blocked_years: [] }
      const newAvailable = cur.available_years.filter(y => !yearsToBlock.includes(y))
      return { ...prev, [clientId]: { available_years: newAvailable, blocked_years: newBlocked } }
    })
    setSelectedYears(prev => ({ ...prev, [clientId]: [] }))
  }

  const handleUnblockYears = async (clientId, yearsToUnblock) => {
    if (!yearsToUnblock || yearsToUnblock.length === 0) return
    noticeControlService.unblockYears(clientId, yearsToUnblock).catch(() => null)

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    const username = currentUser.username || 'default_prof'
    const profBlocked = JSON.parse(localStorage.getItem(`professionalBlockedYears_${username}`) || '{}')
    const currentBlocked = profBlocked[clientId] || []
    const newBlocked = currentBlocked.filter(y => !yearsToUnblock.includes(y))
    profBlocked[clientId] = newBlocked
    localStorage.setItem(`professionalBlockedYears_${username}`, JSON.stringify(profBlocked))

    setNoticeControl(prev => {
      const c = prev[clientId] || { available_years: [], blocked_years: [] }
      const newAvailable = [...new Set([...c.available_years, ...yearsToUnblock])].sort()
      return { ...prev, [clientId]: { available_years: newAvailable, blocked_years: newBlocked } }
    })
    setSelectedUnblockYears(prev => ({ ...prev, [clientId]: [] }))
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
    
    if (!noticeId) {
      alert("No notice details available for this record.")
      return
    }

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
      const d = new Date(date)
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

  // FILTERING
  const isAllFilter = (val) => !val || String(val).trim() === '' || String(val).trim().toLowerCase() === 'all'
  const noFiltersApplied = isAllFilter(appliedFilters.month) && isAllFilter(appliedFilters.year) && isAllFilter(appliedFilters.assessment)
  const sourceData = noFiltersApplied ? allNotices : assignments

  // Keep unread count in sync with what's visible
  useEffect(() => {
    const count = sourceData.filter(n => !n.is_read).length
    setUnreadCount(count)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignments, allNotices, appliedFilters])

  const filtered = sourceData.filter((a) => {
    const matchesUser = !searchFields.user || (a.user || '').toLowerCase().includes(searchFields.user.toLowerCase().trim())
    const matchesProceeding = !searchFields.proceedingName || (a.proceeding_name || '').toLowerCase().includes(searchFields.proceedingName.toLowerCase().trim())
    const matchesProfessional = !searchFields.professionalName || (a.professional_name || '').toLowerCase().includes(searchFields.professionalName.toLowerCase().trim())
    
    let matchesIssuedOn = true
    if (appliedIssuedOn) {
      if (a.issued_on && a.issued_on !== '-') {
        try {
          const itemDate = new Date(a.issued_on)
          const filterDate = new Date(appliedIssuedOn)
          if (!isNaN(itemDate.getTime()) && !isNaN(filterDate.getTime())) {
            const itemY = itemDate.getFullYear()
            const itemM = String(itemDate.getMonth() + 1).padStart(2, '0')
            const itemD = String(itemDate.getDate()).padStart(2, '0')
            const itemStr = `${itemY}-${itemM}-${itemD}`
            
            const filterY = filterDate.getFullYear()
            const filterM = String(filterDate.getMonth() + 1).padStart(2, '0')
            const filterD = String(filterDate.getDate()).padStart(2, '0')
            const filterStr = `${filterY}-${filterM}-${filterD}`
            
            matchesIssuedOn = itemStr === filterStr
          } else {
            matchesIssuedOn = false
          }
        } catch {
          matchesIssuedOn = false
        }
      } else {
        matchesIssuedOn = false
      }
    }

    const issuedDate =
      a.issued_on && a.issued_on !== '-'
        ? new Date(a.issued_on)
        : null

    const matchesMonth =
      isAllFilter(appliedFilters.month) ||
      (
        issuedDate &&
        issuedDate.getMonth() + 1 === Number(appliedFilters.month)
      )

    const matchesYear =
      isAllFilter(appliedFilters.year) ||
      (
        issuedDate &&
        issuedDate.getFullYear() === Number(appliedFilters.year)
      )

    const status = (a.status || '').toLowerCase()

    const matchesAssessment =
      isAllFilter(appliedFilters.assessment) ||
      status === appliedFilters.assessment.toLowerCase()

    return (
      matchesUser &&
      matchesProceeding &&
      matchesProfessional &&
      matchesIssuedOn &&
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

  // Calculate dynamic counts
  const dueNoticesCount = allNotices.filter(n => getStatus(n) === 'Pending').length
  const newNoticesCount = allNotices.filter(n => !n.is_read).length

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Dashboard' }]}>

      <div style={{ padding: '20px 22px' }}>

        {/* SUMMARY CARDS */}
        <div className="professional-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div className="professional-stat-card" style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <p style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Due Notices</p>
            <p style={{ color: '#dc2626', fontSize: 28, fontWeight: 700, marginTop: 4 }}>{dueNoticesCount}</p>
          </div>
          <div className="professional-stat-card" style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <p style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>New Notices</p>
            <p style={{ color: '#2563eb', fontSize: 28, fontWeight: 700, marginTop: 4 }}>{newNoticesCount}</p>
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
              className="professional-search-container"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flex: 1,
                maxWidth: 600
              }}
            >

              {/* SEARCH */}
              <div
                className="professional-search-box"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  border: '1px solid #cbd5e1',
                  borderRadius: 10,
                  padding: '6px 10px',
                  background: '#fff'
                }}
              >
                <Search size={14} color="#64748b" style={{ flexShrink: 0 }} />

                <input
                  type="text"
                  placeholder="User..."
                  value={searchFields.user}
                  onChange={(e) => handleSearchFieldChange('user', e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: 60,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: 11,
                    borderRight: '1px solid #cbd5e1',
                    paddingRight: 4
                  }}
                />

                <input
                  type="text"
                  placeholder="Proceeding..."
                  value={searchFields.proceedingName}
                  onChange={(e) => handleSearchFieldChange('proceedingName', e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: 80,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: 11,
                    borderRight: '1px solid #cbd5e1',
                    paddingRight: 4,
                    paddingLeft: 4
                  }}
                />

                <input
                  type="text"
                  placeholder="Professional..."
                  value={searchFields.professionalName}
                  onChange={(e) => handleSearchFieldChange('professionalName', e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: 80,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: 11,
                    borderRight: '1px solid #cbd5e1',
                    paddingRight: 4,
                    paddingLeft: 4
                  }}
                />

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <button
                    onClick={() => setIsIssuedOnPickerOpen(!isIssuedOnPickerOpen)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                      color: appliedIssuedOn ? '#1e3a8a' : '#64748b',
                      paddingLeft: 4,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span>{appliedIssuedOn ? formatDate(appliedIssuedOn) : 'Issued On ▾'}</span>
                  </button>
                  {isIssuedOnPickerOpen && (
                    <>
                      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }} onClick={() => setIsIssuedOnPickerOpen(false)} />
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        zIndex: 100,
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                        padding: 12,
                        marginTop: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        minWidth: 200
                      }}>
                        <input
                          type="date"
                          value={tempIssuedOn}
                          onChange={(e) => setTempIssuedOn(e.target.value)}
                          style={{
                            padding: '6px 8px',
                            border: '1px solid #cbd5e1',
                            borderRadius: 6,
                            fontSize: 12,
                            width: '100%',
                            outline: 'none'
                          }}
                        />
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => {
                              setTempIssuedOn('');
                              setAppliedIssuedOn('');
                              setIsIssuedOnPickerOpen(false);
                            }}
                            style={{ padding: '4px 8px', background: '#f3f4f6', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 10, cursor: 'pointer', color: '#475569' }}
                          >
                            Clear
                          </button>
                          <button
                            onClick={() => {
                              setIsIssuedOnPickerOpen(false);
                            }}
                            style={{ padding: '4px 8px', background: '#f3f4f6', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 10, cursor: 'pointer', color: '#475569' }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              setAppliedIssuedOn(tempIssuedOn);
                              setIsIssuedOnPickerOpen(false);
                            }}
                            style={{ padding: '4px 8px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, fontSize: 10, cursor: 'pointer', fontWeight: 600 }}
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
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
              className="professional-filter-panel"
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
          <div className="professional-table-wrapper" style={{ overflowX: 'auto' }}>

            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                tableLayout: 'fixed'
              }}
            >
              <colgroup>
                <col style={{ width: '10%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '8%' }} />
              </colgroup>

              <thead>

                <tr
                  style={{
                    background: '#f8fafc'
                  }}
                >

                  {[
                    'File No',
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
                  </tr>                ) : (

                  filtered.map((a, index) => {
                    const nc = noticeControl[a.client_id] || { available_years: [], blocked_years: [] }
                    const blockedYrs = nc.blocked_years || []
                    const selYrs = selectedYears[a.client_id] || []
                    const selUnblockYrs = selectedUnblockYears[a.client_id] || []
                    const hasBlocked = blockedYrs.length > 0
                    const availableForDropdown = ALL_YEARS.filter(y => !blockedYrs.includes(y))

                    return (
                      <tr
                        key={a.notice_id || index}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: !a.is_read ? '#e0f2fe' : 'transparent',
                          transition: 'all 0.3s ease'
                        }}
                      >

                        {/* FILE NO */}
                        <td
                          style={{
                            padding: 12,
                            borderLeft: !a.is_read ? '4px solid #2563eb' : '4px solid transparent',
                            transition: 'border-left-color 0.3s ease',
                            fontWeight: 600,
                            color: '#475569',
                            fontSize: 13
                          }}
                        >
                          {a.file_no || 'N/A'}
                        </td>

                        {/* USER */}
                        <td
                          style={{
                            padding: 12,
                            fontWeight: !a.is_read ? '700' : 'normal',
                            fontSize: 15
                          }}
                        >
                          <div
                            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#1e293b' }}
                            onClick={() => {
                              const isInfo = (a.status || '').toLowerCase() === 'completed' || (a.status || '').toLowerCase() === 'closed'
                              navigate(`/staff/notices?assessee=${encodeURIComponent(a?.assessee_name || a?.user || a?.user_name || '')}&uid=${a?.client_id || ''}&tab=${isInfo ? 'info' : 'action'}`, { state: { assesseeName: a?.assessee_name || a?.user || a?.user_name || '', assesseeId: a?.client_id } })
                            }}
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
                            fontSize: 15  
                          }}
                          onClick={() => {
                            const isInfo = (a.status || '').toLowerCase() === 'completed' || (a.status || '').toLowerCase() === 'closed'
                            navigate(`/staff/notices?assessee=${encodeURIComponent(a?.assessee_name || a?.user || a?.user_name || '')}&uid=${a?.client_id || ''}&tab=${isInfo ? 'info' : 'action'}`, { state: { assesseeName: a?.assessee_name || a?.user || a?.user_name || '', assesseeId: a?.client_id } })
                          }}
                        >
                          {a.proceeding_name}
                        </td>

                        {/* PROFESSIONAL NAME */}
                        <td
                          style={{
                            padding: 12,
                            color: '#2563eb',
                            fontWeight: !a.is_read ? '600' : 'normal',
                            fontSize: 15
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
                            fontSize: 15
                          }}
                        >
                          {a.assessment_year || 'N/A'}
                        </td>

                        {/* ISSUED */}
                        <td style={{ padding: 12, fontWeight: !a.is_read ? '600' : 'normal', fontSize: 15 }}>
                          {formatDate(a.issued_on)}
                        </td>

                        {/* DUE */}
                        <td
                          style={{
                            padding: 12,
                            color: '#dc2626',
                            fontWeight: !a.is_read ? '700' : 'normal',
                            fontSize: 15
                          }}
                        >
                          {formatDate(a.due_date)}
                        </td>

                        {/* NOTICE CONTROL */}
                        <td style={{ padding: '8px 6px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              
                              {/* Block Dropdown */}
                              <div className="notice-control-dropdown" style={{ position: 'relative' }}>
                                <button
                                  onClick={() => setYearDropdownOpen(yearDropdownOpen === (a.client_id || index) ? null : (a.client_id || index))}
                                  style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff', fontSize: 12, cursor: 'pointer', color: '#1e293b', minWidth: 70, textAlign: 'left', whiteSpace: 'nowrap' }}
                                >
                                  {selYrs.length > 0 ? `${selYrs.length} selected` : 'Years ▾'}
                                </button>
                                {yearDropdownOpen === (a.client_id || index) && (
                                  <>
                                    <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: 130, marginTop: 4, maxHeight: 180, overflowY: 'auto' }}>
                                      {availableForDropdown.length === 0 ? (
                                        <div style={{ padding: '8px 10px', fontSize: 10, color: '#94a3b8' }}>All years blocked</div>
                                      ) : (
                                        availableForDropdown.map(year => (
                                          <label key={year} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', fontSize: 12, cursor: 'pointer', borderBottom: '0.5px solid #f1f5f9' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                          >
                                            <input type="checkbox" checked={selYrs.includes(year)} onChange={() => toggleYearSelection(a.client_id, year)} style={{ accentColor: '#1e3a8a', cursor: 'pointer' }} />
                                            {year}
                                          </label>
                                        ))
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                              
                              <button
                                onClick={() => handleBlockYearsClick(a.client_id)}
                                disabled={selYrs.length === 0}
                                style={{ padding: '4px 10px', background: selYrs.length > 0 ? '#dc2626' : '#f3f4f6', color: selYrs.length > 0 ? '#fff' : '#94a3b8', border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 600, cursor: selYrs.length > 0 ? 'pointer' : 'default' }}
                              >
                                Block
                              </button>

                              {/* Unblock Dropdown */}
                              {hasBlocked && (
                                <div className="notice-control-dropdown" style={{ position: 'relative' }}>
                                  <button
                                    onClick={() => setUnblockDropdownOpen(unblockDropdownOpen === (a.client_id || index) ? null : (a.client_id || index))}
                                    style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff', fontSize: 12, cursor: 'pointer', color: '#1e293b', minWidth: 70, textAlign: 'left', whiteSpace: 'nowrap' }}
                                  >
                                    {selUnblockYrs.length > 0 ? `${selUnblockYrs.length} selected` : 'Unblock ▾'}
                                  </button>
                                  {unblockDropdownOpen === (a.client_id || index) && (
                                    <>
                                      <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: 130, marginTop: 4, maxHeight: 180, overflowY: 'auto' }}>
                                        {blockedYrs.map(year => (
                                          <label key={year} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', fontSize: 12, cursor: 'pointer', borderBottom: '0.5px solid #f1f5f9' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                          >
                                            <input type="checkbox" checked={selUnblockYrs.includes(year)} onChange={() => toggleUnblockYearSelection(a.client_id, year)} style={{ accentColor: '#16a34a', cursor: 'pointer' }} />
                                            {year}
                                          </label>
                                        ))}
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}

                              {hasBlocked && (
                                <button
                                  onClick={() => handleUnblockYearsClick(a.client_id)}
                                  disabled={selUnblockYrs.length === 0}
                                  style={{ padding: '4px 10px', background: selUnblockYrs.length > 0 ? '#16a34a' : '#f3f4f6', color: selUnblockYrs.length > 0 ? '#fff' : '#94a3b8', border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 600, cursor: selUnblockYrs.length > 0 ? 'pointer' : 'default' }}
                                >
                                  Unblock
                                </button>
                              )}
                            </div>

                            {/* Selected to block chips */}
                            {selYrs.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                                {selYrs.map(y => (
                                  <span key={y} style={{ background: '#eff6ff', color: '#1e3a8a', borderRadius: 4, fontSize: 9, padding: '2px 6px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                    {y}
                                    <button onClick={() => toggleYearSelection(a.client_id, y)} style={{ background: 'none', border: 'none', color: '#1e3a8a', cursor: 'pointer', padding: 0, fontSize: 9, display: 'flex', alignItems: 'center' }}>×</button>
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Selected to unblock chips */}
                            {selUnblockYrs.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                                {selUnblockYrs.map(y => (
                                  <span key={y} style={{ background: '#f0fdf4', color: '#166534', borderRadius: 4, fontSize: 9, padding: '2px 6px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                    {y}
                                    <button onClick={() => toggleUnblockYearSelection(a.client_id, y)} style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer', padding: 0, fontSize: 9, display: 'flex', alignItems: 'center' }}>×</button>
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Blocked years display */}
                            {hasBlocked && (
                              <div style={{ fontSize: 9, color: '#dc2626', marginTop: 1 }}>
                                <span style={{ fontWeight: 700 }}>Blocked: </span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 2 }}>
                                  {blockedYrs.map(y => (
                                    <span key={y} style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 4, fontSize: 9, padding: '2px 6px', fontWeight: 600 }}>{y}</span>
                                  ))}
                                </div>
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
                              fontSize: 15
                            }}
                          >
                            VIEW NOTICE
                          </button>

                        </td>

                      </tr>

                    )
                  })

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

      {/* CONFIRMATION POPUP MODAL */}
      {confirmModal.isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 20
        }}>
          <div style={{
            background: '#fff', borderRadius: 12, padding: 24, width: '100%', maxWidth: 400,
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            position: 'relative'
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: '0 0 12px 0' }}>
              Confirm Action
            </h3>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              {confirmModal.type === 'block'
                ? `You are about to block selected year(s): ${confirmModal.years.join(', ')}`
                : `You are about to unblock selected year(s): ${confirmModal.years.join(', ')}`
              }
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmModal({ isOpen: false, type: '', clientId: null, years: [] })}
                style={{
                  padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  border: '1px solid #cbd5e1', background: '#fff', color: '#475569'
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const { type, clientId, years } = confirmModal;
                  if (type === 'block') {
                    await handleBlockYears(clientId, years);
                  } else {
                    await handleUnblockYears(clientId, years);
                  }
                  setConfirmModal({ isOpen: false, type: '', clientId: null, years: [] });
                }}
                style={{
                  padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  border: 'none',
                  background: confirmModal.type === 'block' ? '#dc2626' : '#16a34a',
                  color: '#fff'
                }}
              >
                {confirmModal.type === 'block' ? 'Confirm Block' : 'Confirm Unblock'}
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  )
}