import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Search, Filter, FileText, Mail, Scale, Eye, Check, ArrowLeft } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { noticeService, professionalService } from '../../services'

const statusBadge = (status = '') => {
  const s = (status || '').toLowerCase().trim()
  const styles = {
    'in progress': { background: '#eff6ff', color: '#1d4ed8', border: '0.5px solid #bfdbfe' },
    'pending': { background: '#fffbeb', color: '#92400e', border: '0.5px solid #fcd34d' },
    'completed': { background: '#f0fdf4', color: '#166534', border: '0.5px solid #bbf7d0' },
    'submitted': { background: '#fefce8', color: '#92400e', border: '0.5px solid #fef08a' },
    'closed': { background: '#f0fdf4', color: '#166534', border: '0.5px solid #bbf7d0' },
  }
  const style = styles[s] || { background: '#f1f5f9', color: '#475569', border: '0.5px solid #cbd5e1' }
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'N/A'
  return (
    <span style={{ ...style, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>{label}</span>
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
  const [actionProceedings, setActionProceedings] = useState([])
  const [infoProceedings, setInfoProceedings] = useState([])
  const [loading, setLoading] = useState(true)
  const location = useLocation()
  const defaultTab = new URLSearchParams(location.search).get('tab') || 'action'
  const [activeTab, setActiveTab] = useState(defaultTab)

  const [selectedProceeding, setSelectedProceeding] = useState(null)
  const [proceedingNotices, setProceedingNotices] = useState([])
  const [loadingNotices, setLoadingNotices] = useState(false)
  const [noticesError, setNoticesError] = useState(null)

  useEffect(() => {
    const tabParam = new URLSearchParams(location.search).get('tab')
    if (tabParam && (tabParam === 'action' || tabParam === 'info')) {
      setActiveTab(tabParam)
    }
  }, [location.search])
  
  // Filter States
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [searchFields, setSearchFields] = useState({ pan: '', name: '', act: '' })
  const [filters, setFilters] = useState({
    status: '',
    act: '',
    limitationFrom: '',
    limitationTo: '',
    issuedFrom: '',
    issuedTo: ''
  })
  const [appliedFilters, setAppliedFilters] = useState({
    status: '',
    act: '',
    limitationFrom: '',
    limitationTo: '',
    issuedFrom: '',
    issuedTo: ''
  })

  const navigate = useNavigate()
  const role = localStorage.getItem('role')?.toLowerCase()

  const params = new URLSearchParams(location.search)
  const filterAssessee = location.state?.assesseeName || params.get('assessee')
  const filterPan = location.state?.assesseePan || params.get('pan')
  const filterUid = location.state?.assesseeId || params.get('uid')
  const proceedings = activeTab === 'action' ? actionProceedings : infoProceedings

  const normalizeProceeding = (p) => {
    const name = p.proceeding_name || p.proceeding_type || p.notice_type || 'Notice'
    let timeline = []

    if (Array.isArray(p.tracker_entries)) {
      timeline = p.tracker_entries.map(t => ({
        date: t.date || t.created_at || t.activity_date,
        label: t.status || t.label || t.activity_title,
        comment: t.comment || t.notes || t.remarks || t.activity_description,
        type: ((t.status || '').toLowerCase() === 'completed' || (t.status || '').toLowerCase() === 'closed' ? 'done' : 'open')
      }))
    } else if (Array.isArray(p.timeline)) {
      timeline = p.timeline.map(t => ({
        date: t.date || t.created_at || t.activity_date,
        label: t.label || t.status || t.activity_title,
        comment: t.comment || t.notes || t.remarks || t.activity_description,
        type: ((t.status || '').toLowerCase() === 'completed' || (t.status || '').toLowerCase() === 'closed' ? 'done' : 'open')
      }))
    } else if (Array.isArray(p.status_history)) {
      timeline = p.status_history.map(t => ({
        date: t.date || t.created_at || t.activity_date,
        label: t.status || t.label || t.activity_title,
        comment: t.comment || t.notes || t.remarks || t.activity_description,
        type: ((t.status || '').toLowerCase() === 'completed' || (t.status || '').toLowerCase() === 'closed' ? 'done' : 'open')
      }))
    } else {
      timeline = []
    }

    const resolvedAssessee = p.assessee_name || p.user_name || p.client_name || p.user?.name || p.client?.name || p.user?.full_name || p.client?.full_name || p.user?.username || p.client?.username || (typeof p.user === 'string' ? p.user : '') || (typeof p.client === 'string' ? p.client : '') || p.name || 'N/A';
    const resolvedPan = p.pan || p.pan_number || p.user_pan || p.user?.pan || p.client?.pan || 'N/A';
    const resolvedUserId = String(p.user_id || p.userId || p.client_id || p.clientId || p.user?.id || p.client?.id || '');

    return {
      id: p.id || p.proceeding_id || p.notice_id || String(Math.random()),
      proceeding_name: name,
      assessment_year: p.assessment_year || p.financial_year || p.year || p.assessmentYear || p.ay || 'N/A',
      status: p.status || '',
      limitation_date: p.limitation_date || p.proceeding_limitation_date || '—',
      closure_date: p.closure_date || '—',
      financial_year: p.financial_year || 'N/A',
      closure_order: p.closure_order || '—',
      applicable_act: p.applicable_act || 'Income Tax Act 1961',
      pan: resolvedPan,
      assessee_name: resolvedAssessee,
      user_id: resolvedUserId,
      notices_count: p.notices_count || 1,
      timeline: timeline
    }
  }

  const extractProceedings = (res) => {
    let raw = []
    if (Array.isArray(res?.data?.data)) raw = res.data.data
    else if (Array.isArray(res?.data?.results)) raw = res.data.results
    else if (Array.isArray(res?.data?.proceedings)) raw = res.data.proceedings
    else if (Array.isArray(res?.data?.items)) raw = res.data.items
    else if (Array.isArray(res?.data)) raw = res.data
    else if (Array.isArray(res?.results)) raw = res.results
    else if (Array.isArray(res?.proceedings)) raw = res.proceedings
    else if (Array.isArray(res?.items)) raw = res.items
    else if (Array.isArray(res)) raw = res
    else if (res && typeof res === 'object') {
      const searchObj = res.data && typeof res.data === 'object' ? res.data : res
      for (const key of Object.keys(searchObj)) {
        if (Array.isArray(searchObj[key])) {
          raw = searchObj[key]
          break
        }
      }
    }
    return Array.isArray(raw) ? raw : []
  }

  const handleProceedingClick = async (p) => {
    setNoticesError(null)
    setLoadingNotices(true)
    try {
      const res = await professionalService.getProceedingNoticesById(p.id)
      const raw = extractProceedings(res)
      if (raw && raw.length > 0) {
        const firstNoticeId = raw[0].id || raw[0].notice_id
        navigate(`/staff/notice-orders/${firstNoticeId}`)
      } else {
        alert('No notices available for this proceeding')
      }
    } catch (err) {
      console.error('Failed to fetch proceeding notices:', err)
      setNoticesError('Unable to load notices. Please try again.')
    } finally {
      setLoadingNotices(false)
    }
  }

  useEffect(() => {
    setLoading(true)

    const fetchActionData = async () => {
      try {
        const queryParams = {}
        if (filterUid) queryParams.client_id = filterUid
        else if (filterAssessee) queryParams.client_name = filterAssessee

        const res = await professionalService.getProceedingsForAction(queryParams)
        const raw = extractProceedings(res)
        setActionProceedings(raw.map(normalizeProceeding))
      } catch (err) {
        console.error('Action API error:', err)
        setActionProceedings([])
      }
    }

    const fetchInformationData = async () => {
      try {
        const queryParams = {}
        if (filterUid) queryParams.client_id = filterUid
        else if (filterAssessee) queryParams.client_name = filterAssessee

        const res = await professionalService.getProceedingsForInformation(queryParams)
        const raw = extractProceedings(res)
        setInfoProceedings(raw.map(normalizeProceeding))
      } catch (err) {
        console.error('Information API error:', err)
        setInfoProceedings([])
      }
    }

    Promise.all([fetchActionData(), fetchInformationData()])
      .finally(() => setLoading(false))
  }, [filterUid, filterAssessee])

  const iconFor = (name = '') => {
    if (name.toLowerCase().includes('appeal')) return (<Scale size={15} color="#7c3aed" />)
    if (name.toLowerCase().includes('letter')) return (<Mail size={15} color="#d97706" />)
    return (<FileText size={15} color="#2563eb" />)
  }

  const statusFor = (p) => {
    return p.status || ''
  }

  const isProfessionalOrAdmin = role === 'professional' || role === 'admin'

  let actionList = actionProceedings
  let infoList = infoProceedings

  if (filterAssessee || filterPan || filterUid) {
    const nameText = String(filterAssessee || '').trim().toLowerCase()
    const panText = String(filterPan || '').trim().toLowerCase()
    const uidText = String(filterUid || '').trim()

    const matchesProceed = (p) => {
      // 1. Match by user_id (most precise)
      if (uidText && p.user_id && String(p.user_id).trim() === uidText) return true
      // 2. Match by PAN
      if (panText && panText !== 'n/a') {
        const pPan = String(p.pan || '').trim().toLowerCase()
        if (pPan && pPan !== 'n/a' && pPan === panText) return true
      }
      // 3. Match by name
      if (nameText) {
        const pName = String(p.assessee_name || '').trim().toLowerCase()
        if (pName && pName !== 'n/a' && (pName.includes(nameText) || nameText.includes(pName))) return true
      }
      return false
    }

    const filteredAction = actionList.filter(matchesProceed)
    const filteredInfo = infoList.filter(matchesProceed)

    // Fallback: if the API doesn't embed user info per proceeding (all assessee_name = N/A),
    // show ALL proceedings since the API may already be scoped to the right user.
    const allActionNoUser = actionList.every(p => !p.user_id && (p.assessee_name === 'N/A' || !p.assessee_name) && (p.pan === 'N/A' || !p.pan))
    const allInfoNoUser = infoList.every(p => !p.user_id && (p.assessee_name === 'N/A' || !p.assessee_name) && (p.pan === 'N/A' || !p.pan))

    actionList = (filteredAction.length === 0 && allActionNoUser) ? actionList : filteredAction
    infoList = (filteredInfo.length === 0 && allInfoNoUser) ? infoList : filteredInfo
  }

  // Apply Search & Filters
  const applyFiltersAndSearch = (list) => {
    return list.filter(p => {
      // Search
      const panMatch = !searchFields.pan || (p.pan || '').toLowerCase().includes(searchFields.pan.toLowerCase().trim())
      const nameMatch = !searchFields.name || (p.assessee_name || '').toLowerCase().includes(searchFields.name.toLowerCase().trim())
      const actMatch = !searchFields.act || (p.applicable_act || '').toLowerCase().includes(searchFields.act.toLowerCase().trim())
      
      // Filters
      const statusMatch = !appliedFilters.status || (p.status || '').toLowerCase() === appliedFilters.status.toLowerCase()
      const filterActMatch = !appliedFilters.act || (p.applicable_act || '').toLowerCase().includes(appliedFilters.act.toLowerCase())
      
      let limitationMatch = true
      if (appliedFilters.limitationFrom && appliedFilters.limitationTo && p.limitation_date && p.limitation_date !== '—') {
        const itemDate = new Date(p.limitation_date)
        const fromDate = new Date(appliedFilters.limitationFrom)
        const toDate = new Date(appliedFilters.limitationTo)
        if (!isNaN(itemDate) && !isNaN(fromDate) && !isNaN(toDate)) {
          limitationMatch = itemDate >= fromDate && itemDate <= toDate
        }
      }
      
      let issuedMatch = true
      // Notice Issue Date is usually the first timeline date or we check all timeline events
      if (appliedFilters.issuedFrom && appliedFilters.issuedTo && p.timeline && p.timeline.length > 0) {
        const issuedDateStr = p.timeline[0].date
        if (issuedDateStr && issuedDateStr !== '—') {
          const itemDate = new Date(issuedDateStr)
          const fromDate = new Date(appliedFilters.issuedFrom)
          const toDate = new Date(appliedFilters.issuedTo)
          if (!isNaN(itemDate) && !isNaN(fromDate) && !isNaN(toDate)) {
            issuedMatch = itemDate >= fromDate && itemDate <= toDate
          }
        }
      }
      
      return panMatch && nameMatch && actMatch && statusMatch && filterActMatch && limitationMatch && issuedMatch
    })
  }

  const currentList = activeTab === 'action' ? actionList : infoList
  const filteredList = applyFiltersAndSearch(currentList)

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Dashboard', path: '/staff/dashboard' }, { label: 'Notices' }]}>
      <div style={{ padding: '16px 20px' }}>
        <div style={{ marginBottom: 20 }}>
          {/* Back button */}
          <button
            onClick={() => {
              if (window.history.length > 2) {
                navigate(-1)
              } else {
                const r = localStorage.getItem('role')
                navigate(r === 'professional' ? '/professional-dashboard' : r === 'admin' ? '/admin/dashboard' : '/staff/dashboard')
              }
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 13, marginBottom: 10, padding: 0 }}
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
          <h2 style={{ fontSize: 25, fontWeight: 600, color: '#1e293b', marginBottom: 12 }}>e-Proceeding</h2>
        </div>

        {selectedProceeding ? (
          <div>
            <div style={{ marginBottom: 20 }}>
              <button
                onClick={() => {
                  setSelectedProceeding(null)
                  setProceedingNotices([])
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', fontSize: 13, padding: 0 }}
              >
                <ArrowLeft size={14} /> Back to Proceedings
              </button>
            </div>
            
            <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 10, padding: 24, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <div style={{ marginBottom: 24, borderBottom: '1px solid #e2e8f0', paddingBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>Notices for {selectedProceeding.proceeding_name}</h3>
                <p style={{ fontSize: 14, color: '#64748b' }}>Client: {selectedProceeding.assessee_name}</p>
              </div>

              {loadingNotices ? (
                <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>Loading notices...</div>
              ) : noticesError ? (
                <div style={{ textAlign: 'center', padding: 48, color: '#ef4444' }}>{noticesError}</div>
              ) : proceedingNotices.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>No notices available for this proceeding</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Reference ID</th>
                        <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Notice Type</th>
                        <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Notice Category</th>
                        <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Issued Date</th>
                        <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proceedingNotices.map((n, i) => (
                        <tr 
                          key={n.id || n.notice_id || i}
                          onClick={() => navigate(`/staff/notice-orders/${n.id || n.notice_id}`)}
                          style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '16px', fontSize: 14, color: '#1e293b', fontWeight: 500 }}>{n.reference_id || 'N/A'}</td>
                          <td style={{ padding: '16px', fontSize: 14, color: '#475569' }}>{n.notice_type || n.notice_name || 'N/A'}</td>
                          <td style={{ padding: '16px', fontSize: 14, color: '#475569' }}>{n.notice_category || 'N/A'}</td>
                          <td style={{ padding: '16px', fontSize: 14, color: '#475569' }}>{n.issued_on || 'N/A'}</td>
                          <td style={{ padding: '16px' }}>{statusBadge(n.status || n.workflow_status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
        {/* Search + Filter */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 14, gap: 12 }}>
          <div className="notices-search-container" style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 12px', background: '#fff' }}>
            <Search size={14} color="#94a3b8" />
            <input placeholder="PAN..." value={searchFields.pan} onChange={e => setSearchFields({...searchFields, pan: e.target.value})} className="notices-search-input" style={{ border: 'none', outline: 'none', fontSize: 13, color: '#1e293b', background: 'transparent', width: '100%', maxWidth: 120 }} />
            <div style={{ width: 1, height: 16, background: '#e2e8f0' }} />
            <input placeholder="Name of Assessee..." value={searchFields.name} onChange={e => setSearchFields({...searchFields, name: e.target.value})} className="notices-search-input" style={{ border: 'none', outline: 'none', fontSize: 13, color: '#1e293b', background: 'transparent', width: '100%', maxWidth: 140 }} />
            <div style={{ width: 1, height: 16, background: '#e2e8f0' }} />
            <input placeholder="Applicable Act..." value={searchFields.act} onChange={e => setSearchFields({...searchFields, act: e.target.value})} className="notices-search-input" style={{ border: 'none', outline: 'none', fontSize: 13, color: '#1e293b', background: 'transparent', width: '100%', maxWidth: 120 }} />
          </div>
          <button 
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#fff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, cursor: 'pointer' }}
          >
            <Filter size={14} /> Filter
          </button>
        </div>

        {/* Filter Panel */}
        {showFilterPanel && (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {/* Proceeding Status */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Proceeding Status</label>
                <select 
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, color: '#1e293b' }}
                >
                  <option value="">All Statuses</option>
                  <option value="open">Open/Pending</option>
                  <option value="closed">Closed</option>
                  <option value="submitted">Submitted</option>
                </select>
              </div>
              
              {/* Applicable Act */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Applicable Act</label>
                <select 
                  value={filters.act}
                  onChange={(e) => setFilters({...filters, act: e.target.value})}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, color: '#1e293b' }}
                >
                  <option value="">All Acts</option>
                  <option value="1961">Income Tax Act 1961</option>
                  <option value="2025">Income Tax Act 2025</option>
                </select>
              </div>

              {/* Proc Limitation Date */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Limitation Date (From - To)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="date" value={filters.limitationFrom} onChange={(e) => setFilters({...filters, limitationFrom: e.target.value})} style={{ width: '50%', padding: '7px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }} />
                  <input type="date" value={filters.limitationTo} onChange={(e) => setFilters({...filters, limitationTo: e.target.value})} style={{ width: '50%', padding: '7px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }} />
                </div>
              </div>

              {/* Notice Issued Date */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Notice Issued Date (From - To)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="date" value={filters.issuedFrom} onChange={(e) => setFilters({...filters, issuedFrom: e.target.value})} style={{ width: '50%', padding: '7px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }} />
                  <input type="date" value={filters.issuedTo} onChange={(e) => setFilters({...filters, issuedTo: e.target.value})} style={{ width: '50%', padding: '7px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }} />
                </div>
              </div>
            </div>

            {/* Filter Actions */}
            <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setAppliedFilters(filters)}
                style={{ padding: '8px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
              >
                Apply
              </button>
              <button
  onClick={() => {
    const r = { status: '', act: '', limitationFrom: '', limitationTo: '', issuedFrom: '', issuedTo: '' }
    setFilters(r)
    setAppliedFilters(r)
  }}
  style={{ padding: '8px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.2s' }}
  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
>
  Clear
</button>
              <button
  onClick={() => setShowFilterPanel(false)}
  style={{ padding: '8px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.2s' }}
  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
>
  Cancel
</button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1.5px solid #e2e8f0', marginBottom: 16 }}>
          {[['action', `For your Action (${actionList.length})`], ['info', `For your Information (${infoList.length})`]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{ padding: '8px 16px', fontSize: 14, fontWeight: activeTab === key ? 500 : 400, color: activeTab === key ? '#2563eb' : '#64748b', border: 'none', background: 'none', cursor: 'pointer', borderBottom: activeTab === key ? '2px solid #2563eb' : '2px solid transparent', marginBottom: -1.5 }}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>Loading proceedings...</div>
        ) : filteredList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>No proceedings found.</div>
        ) : (
          filteredList.map((p, idx) => {
            if (activeTab === 'info') {
              return (
                <div key={p.id} style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
                  {/* Info Header */}
                  <div style={{ background: '#f1f5f9', borderBottom: '0.5px solid #e2e8f0', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, color: '#64748b' }}>Proceeding Name :</span>
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#1e293b' }}>
                        {p.proceeding_name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, color: '#64748b' }}>Assessment Year :</span>
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#1e293b' }}>{p.assessment_year}</span>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="info-grid-row" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 2fr 1.5fr' }}>
                    {/* Col 1: PAN & Assessee */}
                    <div style={{ padding: '16px 20px', borderRight: '0.5px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>PAN</p>
                        <p style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{p.pan}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>Name of Assessee</p>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', lineHeight: 1.3 }}>
                          {p.assessee_name}
                        </p>
                      </div>
                    </div>

                    {/* Col 2: Timeline */}
                    <div style={{ padding: '16px 20px', borderRight: '0.5px solid #e2e8f0' }}>
                      <div style={{ position: 'relative', paddingLeft: 22, maxHeight: 300, overflowY: 'auto', scrollBehavior: 'smooth' }}>
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
                              <p style={{ fontSize: 14, fontWeight: 600, color: '#334155', lineHeight: '1.2' }}>{t.date}</p>
                              <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{t.label}</p>
                              {t.comment && <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{t.comment}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Col 3: Details List */}
                    <div style={{ padding: '16px 20px', borderRight: '0.5px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
                      <p style={{ fontSize: 13, color: '#64748b' }}>
                        Proceeding Limitation Date : <span style={{ fontWeight: 600, color: '#334155' }}>{p.limitation_date}</span>
                      </p>
                      <p style={{ fontSize: 13, color: '#64748b' }}>
                        Proceeding Closure Date : <span style={{ fontWeight: 600, color: '#334155' }}>{p.closure_date}</span>
                      </p>
                      <p style={{ fontSize: 13, color: '#64748b' }}>
                        Financial Year : <span style={{ fontWeight: 600, color: '#334155' }}>{p.financial_year}</span>
                      </p>
                      <p style={{ fontSize: 13, color: '#64748b' }}>
                        Proceeding Closure Order : <span style={{ fontWeight: 600, color: '#1d4ed8', fontFamily: 'monospace' }}>{p.closure_order}</span>
                      </p>
                      <p style={{ fontSize: 13, color: '#64748b' }}>
                        Applicable Act : <span style={{ fontWeight: 600, color: '#334155' }}>{p.applicable_act}</span>
                      </p>
                    </div>

                    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
                      <button 
                        onClick={() => handleProceedingClick(p)}
                        style={{ 
                          padding: '9px 16px', 
                          background: '#1e3a8a', 
                          color: '#fff', 
                          border: 'none', 
                          borderRadius: 6, 
                          fontSize: 13, 
                          fontWeight: 600, 
                          cursor: 'pointer',
                          width: '100%',
                          transition: 'background-color 0.2s',
                          textAlign: 'center'
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
                    <span style={{ fontSize: 13, color: '#64748b' }}>Proceeding Name :</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#1e293b' }}>
                      {p.proceeding_name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, color: '#64748b' }}>Assessment Year :</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#1e293b' }}>{p.assessment_year}</span>
                    <span style={{ marginLeft: 6 }}>{p.status && statusBadge(p.status)}</span>
                  </div>
                </div>

                <div className="action-grid-row" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr' }}>
                  {/* Col 1 - PAN, Assessee & Timeline */}
                  <div style={{ padding: '16px 20px', borderRight: '0.5px solid #e2e8f0', display: 'flex', gap: 20 }}>
                    {/* PAN & Assessee beside timeline */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 120 }}>
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>PAN</p>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', fontFamily: 'monospace' }}>{p.pan || '—'}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>Name of Assessee</p>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', lineHeight: 1.3 }}>{p.assessee_name || '—'}</p>
                      </div>
                    </div>

                    {/* Activity Timeline */}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 14 }}>Activity Timeline</p>
                      <div style={{ maxHeight: 150, overflowY: 'auto', paddingRight: 8 }}>
                        {(p.timeline || []).map((t, ti) => (
                          <div key={ti} style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: ti === p.timeline.length - 1 ? 0 : 12 }}>
                            {t.label && <span style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{t.label}</span>}
                            {t.date && <span style={{ fontSize: 12, color: '#64748b' }}>{t.date}</span>}
                            {t.comment && <span style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>{t.comment}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Col 2 - Details */}
                  <div style={{ padding: '16px 20px', borderRight: '0.5px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {p.limitation_date && p.limitation_date !== '-' && (
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>Proceeding Limitation Date</p>
                        <p style={{ fontSize: 14, fontWeight: 500, color: '#334155' }}>{p.limitation_date}</p>
                      </div>
                    )}
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>Financial Year</p>
                      <p style={{ fontSize: 14, fontWeight: 500, color: '#334155' }}>{p.financial_year}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>Applicable Act</p>
                      <p style={{ fontSize: 14, fontWeight: 500, color: '#334155' }}>{p.applicable_act || 'Income Tax Act 1961'}</p>
                    </div>
                  </div>

                  {/* Col 3 - Action */}
                  <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center', alignItems: 'center' }}>
                      <button 
                        onClick={() => handleProceedingClick(p)}
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
                        fontSize: 13, 
                        fontWeight: 600, 
                        cursor: 'pointer',
                        width: '100%',
                        maxWidth: 220,
                        textAlign: 'center',
                        lineHeight: '1.4'
                      }}
                    >
                      <span>View Notices/Orders ({p.notices_count || 0})</span>
                    </button>

                  </div>
                </div>
              </div>
            );
          })
        )}

        <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center', padding: '4px 0' }}>
          Showing {proceedings.length} proceedings
        </p>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
