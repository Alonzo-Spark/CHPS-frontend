import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Filter, FileText, FileType } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { noticeService } from '../../services'


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
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [filters, setFilters] = useState({ section: '', referenceId: '', date: '' })
  const [appliedFilters, setAppliedFilters] = useState({ section: '', referenceId: '', date: '' })
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [activeNotice, setActiveNotice] = useState(null)
  const [showAdjournmentModal, setShowAdjournmentModal] = useState(false)
  const [activeNoticeForAdjournment, setActiveNoticeForAdjournment] = useState(null)

  const [responseDetails, setResponseDetails] = useState(null)
  const [adjournmentDetails, setAdjournmentDetails] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true)
        // 1) Try to fetch proceeding notices by proceeding name/ID
        try {
          const res = await noticeService.getProceedingsNotices(id)
          if (res?.data) {
            setNotices(res.data.notices || [])
            setProceeding({
              proceedingName: res.data.proceeding_name || id || "N/A",
              pan: res.data.user?.pan || res.data.pan || "N/A",
              assesseeName: res.data.user?.name || res.data.assessee_name || "N/A",
              assessmentYear: res.data.assessment_year || "N/A",
              financialYear: res.data.financial_year || "N/A",
              applicableAct: res.data.applicable_act || "Income Tax Act 1961"
            })
            setLoading(false)
            return
          }
        } catch (err) {
          console.warn("Proceedings notices fetch failed, using fallback", err)
        }

        // 2) Fallback to list all notices and find proceeding
        const [noticeRes, procRes] = await Promise.all([
          noticeService.getNotices(),
          noticeService.getProceedings(),
        ])
        setNotices(noticeRes.data || [])
        const proc = procRes.data?.find(p => String(p.id) === String(id) || String(p.proceeding_name) === String(id))
        setProceeding(proc || {
          proceedingName: id || "N/A",
          pan: "N/A",
          assesseeName: "N/A",
          assessmentYear: "N/A",
          financialYear: "N/A",
          applicableAct: "Income Tax Act 1961"
        })
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id])

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
    const m = String(desc).match(/\d+\(\d+\)|\d+[A-Z]?/)
    return m ? m[0] : '—'
  }

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
      if (res?.data) {
        setResponseDetails(res.data)
      } else {
        setResponseDetails(null)
      }
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
      if (res?.data) {
        setAdjournmentDetails(res.data)
      } else {
        setAdjournmentDetails(null)
      }
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
      { label: 'Dashboard', path: '/staff/dashboard' },
      { label: 'My Assignments', path: '/staff/dashboard' },
      { label: 'Notice Orders' }
    ]}>
      <div style={{ padding: '18px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5, cursor: 'pointer' }} onClick={() => navigate(-1)}>
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

        {loading ? (
          <p style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>Loading notices...</p>
        ) : filteredNotices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b', fontSize: 13, background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 10 }}>
            No data available
          </div>
        ) : (
          filteredNotices.map((n) => (
            <div key={n.id} style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ background: '#f8fafc', borderBottom: '0.5px solid #e2e8f0', padding: '9px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={15} color="#2563eb" />
                <p style={{ fontSize: 12, fontWeight: 500, color: '#1e293b', flex: 1 }}>
                  Reference ID: <span style={{ fontFamily: 'monospace', color: '#1d4ed8' }}>{n.reference_id}</span>
                </p>
                {statusBadge(n.status || (n.is_new ? 'pending' : 'completed'))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 110px' }}>
                <div style={{ padding: '14px 16px', borderRight: '0.5px solid #e2e8f0' }}>
                  <p style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>Section</p>
                  <p style={{ fontSize: 22, fontWeight: 500, color: '#1e293b', lineHeight: 1.1 }}>{extractSection(n.description)}</p>
                  <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Notice u/s</p>

                  <div style={{ marginTop: 16 }}>
                    <p style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>Description</p>
                    <p style={{ fontSize: 12, color: '#1e293b', lineHeight: 1.6, marginTop: 2 }}>{n.description}</p>
                  </div>
                </div>
                <div style={{ padding: '14px 16px', borderRight: '0.5px solid #e2e8f0' }}>
                  <p style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>Document reference ID</p>
                  <p style={{ fontSize: 11, color: '#1d4ed8', fontFamily: 'monospace', marginTop: 2, lineHeight: 1.5 }}>{n.document_reference_id || n.reference_id}</p>
                  <div style={{ marginTop: 16 }}>
                    <p style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>Issued on</p>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>{n.issued_on}</p>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <p style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>Response due</p>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#dc2626' }}>{n.response_due_date || n.due_date}</p>
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

        <p style={{ fontSize: 12, color: '#64748b', textAlign: 'center', padding: '6px 0' }}>
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
                  {responseDetails?.response_date || "29-Dec-2025"}
                </p>
              </div>
              
              <div>
                <p style={{ fontSize: '11px', fontWeight: 500, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '6px' }}>
                  Response
                </p>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#334155', lineHeight: '1.5' }}>
                  {responseDetails?.response_text || responseDetails?.response || `Response submitted against notice u/s ${extractSection(activeNotice.description) !== '—' ? extractSection(activeNotice.description) : '148'} with acknowledgement number 118392270291225`}
                </p>
              </div>

              <div>
                <p style={{ fontSize: '11px', fontWeight: 500, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '6px' }}>
                  Response Filed By
                </p>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  {responseDetails?.filed_by || "SELF"}
                </p>
              </div>
            </div>

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
                <div style={{ fontWeight: 500 }}>{adjournmentDetails?.request_date || "07-Jan-2026"}</div>
                <div style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 500, textDecoration: 'none' }}>
                  {adjournmentDetails?.reason_category || "Gathering of material from client/third parties"}
                </div>
                <div style={{ fontWeight: 500 }}>{adjournmentDetails?.sought_up_to || "22-Jan-2026"}</div>
                <div style={{ fontWeight: 500 }}>{adjournmentDetails?.status || "Open"}</div>
                <div style={{ color: '#64748b' }}>{adjournmentDetails?.adjourned_date || "-"}</div>
                <div style={{ color: '#64748b' }}>{adjournmentDetails?.itd_remarks || "-"}</div>
              </div>
            </div>

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
                    {adjournmentDetails?.reason_summary || "Gathering of material from multiple sources requires time"}
                  </p>
                </div>
                
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 500, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '8px' }}>
                    Reason
                  </p>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#334155', lineHeight: '1.6' }}>
                    {adjournmentDetails?.reason_detail || "Dear Sir, We are gathering the information for submission of reply, in this regard we need some more time to obtain the required documents. Please consider our request and grant adjournment till 22nd January 2026."}
                  </p>
                </div>
              </div>
            </div>

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
