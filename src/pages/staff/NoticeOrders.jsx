import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Filter, FileText, FileType } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { noticeService, professionalWorkflowService } from '../../services'
import { useAuth } from '../../context/AuthContext'


const statusBadge = (status = 'pending') => {
  const map = {
    pending: { bg: '#fffbeb', color: '#92400e', border: '#fcd34d', label: 'Pending' },
    'pending action': { bg: '#fffbeb', color: '#92400e', border: '#fcd34d', label: 'Pending' },
    'in progress': { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', label: 'In Progress' },
    completed: { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0', label: 'Completed' },
  }
  const s = map[status.toLowerCase()] || map.pending
  return (
    <span style={{ background: s.bg, color: s.color, border: `0.5px solid ${s.border}`, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>
      {s.label}
    </span>
  )
}

export default function NoticeOrders() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [notices, setNotices] = useState([])
  const [proceeding, setProceeding] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [filters, setFilters] = useState({ section: '', referenceId: '', date: '' })
  const [appliedFilters, setAppliedFilters] = useState({ section: '', referenceId: '', date: '' })
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [activeNotice, setActiveNotice] = useState(null)
  const [showAdjournmentModal, setShowAdjournmentModal] = useState(false)
  const [activeNoticeForAdjournment, setActiveNoticeForAdjournment] = useState(null)

  const { user } = useAuth()
  const role = localStorage.getItem('role')?.toLowerCase() || user?.role?.toLowerCase() || 'staff'
  const isProfessional = role === 'professional'

  const [isEditMode, setIsEditMode] = useState(false)
  const [workflowSaving, setWorkflowSaving] = useState(false)
  const [officerName, setOfficerName] = useState("")
  const [officerInfo, setOfficerInfo] = useState("")
  const [assignedCaseTitle, setAssignedCaseTitle] = useState("")
  const [deadline, setDeadline] = useState("")
  const [department, setDepartment] = useState("")
  const [statusText, setStatusText] = useState("In Progress")

  const [assignedNotes, setAssignedNotes] = useState("")
  const [reviewingNotes, setReviewingNotes] = useState("")
  const [approvedNotes, setApprovedNotes] = useState("")
  const [closedNotes, setClosedNotes] = useState("")
  
  const [origAssigned, setOrigAssigned] = useState("")
  const [origReviewing, setOrigReviewing] = useState("")
  const [origApproved, setOrigApproved] = useState("")
  const [origClosed, setOrigClosed] = useState("")
  
  const [activities, setActivities] = useState([])
  
  const [activityNote, setActivityNote] = useState("")
  const [activityTitle, setActivityTitle] = useState("")

  const [responseDetails, setResponseDetails] = useState(null)
  const [adjournmentDetails, setAdjournmentDetails] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log('=== Fetching Notice Details for ID:', id)

        const res = await noticeService.getNoticeById(id)
        console.log('=== Full API Response:', res)
        
        if (res?.data) {
          const data = res.data
          console.log('=== Response data object:', data)
          console.log('=== notice_orders:', data.notice_orders)
          console.log('=== proceeding_details:', data.proceeding_details)
          
          // Handle both response formats:
          // Format 1: notice_orders array (new API structure)
          // Format 2: single notice object (fallback)
          let noticesList = []
          
          if (Array.isArray(data.notice_orders) && data.notice_orders.length > 0) {
            noticesList = data.notice_orders
            console.log('=== Using notice_orders array, count:', noticesList.length)
          } else if (Array.isArray(data.notices) && data.notices.length > 0) {
            noticesList = data.notices
            console.log('=== Using notices array, count:', noticesList.length)
          } else if (data.notice_id) {
            noticesList = [data]
            console.log('=== Using single notice from root data')
          } else {
            console.warn('=== No notices found in any format')
          }
          
          console.log('=== Final noticesList:', noticesList)
          setNotices(noticesList)
          
          // Extract proceeding info from proceeding_details or root level
          const procDetails = data.proceeding_details || data
          console.log('=== Using procDetails from:', data.proceeding_details ? 'proceeding_details' : 'root data')
          
          const procData = {
            proceedingName: procDetails.proceeding_name || data.proceeding_name || id || "N/A",
            pan: data.user_pan || procDetails.pan || data.pan || data.pan_number || "N/A",
            assesseeName: data.user_name || procDetails.assessee_name || data.assessee_name || data.user?.name || "N/A",
            assessmentYear: procDetails.assessment_year || data.assessment_year || "N/A",
            financialYear: procDetails.financial_year || data.financial_year || "N/A",
            applicableAct: procDetails.applicable_act || data.applicable_act || "Income Tax Act 1961"
          }
          console.log('=== Setting proceeding data:', procData)
          setProceeding(procData)
        } else {
          console.error('=== No data in response')
          setNotices([])
          setError('No data received from server')
        }
      } catch (err) {
        console.error('=== NoticeOrders fetch error:', err)
        console.error('=== Error message:', err?.message)
        console.error('=== Error details:', err)
        setNotices([])
        setError(err?.message || 'Failed to load notices')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id])

  // Fetch professional workflow data when viewing as professional
  useEffect(() => {
    if (!isProfessional || !id) return
    const fetchWorkflow = async () => {
      try {
        const res = await professionalWorkflowService.getWorkflow(id)
        const wf = res?.data
        if (!wf) return

        // Bind notice-level data
        if (wf.notice) {
          const n = wf.notice
          setAssignedCaseTitle(n.proceeding_name || n.description || '')
          setDeadline(n.response_due_date || n.issued_on || '')
          setStatusText(n.status || 'In Progress')
          setProceeding({
  proceedingName:
    wf.proceeding_details?.proceeding_name ||
    n.proceeding_name ||
    n.description ||
    id ||
    "N/A",

  pan:
    wf.user?.pan ||
    n.pan ||
    n.pan_number ||
    "N/A",

  assesseeName:
    wf.user?.name ||
    n.assessee_name ||
    "N/A",

  assessmentYear:
    wf.proceeding_details?.assessment_year ||
    n.assessment_year ||
    "N/A",

  financialYear:
    wf.proceeding_details?.financial_year ||
    n.financial_year ||
    "N/A",

  applicableAct:
    wf.proceeding_details?.applicable_act ||
    n.applicable_act ||
    "Income Tax Act 1961"
})


// DO NOT overwrite notices
setNotices(prev => {
  if (prev.length > 0) return prev

  return [{
    ...n,
    notice_id: n.id,
    reference_id: n.reference_id,
    issued_on: n.issued_on,
    response_due_date: n.response_due_date,
    description: n.description,
    status: n.status
  }]
})
          
        }

        // Bind workflow-level notes
        if (wf.workflow) {
          const w = wf.workflow
          setAssignedNotes(w.assigned_notes || '')
          setReviewingNotes(w.reviewing_notes || '')
          setApprovedNotes(w.approved_notes || '')
          setClosedNotes(w.closed_notes || '')
          
          setOrigAssigned(w.assigned_notes || '')
          setOrigReviewing(w.reviewing_notes || '')
          setOrigApproved(w.approved_notes || '')
          setOrigClosed(w.closed_notes || '')
          
          setStatusText(w.workflow_status || wf.notice?.status || 'In Progress')
        }

        // Bind activity
        if (wf.activity) {
          const aList = Array.isArray(wf.activity) ? wf.activity : [wf.activity]
          setActivities(aList.filter(Boolean))
          if (aList.length > 0) {
            setActivityNote(aList[0].description || aList[0].activity_description || '')
            setActivityTitle(aList[0].title || aList[0].activity_title || '')
          }
        }

        // Bind officer info from professional profile if available
        if (wf.professional) {
          const p = wf.professional
          setOfficerName(p.name || p.professional_name || '')
          setOfficerInfo(`${p.code || ''} · ${p.email || ''}`.replace(/^ · | · $/, ''))
          setDepartment(p.department || '')
        }
      } catch (err) {
        console.warn('Workflow fetch failed silently:', err)
      }
    }
    fetchWorkflow()
  }, [id, isProfessional])

  const handleSaveWorkflow = async () => {
    if (!id) return
    setWorkflowSaving(true)
    try {
      const newActivities = [...activities]
      const timestamp = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      let latestTitle = activityTitle
      
      if (assignedNotes !== origAssigned) {
        latestTitle = 'Assigned stage updated'
        newActivities.unshift({ title: latestTitle, date: timestamp })
      }
      if (reviewingNotes !== origReviewing) {
        latestTitle = 'Reviewing stage updated'
        newActivities.unshift({ title: latestTitle, date: timestamp })
      }
      if (approvedNotes !== origApproved) {
        latestTitle = 'Approved stage updated'
        newActivities.unshift({ title: latestTitle, date: timestamp })
      }
      if (closedNotes !== origClosed) {
        latestTitle = 'Closed stage updated'
        newActivities.unshift({ title: latestTitle, date: timestamp })
      }
      
      setActivities(newActivities)

      const payload = {
        workflow_status: statusText,
        assigned_notes: assignedNotes,
        reviewing_notes: reviewingNotes,
        approved_notes: approvedNotes,
        closed_notes: closedNotes,
        activity_title: latestTitle,
        activity_description: activityNote
      }
      await professionalWorkflowService.updateWorkflow(id, payload)
      
      setOrigAssigned(assignedNotes)
      setOrigReviewing(reviewingNotes)
      setOrigApproved(approvedNotes)
      setOrigClosed(closedNotes)
      
      setIsEditMode(false)
    } catch (err) {
      alert('Failed to save workflow changes.')
    } finally {
      setWorkflowSaving(false)
    }
  }

  const handleViewPdf = (n) => {
    try {
      const noticeId = n?.notice_id || n?.id
      if (noticeId) {
        noticeService.downloadNoticePdf(noticeId)
      } else {
        alert("PDF not found for this Notice ID")
      }
    } catch (e) {
      alert("Error downloading PDF")
    }
  }

  const extractSection = (desc) => {
    if (!desc) return '—'
    const m = String(desc).match(/\d+\(\d+\)|\d+[A-Z]?/) || []
    return m.length > 0 ? m[0] : '—'
  }

  const displayValue = (val) => (val !== null && val !== undefined && val !== '') ? val : '—'
  const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-IN') : '—'

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters })
    setShowFilterPanel(false)
  }

  const handleClearFilters = () => {
    setFilters({ section: '', referenceId: '', date: '' })
    setAppliedFilters({ section: '', referenceId: '', date: '' })
  }

  const handleViewResponse = async (item) => {
    setActiveNotice(item)
    setShowResponseModal(true)
    setModalLoading(true)
    try {
      const noticeId = item?.notice_id || item?.id
      const res = await noticeService.getResponse(noticeId)
      const payload = res?.data || {}
      setResponseDetails({
        notice_details: payload.notice_details || payload.noticeDetails || null,
        response_details: payload.response_details || payload.responseDetails || null
      })
    } catch (err) {
      console.warn("Fetch response details failed", err)
      setResponseDetails(null)
    } finally {
      setModalLoading(false)
    }
  }

  const handleAdjournment = async (item) => {
    setActiveNoticeForAdjournment(item)
    setShowAdjournmentModal(true)
    setModalLoading(true)
    try {
      const noticeId = item?.notice_id || item?.id
      const res = await noticeService.getAdjournment(noticeId)
      const payload = res?.data || {}
      setAdjournmentDetails({
        notice_details: payload.notice_details || payload.noticeDetails || null,
        adjournment_details: payload.adjournment_details || payload.adjournmentDetails || null
      })
    } catch (err) {
      console.warn("Fetch adjournment details failed", err)
      setAdjournmentDetails(null)
    } finally {
      setModalLoading(false)
    }
  }

  const filteredNotices = notices.filter(n => {
    const sectionVal = extractSection(n.description || '').toLowerCase()
    const matchesSection = !appliedFilters.section || sectionVal.includes(appliedFilters.section.toLowerCase())
    const refVal = (n.reference_id || '').toLowerCase()
    const matchesRef = !appliedFilters.referenceId || refVal.includes(appliedFilters.referenceId.toLowerCase())
    const matchesDate = !appliedFilters.date || (n.issued_on || '').includes(appliedFilters.date)
    return matchesSection && matchesRef && matchesDate
  })

  return (
    <DashboardLayout breadcrumbs={[
      { label: 'Dashboard', path: isProfessional ? '/professional-dashboard' : '/staff/dashboard' },
      { label: 'My Assignments', path: isProfessional ? '/professional-dashboard' : '/staff/dashboard' },
      { label: 'Notice Orders' }
    ]}>
      <div style={{ padding: '18px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5, cursor: 'pointer' }} onClick={() => navigate(isProfessional ? '/professional-dashboard' : '/staff/dashboard')}>
              <ArrowLeft size={13} color="#64748b" />
              <span style={{ fontSize: 12, color: '#64748b' }}>Back to assignments</span>
            </div>
            <h2 style={{ fontSize: 19, fontWeight: 500, color: '#1e293b' }}>Notice Orders</h2>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>View and manage notice proceedings and responses</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 22 }}>
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
              title="Filter notices"
            >
              <Filter size={18} color={showFilterPanel ? '#2563eb' : '#64748b'} />
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilterPanel && (
          <div style={{ padding: '12px 18px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>Section:</label>
              <input
                type="text"
                placeholder="e.g. 143(1)"
                value={filters.section}
                onChange={e => setFilters({ ...filters, section: e.target.value })}
                style={{ padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 12, outline: 'none', width: 140 }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>Ref ID:</label>
              <input
                type="text"
                placeholder="Reference ID"
                value={filters.referenceId}
                onChange={e => setFilters({ ...filters, referenceId: e.target.value })}
                style={{ padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 12, outline: 'none', width: 140 }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>Date:</label>
              <input
                type="date"
                value={filters.date}
                onChange={e => setFilters({ ...filters, date: e.target.value })}
                style={{ padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 12, outline: 'none', color: '#64748b', width: 140 }}
              />
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

        {/* Proceeding Details */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 10, fontWeight: 500, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 11 }}>Proceeding details</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0,1fr))', gap: 16 }}>
            {[
              { label: 'Proceeding Name', value: proceeding?.proceedingName || proceeding?.proceeding_name || "N/A" },
              { label: 'PAN', value: proceeding?.pan || proceeding?.pan_number || proceeding?.pan_number || "N/A", isBold: true },
              { label: 'Assessee Name', value: proceeding?.assesseeName || proceeding?.assessee_name || "N/A" },
              { label: 'Assessment Year', value: proceeding?.assessmentYear || proceeding?.assessment_year || "N/A" },
              { label: 'Financial Year', value: proceeding?.financialYear || proceeding?.financial_year || "N/A" },
              { label: 'Applicable Act', value: proceeding?.applicableAct || proceeding?.applicable_act || "Income Tax Act 1961" },
            ].map(({ label, value, isBold }) => (
              <div key={label}>
                <p style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>{label}</p>
                <p style={{ fontSize: 13, fontWeight: isBold ? 600 : 500, color: '#1e293b' }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 13, fontWeight: 500, color: '#1e293b', marginBottom: 11 }}>
          Notice orders <span style={{ color: '#64748b', fontWeight: 400, fontSize: 12 }}>· {filteredNotices.length} orders</span>
        </p>

        {error ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#dc2626', fontSize: 13, background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: 10 }}>
            {error}
          </div>
        ) : loading ? (
          <p style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>Loading notices...</p>
        ) : filteredNotices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b', fontSize: 13, background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 10 }}>
            No data available
          </div>
        ) : (
          filteredNotices.map((n, idx) => (
            <div key={n.id || n.notice_id || idx} style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ background: '#f8fafc', borderBottom: '0.5px solid #e2e8f0', padding: '9px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={15} color="#2563eb" />
                <p style={{ fontSize: 12, fontWeight: 500, color: '#1e293b', flex: 1 }}>
                  Reference ID: <span style={{ fontFamily: 'monospace', color: '#1d4ed8' }}>{n.reference_id || "—"}</span>
                </p>
                {statusBadge(n.status || (n.is_new ? 'pending' : 'completed'))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 110px' }}>
                <div style={{ padding: '14px 16px', borderRight: '0.5px solid #e2e8f0' }}>
                  <p style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>Section</p>
                  <p style={{ fontSize: 22, fontWeight: 500, color: '#1e293b', lineHeight: 1.1 }}>{n.section || extractSection(n.description) || "—"}</p>
                  <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Notice u/s</p>

                  <div style={{ marginTop: 16 }}>
                    <p style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>Description</p>
                    <p style={{ fontSize: 12, color: '#1e293b', lineHeight: 1.6, marginTop: 2 }}>{n.description || "—"}</p>
                  </div>
                </div>
                <div style={{ padding: '14px 16px', borderRight: '0.5px solid #e2e8f0' }}>
                  <p style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>Document reference ID</p>
                  <p style={{ fontSize: 11, color: '#1d4ed8', fontFamily: 'monospace', marginTop: 2, lineHeight: 1.5 }}>{n.document_reference_id || n.reference_id || "—"}</p>
                  <div style={{ marginTop: 16 }}>
                    <p style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>Issued on</p>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>{n.issued_on || "—"}</p>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <p style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>Response due</p>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#dc2626' }}>{n.response_due_date || n.due_date || "—"}</p>
                  </div>
                </div>
                <div style={{ padding: '14px 16px', borderRight: '0.5px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                  <p style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>Action</p>
                  <div style={{ marginTop: 22 }}>
                    <span
                      onClick={() => handleViewResponse(n)}
                      style={{ color: '#2563eb', cursor: 'pointer', fontSize: 12, fontWeight: 600, textDecoration: 'underline', display: 'inline-block' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#1d4ed8'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#2563eb'}
                    >
                      View Response
                    </span>
                  </div>
                  <div style={{ marginTop: 24 }}>
                    <span
                      onClick={() => handleAdjournment(n)}
                      style={{ color: '#2563eb', cursor: 'pointer', fontSize: 12, fontWeight: 600, textDecoration: 'underline', display: 'inline-block' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#1d4ed8'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#2563eb'}
                    >
                      Seek Adjournment
                    </span>
                  </div>
                </div>
                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
                  <button
                    onClick={() => handleViewPdf(n)}
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '6px 13px', background: '#fff', color: '#1e293b', border: '0.5px solid #e2e8f0', borderRadius: 7, fontSize: 11, cursor: 'pointer', fontWeight: 500 }}
                  >
                    <FileType size={13} /> View PDF
                  </button>
                </div>
              </div>
              {isProfessional && (
                <div style={{
                  borderTop: '0.5px solid #e2e8f0',
                  padding: '24px',
                  boxSizing: 'border-box',
                  background: '#fff'
                }}>
                  {/* Header Section */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: 0 }}>{officerName}</h3>
                        <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>{officerInfo}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        border: '1px solid #bfdbfe',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '500'
                      }}>
                        {statusText}
                      </span>
                      {!isEditMode ? (
                        <button
                          onClick={() => setIsEditMode(true)}
                          style={{
                            background: '#fff',
                            color: '#2563eb',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            padding: '8px 20px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          Edit
                        </button>
                      ) : (
                        <button
                          onClick={handleSaveWorkflow}
                          disabled={workflowSaving}
                          style={{
                            background: workflowSaving ? '#93c5fd' : '#2563eb',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 20px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: workflowSaving ? 'not-allowed' : 'pointer',
                            boxShadow: workflowSaving ? 'none' : '0 2px 4px rgba(37, 99, 235, 0.2)',
                            transition: 'all 0.2s'
                          }}
                        >
                          {workflowSaving ? 'Saving...' : 'Save'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Case Summary Card */}
                  <div style={{
                    background: '#f8fafc',
                    border: '0.5px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '16px 20px',
                    marginBottom: '20px'
                  }}>
                    <p style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '6px' }}>
                      ASSIGNED CASE
                    </p>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: '0 0 12px 0' }}>
                      {assignedCaseTitle}
                    </h4>

                    <div style={{ display: 'flex', gap: '32px' }}>
                      <div>
                        <p style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '3px' }}>DEADLINE</p>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: '#dc2626', margin: 0 }}>{deadline}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '3px' }}>DEPARTMENT</p>
                        <p style={{ fontSize: '13px', fontWeight: '500', color: '#475569', margin: 0 }}>{department}</p>
                      </div>
                    </div>
                  </div>

                  {/* Edit Mode Info Bar */}
                  {isEditMode && (
                    <div style={{
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '6px',
                      padding: '10px 16px',
                      marginBottom: '20px',
                      color: '#1d4ed8',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}>
                      Edit Mode Active — enter notes for each stage below
                    </div>
                  )}

                  {/* Status Stage Section */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    {[
                      { title: 'Assigned', val: assignedNotes, setVal: setAssignedNotes, color: '#16a34a' },
                      { title: 'Reviewing', val: reviewingNotes, setVal: setReviewingNotes, color: '#eab308' },
                      { title: 'Approved', val: approvedNotes, setVal: setApprovedNotes, color: '#2563eb' },
                      { title: 'Closed', val: closedNotes, setVal: setClosedNotes, color: '#64748b' }
                    ].map(({ title, val, setVal, color }) => (
                      <div key={title}>
                        <p style={{ fontSize: '12px', fontWeight: '600', color: color, textAlign: 'center', marginBottom: '6px' }}>{title}</p>
                        <textarea
                          placeholder="Notes for this stage..."
                          value={val}
                          onChange={(e) => setVal(e.target.value)}
                          disabled={!isEditMode}
                          style={{
                            width: '100%',
                            height: '80px',
                            borderRadius: '8px',
                            border: isEditMode ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
                            padding: '10px 12px',
                            fontSize: '13px',
                            outline: 'none',
                            resize: 'none',
                            background: isEditMode ? '#fff' : '#f8fafc',
                            color: '#334155',
                            boxShadow: isEditMode ? '0 0 0 3px rgba(59, 130, 246, 0.12)' : 'none',
                            transition: 'all 0.2s',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Activity Section */}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                    <p style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '16px' }}>
                      ACTIVITY
                    </p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                      {activities.length > 0 ? (
                        activities.map((act, index) => (
                          <div key={index} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: index === 0 ? '#2563eb' : '#22c55e', marginTop: '5px' }} />
                            <div>
                              <p style={{ fontSize: '13px', fontWeight: '600', color: '#334155', margin: 0 }}>{act.title || act.activity_title}</p>
                              <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0' }}>{act.date || act.created_at || "Just now"}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p style={{ fontSize: 12, color: '#64748b' }}>No recent activity.</p>
                      )}
                    </div>

                    {/* Large notes text area */}
                    <textarea
                      placeholder="Add comments/notes here..."
                      value={activityNote}
                      onChange={(e) => setActivityNote(e.target.value)}
                      disabled={!isEditMode}
                      style={{
                        width: '100%',
                        height: '80px',
                        borderRadius: '8px',
                        border: isEditMode ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
                        padding: '12px',
                        fontSize: '13px',
                        outline: 'none',
                        resize: 'none',
                        background: isEditMode ? '#fff' : '#f8fafc',
                        color: '#334155',
                        boxShadow: isEditMode ? '0 0 0 3px rgba(59, 130, 246, 0.12)' : 'none',
                        transition: 'all 0.2s',
                        boxSizing: 'border-box',
                        marginBottom: '20px'
                      }}
                    />
                  </div>

                  {/* Action buttons at bottom */}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      style={{
                        padding: '8px 20px',
                        border: '1px solid #2563eb',
                        borderRadius: '8px',
                        background: '#fff',
                        color: '#2563eb',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#eff6ff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#fff';
                      }}
                    >
                      View Details
                    </button>
                    <button
                      style={{
                        padding: '8px 20px',
                        border: 'none',
                        borderRadius: '8px',
                        background: '#2563eb',
                        color: '#fff',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#1d4ed8';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#2563eb';
                      }}
                    >
                      Update Status
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        <p style={{ fontSize: 12, color: '#64748b', textAlign: 'center', padding: '6px 0', marginBottom: 20 }}>
          Showing {filteredNotices.length} of {notices.length} orders
        </p>
      </div>

      {showResponseModal && activeNotice && (
        <div 
          onClick={() => setShowResponseModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes scaleIn {
              from { transform: scale(0.95); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
          `}</style>
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              padding: '24px',
              maxWidth: '750px',
              width: '90%',
              animation: 'scaleIn 0.2s ease-out',
              position: 'relative'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>Responses</h3>
              <button 
                onClick={() => setShowResponseModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                &times;
              </button>
            </div>

            {/* Response Box matching screenshot */}
            {!responseDetails?.response_details ? (
              <div style={{ padding: 28, textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                No response has been filed yet for this notice.
              </div>
            ) : (
              <div style={{ 
                border: '1px solid #e2e8f0', 
                borderRadius: '8px', 
                padding: '18px 24px', 
                background: '#fff',
                display: 'grid',
                gridTemplateColumns: '1fr 2.5fr 1fr',
                gap: '24px'
              }}>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 500, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '6px' }}>
                    Response Date
                  </p>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                    {formatDate(responseDetails?.response_details?.response_submitted_on)}
                  </p>
                </div>
                
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 500, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '6px' }}>
                    Response
                  </p>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#334155', lineHeight: '1.5' }}>
                    {displayValue(responseDetails?.response_details?.response_remarks)}
                  </p>
                </div>

                <div>
                  <p style={{ fontSize: '11px', fontWeight: 500, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '6px' }}>
                    Response Filed By
                  </p>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                    {displayValue(responseDetails?.response_details?.response_filed_by)}
                  </p>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button 
                onClick={() => setShowResponseModal(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdjournmentModal && activeNoticeForAdjournment && (
        <div 
          onClick={() => setShowAdjournmentModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              padding: '24px',
              maxWidth: '960px',
              width: '95%',
              animation: 'scaleIn 0.2s ease-out',
              position: 'relative'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>Adjournment Details</h3>
              <button 
                onClick={() => setShowAdjournmentModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                &times;
              </button>
            </div>

            {/* Adjournment Table Container */}
            {!adjournmentDetails?.adjournment_details ? (
              <div style={{ padding: 28, textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                No adjournment has been filed yet for this notice.
              </div>
            ) : (
              <div style={{ 
                border: '1px solid #e2e8f0', 
                borderRadius: '8px', 
                overflow: 'hidden',
                background: '#fff',
                marginBottom: '24px'
              }}>
                {/* Table Header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 2fr 1.2fr 1fr 1.5fr 1fr',
                  background: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  padding: '12px 16px',
                  gap: '12px'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#475569', lineHeight: '1.3' }}>Adjournment Request Date</div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#475569', lineHeight: '1.3', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Reason for seeking Adjournment
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#475569', lineHeight: '1.3' }}>Adjournment sought up to</div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#475569', lineHeight: '1.3' }}>Status/Action</div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#475569', lineHeight: '1.3' }}>Adjourned date for submission of response</div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#475569', lineHeight: '1.3' }}>ITD Remarks</div>
                </div>

                {/* Table Body Row */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 2fr 1.2fr 1fr 1.5fr 1fr',
                  padding: '16px',
                  gap: '12px',
                  alignItems: 'center',
                  background: '#fff',
                  fontSize: '13px',
                  color: '#334155'
                }}>
                  <div style={{ fontWeight: 500 }}>{formatDate(adjournmentDetails?.adjournment_details?.adjournment_request_date)}</div>
                  <div style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 500, textDecoration: 'none' }}>
                    {displayValue(adjournmentDetails?.adjournment_details?.reason_for_seeking_adjournment)}
                  </div>
                  <div style={{ fontWeight: 500 }}>{formatDate(adjournmentDetails?.adjournment_details?.adjournment_sought_upto)}</div>
                  <div style={{ fontWeight: 500 }}>{displayValue(adjournmentDetails?.adjournment_details?.status_action)}</div>
                  <div style={{ color: '#64748b' }}>{formatDate(adjournmentDetails?.adjournment_details?.adjourned_date_for_submission_of_response)}</div>
                  <div style={{ color: '#64748b' }}>{displayValue(adjournmentDetails?.adjournment_details?.itd_remarks)}</div>
                </div>
              </div>
            )}

            {adjournmentDetails?.adjournment_details && (
              <>
                {/* Divider Line */}
                <div style={{ height: '1.5px', backgroundColor: '#f1f5f9', margin: '24px 0' }} />

                {/* Reason Detail Block (Matching second screenshot) */}
                <div style={{ marginBottom: '10px', textAlign: 'left' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', marginBottom: '16px' }}>Reason for seeking Adjournment</h4>
                  <div style={{ 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px', 
                    padding: '18px 24px', 
                    background: '#fff',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1.5fr',
                    gap: '32px'
                  }}>
                    <div>
                      <p style={{ fontSize: '11px', fontWeight: 500, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '8px' }}>
                        Reason for seeking Adjournment
                      </p>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#334155', lineHeight: '1.5' }}>
                        {displayValue(adjournmentDetails?.adjournment_details?.reason_for_seeking_adjournment)}
                      </p>
                    </div>
                    
                    <div>
                      <p style={{ fontSize: '11px', fontWeight: 500, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '8px' }}>
                        Reason
                      </p>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#334155', lineHeight: '1.6' }}>
                        {displayValue(adjournmentDetails?.adjournment_details?.reason_for_seeking_adjournment)}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button 
                onClick={() => setShowAdjournmentModal(false)}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#22409a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  boxShadow: '0 2px 4px rgba(34, 64, 154, 0.15)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a3075'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#22409a'}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
