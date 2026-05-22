import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { noticeService } from '../../services'

const statusBadge = (status) => {
  const styles = {
    'Assigned': { background: '#dbeafe', color: '#0c4a6e', border: '1px solid #bfdbfe' },
    'Reviewing': { background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' },
    'Approved': { background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' },
    'Closed': { background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' },
    'In Progress': { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' },
    'Pending': { background: '#fffbeb', color: '#92400e', border: '1px solid #fcd34d' },
  }
  const s = styles[status] || styles['In Progress']
  return (
    <span style={{ ...s, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
      {status}
    </span>
  )
}

const formatDate = (date) => {
  if (!date || date === '-') return '-'
  try {
    return new Date(date).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return date
  }
}

export default function Proceeding() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProceedingDetails = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log('Fetching proceeding details for notice ID:', id)
        
        const response = await noticeService.getNoticeById(id)
        console.log('Proceeding API Response:', response)
        
        if (response?.data) {
          setData(response.data)
        } else {
          setError('No data received from server')
        }
      } catch (err) {
        console.error('Failed to fetch proceeding details:', err)
        setError(err?.message || 'Failed to load proceeding details')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchProceedingDetails()
    }
  }, [id])

  if (loading) {
    return (
      <DashboardLayout breadcrumbs={[{ label: 'Dashboard', path: '/staff/dashboard' }, { label: `Notice #${id}` }]}>
        <div style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, cursor: 'pointer' }} onClick={() => navigate('/staff/dashboard')}>
            <ArrowLeft size={14} color="#64748b" />
            <span style={{ fontSize: 12, color: '#64748b' }}>Back</span>
          </div>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ color: '#94a3b8' }}>Loading notice details...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !data) {
    return (
      <DashboardLayout breadcrumbs={[{ label: 'Dashboard', path: '/staff/dashboard' }, { label: `Notice #${id}` }]}>
        <div style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, cursor: 'pointer' }} onClick={() => navigate('/staff/dashboard')}>
            <ArrowLeft size={14} color="#64748b" />
            <span style={{ fontSize: 12, color: '#64748b' }}>Back</span>
          </div>
          <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 12, padding: '20px', display: 'flex', gap: 12 }}>
            <AlertCircle size={20} color="#dc2626" />
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#991b1b' }}>Error Loading Notice</p>
              <p style={{ fontSize: 12, color: '#7f1d1d', marginTop: 4 }}>{error || 'Failed to load proceeding details'}</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const proceedingDetails = data?.proceeding_details || {}
  const noticeOrders = data?.notice_orders || []
  const currentNotice = noticeOrders[0] || {}
  const activityTimeline = data?.activity_timeline || []

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Dashboard', path: '/staff/dashboard' }, { label: `Notice #${id}` }]}>
      <div style={{ padding: '20px 22px' }}>
        
        {/* BACK BUTTON */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, cursor: 'pointer' }} onClick={() => navigate('/staff/dashboard')}>
          <ArrowLeft size={14} color="#64748b" />
          <span style={{ fontSize: 12, color: '#64748b' }}>Back</span>
        </div>

        {/* MAIN CONTAINER */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          
          {/* HEADER */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 16 }}>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                  {proceedingDetails.proceeding_name || 'Notice Details'}
                </h1>
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>
                  Reference: {currentNotice.reference_id || 'N/A'}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Status</p>
                {statusBadge(currentNotice.workflow_status || 'Pending')}
              </div>
            </div>
          </div>

          {/* PROCEEDING DETAILS SECTION */}
          <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>Proceeding Information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              
              <div>
                <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, margin: 0, marginBottom: 4 }}>Assessee Name</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>
                  {proceedingDetails.assessee_name || data.user_name || 'N/A'}
                </p>
              </div>

              <div>
                <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, margin: 0, marginBottom: 4 }}>Assessment Year</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>
                  {proceedingDetails.assessment_year || 'N/A'}
                </p>
              </div>

              <div>
                <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, margin: 0, marginBottom: 4 }}>Proceeding Type</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>
                  {proceedingDetails.proceeding_type || 'N/A'}
                </p>
              </div>

              <div>
                <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, margin: 0, marginBottom: 4 }}>Applicable Act</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>
                  {proceedingDetails.applicable_act || 'N/A'}
                </p>
              </div>

              <div>
                <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, margin: 0, marginBottom: 4 }}>Status</p>
                {statusBadge(proceedingDetails.status || 'Pending')}
              </div>

              <div>
                <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, margin: 0, marginBottom: 4 }}>PAN</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>
                  {data.user_pan || 'N/A'}
                </p>
              </div>

              <div>
                <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, margin: 0, marginBottom: 4 }}>Financial Year</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>
                  {proceedingDetails.financial_year || '-'}
                </p>
              </div>

              <div>
                <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, margin: 0, marginBottom: 4 }}>Limitation Date</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>
                  {formatDate(proceedingDetails.proceeding_limitation_date)}
                </p>
              </div>

            </div>
          </div>

          {/* NOTICE DETAILS SECTION */}
          {currentNotice.notice_id && (
            <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>Notice Details</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                
                <div>
                  <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, margin: 0, marginBottom: 4 }}>Notice ID</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>
                    {currentNotice.notice_id}
                  </p>
                </div>

                <div>
                  <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, margin: 0, marginBottom: 4 }}>Issued On</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>
                    {formatDate(currentNotice.issued_on)}
                  </p>
                </div>

                <div>
                  <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, margin: 0, marginBottom: 4 }}>Due Date</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: currentNotice.due_date ? '#dc2626' : '#1e293b', margin: 0 }}>
                    {formatDate(currentNotice.due_date) || 'N/A'}
                  </p>
                </div>

                <div>
                  <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, margin: 0, marginBottom: 4 }}>Workflow Status</p>
                  {statusBadge(currentNotice.workflow_status || 'Pending')}
                </div>

                {currentNotice.notice_type && (
                  <div>
                    <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, margin: 0, marginBottom: 4 }}>Notice Type</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>
                      {currentNotice.notice_type}
                    </p>
                  </div>
                )}

                {currentNotice.description && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, margin: 0, marginBottom: 4 }}>Description</p>
                    <p style={{ fontSize: 13, color: '#334155', margin: 0, whiteSpace: 'pre-wrap' }}>
                      {currentNotice.description}
                    </p>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* WORKFLOW TIMELINE SECTION */}
          <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>Workflow Timeline</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
              
              {['assigned', 'reviewing', 'approved', 'closed'].map((stage) => {
                const stageLabel = stage.charAt(0).toUpperCase() + stage.slice(1)
                const notes = currentNotice[`${stage}_notes`]
                const updatedAt = currentNotice[`${stage}_updated_at`]
                const hasData = notes || updatedAt
                
                return (
                  <div
                    key={stage}
                    style={{
                      padding: 16,
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      background: hasData ? '#f0fdf4' : '#f8fafc'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      {hasData ? (
                        <CheckCircle size={16} color="#16a34a" />
                      ) : (
                        <Clock size={16} color="#94a3b8" />
                      )}
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0 }}>
                        {stageLabel}
                      </p>
                    </div>
                    {updatedAt && (
                      <p style={{ fontSize: 12, color: '#64748b', margin: 0, marginBottom: 8 }}>
                        {formatDate(updatedAt)}
                      </p>
                    )}
                    {notes && (
                      <p style={{ fontSize: 12, color: '#334155', margin: 0, fontStyle: 'italic' }}>
                        "{notes}"
                      </p>
                    )}
                    {!hasData && (
                      <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Pending</p>
                    )}
                  </div>
                )
              })}

            </div>
          </div>

          {/* ACTIVITY TIMELINE */}
          {activityTimeline && activityTimeline.length > 0 && (
            <div style={{ padding: '24px' }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>Activity Timeline</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activityTimeline.map((activity, idx) => (
                  <div key={idx} style={{ padding: 12, background: '#f8fafc', borderRadius: 8, borderLeft: '3px solid #2563eb' }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', margin: 0 }}>
                      {activity.activity_title || 'Activity'}
                    </p>
                    {activity.activity_date && (
                      <p style={{ fontSize: 11, color: '#64748b', margin: 0, marginTop: 4 }}>
                        {formatDate(activity.activity_date)}
                      </p>
                    )}
                    {activity.activity_description && (
                      <p style={{ fontSize: 12, color: '#475569', margin: 0, marginTop: 4 }}>
                        {activity.activity_description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </DashboardLayout>
  )
}
