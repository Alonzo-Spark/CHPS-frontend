import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'

export default function Proceeding() {
  const { id } = useParams()
  const navigate = useNavigate()

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Dashboard', path: '/staff/dashboard' }, { label: `Proceeding #${id}` }]}>
      <div style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, cursor: 'pointer' }} onClick={() => navigate(-1)}>
          <ArrowLeft size={14} color="#64748b" />
          <span style={{ fontSize: 12, color: '#64748b' }}>Back</span>
        </div>
        <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 12, padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
          <p style={{ fontSize: 14 }}>Proceeding #{id} details loaded from API.</p>
          <button
            onClick={() => navigate(`/staff/notice-orders/${id}`)}
            style={{ marginTop: 16, padding: '8px 18px', background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, cursor: 'pointer' }}
          >
            View Notice Orders
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
