import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { clientService } from '../../services'

const formatDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-IN')
}

const displayValue = (value) => (value !== null && value !== undefined && value !== '') ? value : '—'


export default function ClientProceedings() {
  const { notice_id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [proceedings, setProceedings] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadProceedings = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await clientService.getClientProceedings(notice_id)
        const payload = res?.data || {}
        const clientData = payload.user || payload.client || {
          name: payload.name,
          pan: payload.pan
        }

        if (payload) {
          setClient(clientData || null)
          setTotal(Number(payload.total_proceedings ?? payload.totalProceedings ?? payload.total ?? 0))
          const apiProceedings = Array.isArray(payload.proceedings) ? payload.proceedings : Array.isArray(payload.data?.proceedings) ? payload.data.proceedings : []
          setProceedings(apiProceedings)
        } else {
          setError('Unable to load client proceedings.')
        }
      } catch (err) {
        console.error('ClientProceedings fetch error:', err)
        setError('Failed to load proceedings. Please check your connection.')
        setClient(null)
        setProceedings([])
        setTotal(0)
      } finally {
        setLoading(false)
      }
    }

    loadProceedings()
  }, [notice_id])

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Dashboard', path: '/staff/dashboard' }, { label: 'Clients', path: '/staff/clients' }, { label: 'Client Proceedings' }]}>
      <div style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, cursor: 'pointer' }} onClick={() => navigate('/staff/clients')}>
          <ArrowLeft size={14} color="#64748b" />
          <span style={{ fontSize: 12, color: '#64748b' }}>Back to users</span>
        </div>

        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1e293b' }}>Client Proceedings</h2>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Review all proceedings for the selected client.</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.08em' }}>Total Proceedings</div>
            <div style={{ marginTop: 8, fontSize: 24, fontWeight: 700, color: '#1e293b' }}>{loading ? '—' : total}</div>
          </div>
        </div>

        {error ? (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 18, color: '#b91c1c' }}>{error}</div>
        ) : (
          <>
            <div style={{ marginBottom: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Client Name</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#1e293b' }}>{displayValue(client?.name)}</div>
              </div>
              <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>PAN</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#1e293b' }}>{displayValue(client?.pan)}</div>
              </div>
            </div>

            <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 12, overflowX: 'auto' }}>
              {loading ? (
                <div style={{ padding: 28, textAlign: 'center', color: '#94a3b8' }}>Loading proceedings...</div>
              ) : proceedings.length === 0 ? (
                <div style={{ padding: 28, textAlign: 'center', color: '#64748b' }}>No proceedings found for this client.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 920, fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                       {['Proceeding Name', 'Type', 'Assessment Year', 'Financial Year', 'Applicable Act', 'Limitation Date', 'Status', 'Created At'].map((heading) => (
                        <th key={heading} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#475569', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase', letterSpacing: '.05em' }}>{heading}</th>
                       ))}
                    </tr>
                  </thead>
                  <tbody>
                    {proceedings.map((row) => (
                       <tr key={row.proceeding_id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                         <td style={{ padding: '12px 14px', color: '#1e293b' }}>{displayValue(row.proceeding_name)}</td>
                         <td style={{ padding: '12px 14px', color: '#475569' }}>{displayValue(row.proceeding_type)}</td>
                         <td style={{ padding: '12px 14px', color: '#475569' }}>{displayValue(row.assessment_year)}</td>
                         <td style={{ padding: '12px 14px', color: '#475569' }}>{displayValue(row.financial_year)}</td>
                         <td style={{ padding: '12px 14px', color: '#475569' }}>{displayValue(row.applicable_act)}</td>
                         <td style={{ padding: '12px 14px', color: '#1e293b' }}>{formatDate(row.proceeding_limitation_date)}</td>
                         <td style={{ padding: '12px 14px' }}>
                           {(() => {
                             const s = (row.status || (row.closure_date ? 'Closed' : 'Open')).toLowerCase()
                             const cfg = s === 'closed' ? { bg: '#f0fdf4', color: '#166534', label: 'Closed' } : s === 'submitted' ? { bg: '#fefce8', color: '#92400e', label: 'Submitted' } : { bg: '#eff6ff', color: '#1d4ed8', label: 'Open' }
                             return <span style={{ padding: '4px 10px', background: cfg.bg, color: cfg.color, borderRadius: 999, fontSize: 10, fontWeight: 600 }}>{cfg.label}</span>
                           })()}
                         </td>
                         <td style={{ padding: '12px 14px', color: '#1e293b' }}>{formatDate(row.created_at)}</td>
                       </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
