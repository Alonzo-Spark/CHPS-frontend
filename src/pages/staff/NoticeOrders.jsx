import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Filter, FileText, FileType } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { noticeService } from '../../services'

const statusBadge = (status = 'pending') => {
  const map = {
    pending: { bg: '#fffbeb', color: '#92400e', border: '#fcd34d', label: 'Pending' },
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
  const [timeline, setTimeline] = useState([])
  const [proceeding, setProceeding] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await noticeService.getNoticeById(id)
        const response = res.data || {}
        const proceedingData = {
          ...(response.proceeding_details || {}),
          user_name: response.user_name,
          user_pan: response.user_pan,
        }

        console.log('API Response:', response)
        console.log('Proceeding:', proceedingData)
        console.log('Orders:', response.notice_orders)

        setProceeding(proceedingData)
        setNotices(Array.isArray(response.notice_orders) ? response.notice_orders : [])
        setTimeline(Array.isArray(response.activity_timeline) ? response.activity_timeline : [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id])

  const handleViewPdf = (noticeId) => {
    window.open(`http://localhost:8000/api/notices/${noticeId}/download`, '_blank')
  }

  const extractSection = (desc = '') => {
    const m = desc.match(/\d+\(\d+\)|\d+[A-Z]?/)
    return m ? m[0] : '—'
  }

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '0.5px solid #cbd5e1', borderRadius: 8, padding: '7px 12px', background: '#fff' }}>
              <Search size={13} color="#94a3b8" />
              <input placeholder="Search by DIN / Notice ID…" style={{ border: 'none', outline: 'none', fontSize: 12, color: '#1e293b', background: 'transparent', width: 200 }} />
            </div>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: '#fff', color: '#64748b', border: '0.5px solid #e2e8f0', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
              <Filter size={13} /> Filter
            </button>
          </div>
        </div>

        {/* Proceeding Details */}
        <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 10, padding: '14px 18px', marginBottom: 18 }}>
          <p style={{ fontSize: 10, fontWeight: 500, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 11 }}>Proceeding details</p>
          {loading ? (
            <p style={{ fontSize: 12, color: '#94a3b8' }}>Loading...</p>
          ) : proceeding ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0,1fr))', gap: 16 }}>
              {[
                { label: 'Proceeding name', value: proceeding.proceeding_name, small: true },
                { label: 'PAN', value: proceeding.user_pan || proceeding.pan || proceeding.pan_number || proceeding.user_pan || 'N/A', mono: true },
                { label: 'Assessee name', value: proceeding.user_name || proceeding.assessee_name || 'N/A', small: true },
                { label: 'Assessment year', value: proceeding.assessment_year },
                { label: 'Financial year', value: proceeding.financial_year },
                { label: 'Applicable act', value: proceeding.applicable_act || 'N/A', small: true },
              ].map(({ label, value, mono, small }) => (
                <div key={label}>
                  <p style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>{label}</p>
                  <p style={{ fontSize: small ? 12 : 13, fontWeight: 500, color: '#1e293b', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: '#94a3b8' }}>Proceeding details not found for this ID.</p>
          )}
        </div>

        <p style={{ fontSize: 13, fontWeight: 500, color: '#1e293b', marginBottom: 11 }}>
          Notice orders <span style={{ color: '#64748b', fontWeight: 400, fontSize: 12 }}>· {notices.length} orders</span>
        </p>

        {loading ? (
          <p style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>Loading notices...</p>
        ) : notices.length === 0 ? (
          <p style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No notice orders found.</p>
        ) : (
          notices.map((n) => (
            <div key={n.notice_id} style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ background: '#f8fafc', borderBottom: '0.5px solid #e2e8f0', padding: '9px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={15} color="#2563eb" />
                <p style={{ fontSize: 12, fontWeight: 500, color: '#1e293b', flex: 1 }}>
                  Reference ID: <span style={{ fontFamily: 'monospace', color: '#1d4ed8' }}>{n.reference_id || 'N/A'}</span>
                </p>
                {statusBadge(n.status || (n.is_new ? 'pending' : 'completed'))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr 110px' }}>
                <div style={{ padding: '14px 16px', borderRight: '0.5px solid #e2e8f0' }}>
                  <p style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>Section</p>
                  <p style={{ fontSize: 22, fontWeight: 500, color: '#1e293b', lineHeight: 1.1 }}>{extractSection(n.description || '')}</p>
                  <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Notice u/s</p>
                </div>
                <div style={{ padding: '14px 16px', borderRight: '0.5px solid #e2e8f0' }}>
                  <p style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>Document reference ID</p>
                  <p style={{ fontSize: 11, color: '#1d4ed8', fontFamily: 'monospace', marginTop: 2, lineHeight: 1.5 }}>{n.document_reference_id || n.reference_id || 'N/A'}</p>
                </div>
                <div style={{ padding: '14px 16px', borderRight: '0.5px solid #e2e8f0' }}>
                  <p style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>Description</p>
                  <p style={{ fontSize: 12, color: '#1e293b', lineHeight: 1.6, marginTop: 2 }}>{n.description || 'No description'}</p>
                  <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
                    <div>
                      <p style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>Issued on</p>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>{n.issued_on || 'N/A'}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>Response due</p>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#dc2626' }}>{n.response_due_date || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
                  <button
                    onClick={() => handleViewPdf(n.notice_id)}
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
          Showing {notices.length} of {notices.length} orders
        </p>
      </div>
    </DashboardLayout>
  )
}
