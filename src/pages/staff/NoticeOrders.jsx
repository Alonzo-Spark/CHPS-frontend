import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Filter, FileText, FileType } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { noticeService, professionalWorkflowService, professionalService } from '../../services'
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

  // Fetch notices for this proceeding. If role is admin/professional, treat `id` as proceeding_id and call professional API.
  // Otherwise treat `id` as proceeding_name and call public proceedings API.
  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true)
        setError(null)

        let res = null
        let payload = null

        if (role === 'professional' || role === 'admin' || isProfessional) {
          // proceeding id expected
          res = await professionalService.getProceedingNoticesById(id)
          payload = res?.data || res
        } else {
          // proceeding name expected
          const proceedingName = decodeURIComponent(id || '')
          res = await noticeService.getProceedingsNotices(proceedingName)
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
        const proc = payload?.proceeding_details || payload || {}
        setProceeding({
          proceedingName: proc.proceeding_name || proc.proceedingName || payload?.proceeding_name || decodeURIComponent(id || '') || 'N/A',
          pan: payload?.user_pan || proc.pan || payload?.pan || payload?.pan_number || 'N/A',
          assesseeName: payload?.user_name || proc.assessee_name || payload?.assessee_name || payload?.user?.name || 'N/A',
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
  }, [id, role, isProfessional])

  // Optional: fetch professional workflow details when viewing as professional
  useEffect(() => {
    const fetchWorkflow = async () => {
      if (!(role === 'professional') || !id) return
      try {
        const res = await professionalWorkflowService.getWorkflow(id)
        const wf = res?.data
        if (!wf) return
        if (wf.notice) {
          setNotices(prev => (prev && prev.length > 0) ? prev : [{ ...wf.notice }])
        }
        // merge additional proceeding info
        if (wf.proceeding_details) {
          setProceeding(prev => ({ ...(prev || {}), assessmentYear: wf.proceeding_details.assessment_year || prev?.assessmentYear }))
        }
      } catch (e) {
        console.warn('Workflow fetch failed:', e)
      }
    }
    fetchWorkflow()
  }, [id, role])

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
      const res = await noticeService.getResponse(noticeId)
      const payload = res?.data || {}
      // For brevity, just open response modal or log
      console.log('Response payload', payload)
      alert('Response details loaded (check console)')
    } catch (err) {
      console.warn('Fetch response failed', err)
      alert('Failed to load response details')
    }
  }

  const handleAdjournment = async (item) => {
    try {
      const noticeId = item?.notice_id || item?.id
      const res = await noticeService.getAdjournment(noticeId)
      console.log('Adjournment payload', res?.data)
      alert('Adjournment details loaded (check console)')
    } catch (err) {
      console.warn('Adjournment fetch failed', err)
      alert('Failed to load adjournment details')
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
      <div style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0,1fr))', gap: 16 }}>
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
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 110px' }}>
                <div style={{ padding: '14px 16px', borderRight: '0.5px solid #e2e8f0' }}>
                  <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>Section</p>
                  <p style={{ fontSize: 24, fontWeight: 500, color: '#1e293b', lineHeight: 1.1 }}>{n.section || extractSection(n.description) || "—"}</p>
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
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  )
}
