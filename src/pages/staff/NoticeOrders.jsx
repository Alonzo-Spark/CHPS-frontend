import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Filter, FileText, FileType } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { noticeService, professionalWorkflowService, professionalService, professionalDashboardService } from '../../services'
import { useAuth } from '../../context/AuthContext'

const getStatus = (item) => {
  const hasIssueDate = !!(item?.issued_on || item?.issue_date)
  const hasDueDate = !!(item?.due_date || item?.response_due_date)
  if (hasIssueDate && hasDueDate) return 'completed'
  if (hasIssueDate && !hasDueDate) return 'pending'
  if (item?.is_completed || (item?.status || '').toLowerCase() === 'completed') return 'completed'
  return item?.status || 'pending'
}

const statusBadge = (status = 'pending') => {
  const map = {
    pending: { bg: '#fffbeb', color: '#92400e', border: '#fcd34d', label: 'Pending' },
    'in progress': { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', label: 'In Progress' },
    completed: { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0', label: 'Completed' },
  }
  const s = map[(status || '').toLowerCase()] || map.pending
  return (
    <span style={{ background: s.bg, color: s.color, border: `0.5px solid ${s.border}`, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>
      {s.label}
    </span>
  )
}

const formatDate = (date) => {
  if (!date || date === '-') return '-'
  try {
    return new Date(date).toLocaleDateString('en-GB')
  } catch {
    return '-'
  }
}

export default function NoticeOrders() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const role = localStorage.getItem('role')?.toLowerCase() || user?.role?.toLowerCase() || 'staff'
  const isProfessional = role === 'professional'

  const [notices, setNotices] = useState([])
  const [proceeding, setProceeding] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [filters, setFilters] = useState({ section: '', referenceId: '', date: '' })
  const [appliedFilters, setAppliedFilters] = useState({ section: '', referenceId: '', date: '' })
  const [activeModal, setActiveModal] = useState(null)
  const [modalData, setModalData] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [workflowForm, setWorkflowForm] = useState({
    noticeId: null,
    workflow_status: 'Pending',
    current_stage: 'Pending',
    assigned_notes: '',
    reviewing_notes: '',
    approved_notes: '',
    closed_notes: '',
    activity_title: '',
    activity_description: ''
  })
  const [workflowDetails, setWorkflowDetails] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [stageData, setStageData] = useState({
    assigned: '',
    reviewing: '',
    approved: '',
    closed: ''
  })
  const [commentText, setCommentText] = useState('')
  const [activityLogs, setActivityLogs] = useState([])

  useEffect(() => {
    if (workflowDetails?.workflow) {
      setStageData({
        assigned: workflowDetails.workflow.assigned_notes || '',
        reviewing: workflowDetails.workflow.reviewing_notes || '',
        approved: workflowDetails.workflow.approved_notes || '',
        closed: workflowDetails.workflow.closed_notes || ''
      })
    }
    if (workflowDetails?.activity) {
      setCommentText(workflowDetails.activity.description || '')
    }
  }, [workflowDetails])

  const getTypeFromStage = (stage) => {
    const s = String(stage || '').toLowerCase()
    if (s.includes('response')) return 'response'
    if (s.includes('adjournment')) return 'adjournment'
    if (s.includes('assigned')) return 'assigned'
    if (s.includes('reviewing')) return 'reviewing'
    if (s.includes('approved')) return 'approved'
    if (s.includes('closed')) return 'closed'
    return 'custom'
  }

  useEffect(() => {
    if (workflowDetails) {
      const dbEntries = []

      if (Array.isArray(workflowDetails.responses)) {
        workflowDetails.responses.forEach(r => {
          if (r.response_submitted_on) {
            dbEntries.push({
              stage: 'Response submitted',
              text: r.response_remarks || '',
              date: r.response_submitted_on
            })
          }
        })
      }

      if (Array.isArray(workflowDetails.adjournments)) {
        workflowDetails.adjournments.forEach(a => {
          if (a.adjournment_request_date) {
            dbEntries.push({
              stage: `Adjournment requested (${a.status_action || 'Pending'})`,
              text: a.reason_for_seeking_adjournment || '',
              date: a.adjournment_request_date
            })
          }
        })
      }

      const wf = workflowDetails.workflow || {}
      if (wf.assigned_updated_at) {
        dbEntries.push({
          stage: 'Assigned',
          text: wf.assigned_notes || '',
          date: wf.assigned_updated_at
        })
      }
      if (wf.reviewing_updated_at) {
        dbEntries.push({
          stage: 'Reviewing',
          text: wf.reviewing_notes || '',
          date: wf.reviewing_updated_at
        })
      }
      if (wf.approved_updated_at) {
        dbEntries.push({
          stage: 'Approved',
          text: wf.approved_notes || '',
          date: wf.approved_updated_at
        })
      }
      if (wf.closed_updated_at) {
        dbEntries.push({
          stage: 'Closed',
          text: wf.closed_notes || '',
          date: wf.closed_updated_at
        })
      }

      if (workflowDetails.activity && workflowDetails.activity.activity_date && workflowDetails.activity.title) {
        dbEntries.push({
          stage: workflowDetails.activity.title,
          text: workflowDetails.activity.description || '',
          date: workflowDetails.activity.activity_date
        })
      }

      const sorted = dbEntries
        .filter(item => item.date)
        .map(item => {
          const stage = item.stage || item.title || 'Custom'
          const text = item.text || item.description || ''
          const type = getTypeFromStage(stage)
          return {
            stage,
            title: stage,
            text,
            description: text,
            date: item.date,
            type
          }
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date))
      
      setActivityLogs(prev => {
        const combined = [...prev, ...sorted]
        const singleEntryStages = ["assigned", "reviewing", "approved", "closed", "workflow comment", "comment"]
        const stageMap = {}
        const otherLogs = []
        const seen = new Set()

        for (const item of combined) {
          const stageName = (item.stage || item.title || 'Custom').toLowerCase()
          if (singleEntryStages.includes(stageName)) {
            const existing = stageMap[stageName]
            if (!existing || new Date(item.date) > new Date(existing.date)) {
              stageMap[stageName] = item
            }
          } else {
            const key = `${stageName}|${item.text || item.description}|${item.date}`
            if (!seen.has(key)) {
              seen.add(key)
              otherLogs.push(item)
            }
          }
        }

        const finalLogs = [...Object.values(stageMap), ...otherLogs]
        return finalLogs.sort((a, b) => new Date(b.date) - new Date(a.date))
      })
    }
  }, [workflowDetails])

  // Fetch notices for this proceeding. If role is admin/professional, treat `id` as proceeding_id and call professional API.
  // Otherwise treat `id` as proceeding_name and call public proceedings API.
  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true)
        setError(null)

        let res = null
        let payload = null
        let resolvedProceedingDetails = null
        let resolvedUserPan = null
        let resolvedUserName = null

        const isNumericId = /^\d+$/.test(String(id).trim())

        if (!isNumericId) {
          const proceedingName = decodeURIComponent(id || '')
          res = await noticeService.getProceedingsNotices(proceedingName)
          payload = res?.data || res
        } else {
          if (role === 'professional' || isProfessional) {
            try {
              const noticeRes = await professionalWorkflowService.getWorkflow(id)
              setWorkflowDetails(noticeRes?.data || noticeRes)
            } catch (err) {
              console.warn('Failed to fetch notice workflow details', err)
            }
          }
          
          res = await noticeService.getNoticeById(id)
          payload = res?.data || res
        }

        // Normalize into array
        let noticesList = []
        if (Array.isArray(payload)) noticesList = payload
        else if (Array.isArray(payload?.notice_orders)) noticesList = payload.notice_orders
        else if (Array.isArray(payload?.notices)) noticesList = payload.notices
        else if (Array.isArray(payload?.data)) noticesList = payload.data
        else if (Array.isArray(payload?.items)) noticesList = payload.items

        if (!noticesList.length) {
          setNotices([])
        } else {
          setNotices(noticesList)
        }

        // extract proceeding details if available
        const proc = resolvedProceedingDetails || payload?.proceeding_details || payload || {}
        setProceeding({
          proceedingName: proc.proceeding_name || proc.proceedingName || payload?.proceeding_name || decodeURIComponent(id || '') || 'N/A',
          pan: resolvedUserPan || payload?.user_pan || proc.pan || payload?.pan || payload?.pan_number || 'N/A',
          assesseeName: resolvedUserName || payload?.user_name || proc.assessee_name || payload?.assessee_name || payload?.user?.name || 'N/A',
          assessmentYear: proc.assessment_year || payload?.assessment_year || 'N/A',
          financialYear: proc.financial_year || payload?.financial_year || 'N/A',
          applicableAct: proc.applicable_act || payload?.applicable_act || 'Income Tax Act 1961'
        })
      } catch (err) {
        console.error('NoticeOrders fetch error:', err)
        setNotices([])
        setError('Failed to load notice details. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    if (id) fetch()
  }, [id, role, isProfessional, refreshTrigger])



  const extractSection = (desc) => {
    if (!desc) return '—'
    const m = String(desc).match(/\d+\(\d+\)|\d+[A-Z]?/) || []
    return m.length > 0 ? m[0] : '—'
  }

  const displayValue = (val) => (val !== null && val !== undefined && val !== '') ? val : '—'

  const handleViewPdf = (n) => {
    const noticeId = n?.notice_id || n?.id
    if (noticeId) noticeService.downloadNoticePdf(noticeId)
    else alert('PDF not found for this Notice ID')
  }

  const handleViewResponse = async (item) => {
    try {
      const noticeId = item?.notice_id || item?.id
      let details = null

      if (role === 'professional' || isProfessional) {
        const res = await professionalWorkflowService.getWorkflow(noticeId)
        const wf = res?.data
        if (wf && wf.responses && wf.responses.length > 0) {
          details = wf.responses[0]
        }
      } else {
        const res = await noticeService.getResponse(noticeId)
        details = res?.data?.response_details || res?.response_details || res?.data || res
      }

      if (details && (details.response_remarks || details.response_submitted_on || details.response_filed_by)) {
        setModalData(details)
        setActiveModal('response')
      } else {
        setModalData({ response_remarks: 'No response found' })
        setActiveModal('response')
      }
    } catch (err) {
      console.warn('Fetch response failed', err)
      setModalData({ response_remarks: 'No response found' })
      setActiveModal('response')
    }
  }

  const handleAdjournment = async (item) => {
    try {
      const noticeId = item?.notice_id || item?.id
      let details = null

      if (role === 'professional' || isProfessional) {
        const res = await professionalWorkflowService.getWorkflow(noticeId)
        const wf = res?.data
        if (wf && wf.adjournments && wf.adjournments.length > 0) {
          details = wf.adjournments[0]
        }
      } else {
        const res = await noticeService.getAdjournment(noticeId)
        details = res?.data?.adjournment_details || res?.adjournment_details || res?.data || res
      }

      if (details && (details.reason_for_seeking_adjournment || details.adjournment_request_date || details.status_action)) {
        setModalData(details)
        setActiveModal('adjournment')
      } else {
        setModalData({ reason_for_seeking_adjournment: 'No adjournment request found' })
        setActiveModal('adjournment')
      }
    } catch (err) {
      console.warn('Adjournment fetch failed', err)
      setModalData({ reason_for_seeking_adjournment: 'No adjournment request found' })
      setActiveModal('adjournment')
    }
  }

  const handleManageWorkflow = async (item) => {
    try {
      const noticeId = item?.notice_id || item?.id
      const res = await professionalWorkflowService.getWorkflow(noticeId)
      const wf = res?.data
      if (wf) {
        setWorkflowForm({
          noticeId: noticeId,
          workflow_status: wf.workflow?.workflow_status || 'Pending',
          current_stage: wf.workflow?.workflow_status || 'Pending',
          assigned_notes: wf.workflow?.assigned_notes || '',
          reviewing_notes: wf.workflow?.reviewing_notes || '',
          approved_notes: wf.workflow?.approved_notes || '',
          closed_notes: wf.workflow?.closed_notes || '',
          activity_title: '',
          activity_description: ''
        })
        setActiveModal('workflow')
      } else {
        alert('Workflow data not found')
      }
    } catch (err) {
      console.error('Failed to fetch workflow', err)
      alert('Error fetching workflow data')
    }
  }

  const handleSaveWorkflow = async (e) => {
    e.preventDefault()
    try {
      const { noticeId, ...payload } = workflowForm
      const res = await professionalWorkflowService.updateWorkflow(noticeId, payload)
      if (res.data) {
        alert('Workflow updated successfully!')
        setActiveModal(null)
        setRefreshTrigger(prev => prev + 1)
      } else {
        alert('Failed to update workflow')
      }
    } catch (err) {
      console.error('Failed to update workflow', err)
      alert('Error saving workflow details')
    }
  }

  const getTimelineEntries = () => {
    return activityLogs
  }

  const handleSaveInlineWorkflow = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault()
    }
    try {
      const noticeId = id

      if (commentText.trim() !== '' && commentText !== (workflowDetails?.activity?.description || '')) {
        const commentPayload = {
          activity_title: 'Workflow comment',
          activity_description: commentText
        }
        await professionalWorkflowService.addActivity(noticeId, commentPayload)
      }

      const workflowPayload = {
        assigned_notes: stageData.assigned,
        reviewing_notes: stageData.reviewing,
        approved_notes: stageData.approved,
        closed_notes: stageData.closed,
        workflow_status: workflowDetails?.workflow?.workflow_status || 'Pending'
      }

      const res = await professionalWorkflowService.updateWorkflow(noticeId, workflowPayload)
      if (res.data) {
        const timestamp = new Date().toISOString()
        
        setActivityLogs(prevLogs => {
          const updatedLogs = [...prevLogs];
          
          const processStage = (stageName, currentText) => {
            if (!currentText || currentText.trim() === '') return;
            
            const index = updatedLogs.findIndex(log => (log.stage || '').toLowerCase() === stageName.toLowerCase());
            if (index !== -1) {
              if (updatedLogs[index].text !== currentText) {
                updatedLogs[index] = {
                  ...updatedLogs[index],
                  text: currentText,
                  description: currentText,
                  date: timestamp
                };
              }
            } else {
              updatedLogs.push({
                stage: stageName,
                title: stageName,
                text: currentText,
                description: currentText,
                date: timestamp,
                type: getTypeFromStage(stageName)
              });
            }
          };

          processStage("Assigned", stageData.assigned);
          processStage("Reviewing", stageData.reviewing);
          processStage("Approved", stageData.approved);
          processStage("Closed", stageData.closed);
          processStage("Workflow comment", commentText);

          updatedLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

          return updatedLogs;
        });

        setIsEditing(false)

        try {
          const noticeRes = await professionalWorkflowService.getWorkflow(id)
          const updatedDetail = noticeRes?.data || noticeRes
          setWorkflowDetails(updatedDetail)
        } catch (fetchErr) {
          console.warn("Failed to fetch fresh workflow in background", fetchErr)
        }

        alert('Workflow updated successfully!')
      } else {
        alert('Failed to update workflow')
      }
    } catch (err) {
      console.error('Failed to update workflow', err)
      alert('Error saving workflow details')
    }
  }

  const filteredNotices = (notices || []).filter(n => {
    const sectionVal = extractSection(n.description || '').toLowerCase()
    const matchesSection = !appliedFilters.section || sectionVal.includes(appliedFilters.section.toLowerCase())
    const refVal = (n.reference_id || '').toLowerCase()
    const matchesRef = !appliedFilters.referenceId || refVal.includes(appliedFilters.referenceId.toLowerCase())
    const matchesDate = !appliedFilters.date || (n.issued_on || '').includes(appliedFilters.date)
    return matchesSection && matchesRef && matchesDate
  })

  return (
    <DashboardLayout breadcrumbs={[
      { label: 'Dashboard', path: role === 'professional' ? '/professional-dashboard' : '/staff/dashboard' },
      { label: 'Notice Orders' }
    ]}>
      <div className="notice-orders-content" style={{ padding: '18px 20px' }}>
        <div className="notice-orders-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5, cursor: 'pointer' }} onClick={() => navigate(role === 'professional' ? '/professional-dashboard' : '/staff/dashboard')}>
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

        {showFilterPanel && (
          <div className="notice-orders-filter-panel" style={{ padding: '12px 18px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
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
                onClick={() => { setFilters({ section: '', referenceId: '', date: '' }); setAppliedFilters({ section: '', referenceId: '', date: '' }) }}
                style={{ padding: '6px 12px', background: '#f3f4f6', color: '#64748b', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
              >
                Clear Filters
              </button>
              <button
                onClick={() => { setAppliedFilters({ ...filters }); setShowFilterPanel(false) }}
                style={{ padding: '6px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
              >
                Apply
              </button>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 10, fontWeight: 500, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 11 }}>Proceeding details</p>
          <div className="proceeding-details-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0,1fr))', gap: 16 }}>
            {[
              { label: 'Proceeding Name', value: proceeding?.proceedingName || proceeding?.proceeding_name || id || "N/A" },
              { label: 'PAN', value: proceeding?.pan || proceeding?.pan_number || "N/A", isBold: true },
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
                <p style={{ fontSize: 14, fontWeight: 500, color: '#1e293b', flex: 1 }}>
                  Reference ID: <span style={{ fontFamily: 'monospace', color: '#1d4ed8' }}>{n.reference_id || "—"}</span>
                </p>
                {statusBadge(getStatus(n))}
                {isProfessional && (
                  <button
                    onClick={() => setIsEditing(true)}
                    style={{
                      padding: '4px 12px',
                      background: '#fff',
                      color: '#2563eb',
                      border: '1px solid #cbd5e1',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      marginLeft: 8
                    }}
                  >
                    Edit
                  </button>
                )}
              </div>
              <div className="notice-card-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 110px' }}>
                <div style={{ padding: '14px 16px', borderRight: '0.5px solid #e2e8f0' }}>
                  <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>Section</p>
                  <p style={{ fontSize: 24, fontWeight: 500, color: '#1e293b', lineHeight: 1.1 }}>{n.section || n.notice_us || n.notice_type || extractSection(n.description) || "—"}</p>
                  <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Notice u/s</p>

                  <div style={{ marginTop: 16 }}>
                    <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>Description</p>
                    <p style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.6, marginTop: 2 }}>{n.description || "—"}</p>
                  </div>
                </div>
                <div style={{ padding: '14px 16px', borderRight: '0.5px solid #e2e8f0' }}>
                  <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>Document reference ID</p>
                  <p style={{ fontSize: 12, color: '#1d4ed8', fontFamily: 'monospace', marginTop: 2, lineHeight: 1.5 }}>{n.document_reference_id || n.reference_id || "—"}</p>
                  <div style={{ marginTop: 16 }}>
                    <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>Issued on</p>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#1e293b' }}>{n.issued_on || "—"}</p>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>Response due</p>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#dc2626' }}>{n.response_due_date || n.due_date || "—"}</p>
                  </div>
                </div>
                <div style={{ padding: '14px 16px', borderRight: '0.5px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                  <p style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>Action</p>
                  <div style={{ marginTop: 14 }}>
                    <span
                      onClick={() => handleViewResponse(n)}
                      style={{ color: '#2563eb', cursor: 'pointer', fontSize: 12, fontWeight: 600, textDecoration: 'underline', display: 'inline-block' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#1d4ed8'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#2563eb'}
                    >
                      View Response
                    </span>
                  </div>
                  <div style={{ marginTop: 14 }}>
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
                <div style={{ padding: '16px 20px', borderTop: '0.5px solid #e2e8f0', background: '#f8fafc' }}>
                  {isEditing && (
                    <div style={{
                      background: '#eff6ff',
                      border: '0.5px solid #bfdbfe',
                      borderRadius: 8,
                      padding: '8px 12px',
                      color: '#1d4ed8',
                      fontSize: 12,
                      fontWeight: 500,
                      marginBottom: 16
                    }}>
                      Edit Mode Active — enter notes for each stage below
                    </div>
                  )}

                  <div className="stage-notes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                    {['Assigned', 'Reviewing', 'Approved', 'Closed'].map((stage) => {
                      const stageKey = stage.toLowerCase()
                      const notesValue = stageData[stageKey] || ''
                      const colorMap = {
                        Assigned: '#10b981',
                        Reviewing: '#eab308',
                        Approved: '#2563eb',
                        Closed: '#6b7280'
                      }

                      return (
                        <div key={stage} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: colorMap[stage] }}>{stage}</span>
                          {isEditing ? (
                            <textarea
                              value={notesValue}
                              onChange={(e) => setStageData({ ...stageData, [stageKey]: e.target.value })}
                              placeholder="Notes for this stage..."
                              style={{
                                width: '100%',
                                height: 80,
                                padding: '8px 10px',
                                borderRadius: 8,
                                border: '1px solid #3b82f6',
                                fontSize: 12,
                                outline: 'none',
                                resize: 'none',
                                fontFamily: 'inherit',
                                background: '#fff'
                              }}
                            />
                          ) : (
                            <div style={{
                              height: 80,
                              padding: '8px 10px',
                              borderRadius: 8,
                              border: '1px solid #e2e8f0',
                              fontSize: 12,
                              background: '#fff',
                              color: notesValue ? '#1e293b' : '#94a3b8',
                              overflowY: 'auto',
                              whiteSpace: 'pre-wrap'
                            }}>
                              {notesValue || 'Notes for this stage...'}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Activity</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {getTimelineEntries().length === 0 ? (
                        <p style={{ fontSize: 12, color: '#94a3b8' }}>No activity logged yet.</p>
                      ) : (
                        getTimelineEntries().map((act, index) => {
                          const colorMap = {
                            response: '#10b981',
                            adjournment: '#eab308',
                            assigned: '#10b981',
                            reviewing: '#eab308',
                            approved: '#2563eb',
                            closed: '#6b7280',
                            custom: '#3b82f6'
                          }
                          const dotColor = colorMap[act.type] || '#cbd5e1'
                          return (
                            <div key={index} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, marginTop: 4, flexShrink: 0 }} />
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>{act.title}</span>
                                  <span style={{ fontSize: 10, color: '#94a3b8' }}>{formatDate(act.date)}</span>
                                </div>
                                {act.description && (
                                  <p style={{ fontSize: 11, color: '#475569', margin: '3px 0 0 0' }}>{act.description}</p>
                                )}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    {isEditing ? (
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Follow up or general comment..."
                        style={{
                          width: '100%',
                          height: 60,
                          padding: '8px 10px',
                          borderRadius: 8,
                          border: '1px solid #3b82f6',
                          fontSize: 12,
                          outline: 'none',
                          resize: 'none',
                          fontFamily: 'inherit',
                          background: '#fff'
                        }}
                      />
                    ) : (
                      <div style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                        fontSize: 12,
                        background: '#fff',
                        color: commentText ? '#1e293b' : '#94a3b8',
                        minHeight: 40,
                        whiteSpace: 'pre-wrap'
                      }}>
                        {commentText || 'Follow up or general comment...'}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-start' }}>
                    <button
                      onClick={() => {
                        if (isEditing) {
                          handleSaveInlineWorkflow()
                        } else {
                          setIsEditing(true)
                        }
                      }}
                      style={{
                        padding: '8px 16px',
                        background: '#2563eb',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {isEditing ? 'Save' : 'Update Status'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {activeModal && modalData && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <div className="modal-card" style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            borderRadius: 16,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            width: '100%',
            maxWidth: 500,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc'
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                {activeModal === 'response' ? 'View Submitted Response' : 'Adjournment Details'}
              </h3>
              <button
                onClick={() => { setActiveModal(null); setModalData(null); }}
                style={{
                  border: 'none',
                  background: 'none',
                  fontSize: 18,
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: 4,
                  lineHeight: 1
                }}
              >
                &times;
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {activeModal === 'response' ? (
                <>
                  <div>
                    <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, margin: 0, marginBottom: 4 }}>Response Remarks</p>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#1e293b', margin: 0, background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      {modalData.response_remarks || '—'}
                    </p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, margin: 0, marginBottom: 4 }}>Submitted On</p>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>
                        {modalData.response_submitted_on || '—'}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, margin: 0, marginBottom: 4 }}>Response Type</p>
                      <span style={{
                        display: 'inline-block',
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        padding: '3px 10px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 500,
                        marginTop: 2
                      }}>
                        {modalData.response_type || '—'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, margin: 0, marginBottom: 4 }}>Filed By</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>
                      {modalData.response_filed_by || '—'}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, margin: 0, marginBottom: 4 }}>Reason for Adjournment</p>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#1e293b', margin: 0, background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      {modalData.reason_for_seeking_adjournment || '—'}
                    </p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, margin: 0, marginBottom: 4 }}>Request Date</p>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>
                        {modalData.adjournment_request_date || '—'}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, margin: 0, marginBottom: 4 }}>Sought Upto</p>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>
                        {modalData.adjournment_sought_upto || '—'}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, margin: 0, marginBottom: 4 }}>Status</p>
                      <span style={{
                        display: 'inline-block',
                        background: modalData.status_action?.toLowerCase() === 'approved' ? '#f0fdf4' : '#fffbeb',
                        color: modalData.status_action?.toLowerCase() === 'approved' ? '#166534' : '#92400e',
                        border: `0.5px solid ${modalData.status_action?.toLowerCase() === 'approved' ? '#bbf7d0' : '#fcd34d'}`,
                        padding: '3px 10px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 500,
                        marginTop: 2
                      }}>
                        {modalData.status_action || 'Pending'}
                      </span>
                    </div>
                    <div>
                      <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, margin: 0, marginBottom: 4 }}>Adjourned Date</p>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>
                        {modalData.adjourned_date_for_submission_of_response || '—'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, margin: 0, marginBottom: 4 }}>AO Remarks</p>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#1e293b', margin: 0, fontStyle: 'italic' }}>
                      "{modalData.itd_remarks || 'No remarks provided'}"
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              background: '#f8fafc'
            }}>
              <button
                onClick={() => { setActiveModal(null); setModalData(null); }}
                style={{
                  padding: '8px 16px',
                  background: '#1e3a8a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#172554'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#1e3a8a'}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'workflow' && workflowForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            borderRadius: 16,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            width: '100%',
            maxWidth: 600,
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc'
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                Manage Notice Workflow
              </h3>
              <button
                onClick={() => { setActiveModal(null); }}
                style={{
                  border: 'none',
                  background: 'none',
                  fontSize: 18,
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: 4,
                  lineHeight: 1
                }}
              >
                &times;
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSaveWorkflow} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '24px', overflowY: 'auto', maxHeight: '60vh', display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                {/* Workflow Status */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Workflow Status / Stage</label>
                  <select
                    value={workflowForm.workflow_status}
                    onChange={e => setWorkflowForm({ ...workflowForm, workflow_status: e.target.value, current_stage: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 14,
                      color: '#1e293b',
                      outline: 'none',
                      background: '#fff'
                    }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Assigned">Assigned</option>
                    <option value="Reviewing">Reviewing</option>
                    <option value="Approved">Approved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                {/* Assigned Notes */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Assigned Notes</label>
                  <textarea
                    rows={2}
                    value={workflowForm.assigned_notes}
                    onChange={e => setWorkflowForm({ ...workflowForm, assigned_notes: e.target.value })}
                    placeholder="Enter notes for assigned stage..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 13,
                      color: '#1e293b',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                {/* Reviewing Notes */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Reviewing Notes</label>
                  <textarea
                    rows={2}
                    value={workflowForm.reviewing_notes}
                    onChange={e => setWorkflowForm({ ...workflowForm, reviewing_notes: e.target.value })}
                    placeholder="Enter notes for reviewing stage..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 13,
                      color: '#1e293b',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                {/* Approved Notes */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Approved Notes</label>
                  <textarea
                    rows={2}
                    value={workflowForm.approved_notes}
                    onChange={e => setWorkflowForm({ ...workflowForm, approved_notes: e.target.value })}
                    placeholder="Enter notes for approved stage..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 13,
                      color: '#1e293b',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                {/* Closed Notes */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Closed Notes</label>
                  <textarea
                    rows={2}
                    value={workflowForm.closed_notes}
                    onChange={e => setWorkflowForm({ ...workflowForm, closed_notes: e.target.value })}
                    placeholder="Enter notes for closed stage..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 13,
                      color: '#1e293b',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                {/* Activity title */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Activity Title (to log a new entry)</label>
                  <input
                    type="text"
                    value={workflowForm.activity_title}
                    onChange={e => setWorkflowForm({ ...workflowForm, activity_title: e.target.value })}
                    placeholder="e.g. Document submitted, Response prepared"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 13,
                      color: '#1e293b',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Activity description */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Activity Description</label>
                  <textarea
                    rows={2}
                    value={workflowForm.activity_description}
                    onChange={e => setWorkflowForm({ ...workflowForm, activity_description: e.target.value })}
                    placeholder="Enter activity description..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 13,
                      color: '#1e293b',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

              </div>

              {/* Footer */}
              <div style={{
                padding: '14px 24px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 12,
                background: '#f8fafc'
              }}>
                <button
                  type="button"
                  onClick={() => { setActiveModal(null); }}
                  style={{
                    padding: '8px 16px',
                    background: '#f3f4f6',
                    color: '#4b5563',
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    background: '#059669',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#047857'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#059669'}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
