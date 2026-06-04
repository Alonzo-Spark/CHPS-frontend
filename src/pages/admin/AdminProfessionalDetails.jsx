import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { adminService } from '../../services'
import apiService from '../../services/api'
import { ArrowLeft } from 'lucide-react'

export default function AdminProfessionalDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return;
    setLoading(true)

    Promise.all([
      apiService.get(`/api/professionals/${id}/users`).catch(() => ({ data: [] }))
    ])
    .then(([usersRes]) => {
      const allUsersData = usersRes?.data?.items || usersRes?.data || []
      const allUsers = Array.isArray(allUsersData) ? allUsersData : []

      const filtered = allUsers.filter(u => (u.role || '').toLowerCase() === 'client')
      setClients(filtered)
    })
    .catch(err => {
      console.warn('Failed to load professional clients:', err)
      setClients([])
    })
    .finally(() => setLoading(false))
  }, [id])

  // Top Cards logic
  const totalClients = clients.length
  const activeClients = clients.filter(c => (c.status || '').toUpperCase() === 'ACTIVE').length
  const pendingClients = clients.filter(c => (c.status || '').toUpperCase() === 'PENDING').length
  const inactiveClients = clients.filter(c => ['DISABLED', 'BLOCKED', 'INACTIVE'].includes((c.status || '').toUpperCase())).length

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Admin Dashboard', path: '/admin/dashboard' }, { label: 'Professional Details' }]}>
      <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', width: '100%', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: '#fff', border: '1px solid #e2e8f0', cursor: 'pointer' }}
          >
            <ArrowLeft size={18} color="#64748b" />
          </button>
          <h1 style={{ fontSize: 25, fontWeight: 700, color: '#1e293b' }}>Assigned Clients</h1>
        </div>

        {/* SUMMARY CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <p style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Total Clients</p>
            <p style={{ color: '#0f172a', fontSize: 28, fontWeight: 700, marginTop: 4 }}>{totalClients}</p>
          </div>
          <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <p style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Active</p>
            <p style={{ color: '#16a34a', fontSize: 28, fontWeight: 700, marginTop: 4 }}>{activeClients}</p>
          </div>
          <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <p style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Inactive</p>
            <p style={{ color: '#64748b', fontSize: 28, fontWeight: 700, marginTop: 4 }}>{inactiveClients}</p>
          </div>
          <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <p style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Pending</p>
            <p style={{ color: '#d97706', fontSize: 28, fontWeight: 700, marginTop: 4 }}>{pendingClients}</p>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
          <div className="admin-dashboard-list-container" style={{ flex: 1, width: '100%' }}>
            {/* Header Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', width: '100%', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Client Name', 'Email', 'PAN Number', 'Status'].map(h => (
                <div key={h} style={{ padding: '14px 20px', color: '#64748b', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', textAlign: 'left' }}>{h}</div>
              ))}
            </div>

            {/* Data Rows */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 14 }}>Loading...</div>
            ) : clients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 14 }}>No assigned clients found.</div>
            ) : (
              clients.map((c, i) => (
                <div key={c.client_id || c.id || i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', width: '100%', borderBottom: '0.5px solid #f1f5f9', alignItems: 'center' }}>
                  <div style={{ padding: '14px 20px', color: '#1e293b', fontWeight: 600, fontSize: 14 }}>
                    {c.client_name || c.name || 'N/A'}
                  </div>
                  <div style={{ padding: '14px 20px', color: '#64748b', fontSize: 14 }}>{c.client_email || c.email || 'N/A'}</div>
                  <div style={{ padding: '14px 20px', color: '#64748b', fontSize: 14 }}>{c.client_pan || c.pan_number || c.pan || 'N/A'}</div>
                  <div style={{ padding: '14px 20px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 9px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 600,
                      background: (c.status || '').toUpperCase() === 'ACTIVE' ? '#dcfce7' : 
                                  (c.status || '').toUpperCase() === 'PENDING' ? '#fef9c3' : '#f1f5f9',
                      color: (c.status || '').toUpperCase() === 'ACTIVE' ? '#166534' : 
                             (c.status || '').toUpperCase() === 'PENDING' ? '#854d0e' : '#475569',
                    }}>
                      {c.status || 'N/A'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
