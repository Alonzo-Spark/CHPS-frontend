import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { professionalService } from '../../services'

export default function ProfessorDashboard() {
  const { user, logout } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (user?.id) {
      professionalService.getProfessionalUsers(user.id, { skip: 0, limit: 50 })
        .then(res => setUsers(res.data.items || res.data))
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [user])

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', padding: '40px 24px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 12, padding: '24px 32px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b' }}>Professor Dashboard</h2>
            <p style={{ color: '#64748b', fontSize: 14 }}>Welcome, {user?.name || user?.username}</p>
          </div>
          <button onClick={() => { logout(); navigate('/login') }} style={{ padding: '8px 20px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Logout</button>
        </div>

        <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '0.5px solid #e2e8f0', background: '#f8fafc' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1e293b' }}>Your Assigned Users</h3>
            <p style={{ fontSize: 12, color: '#64748b' }}>Users currently assigned to you for audit review</p>
          </div>

          <div style={{ padding: 0 }}>
            {loading ? (
              <p style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading assigned users...</p>
            ) : users.length === 0 ? (
              <p style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No users assigned yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ padding: '12px 24px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Name</th>
                    <th style={{ padding: '12px 24px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Email</th>
                    <th style={{ padding: '12px 24px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 24px', fontWeight: 500 }}>{u.name}</td>
                      <td style={{ padding: '12px 24px', color: '#64748b' }}>{u.email}</td>
                      <td style={{ padding: '12px 24px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 12, background: '#f0fdf4', color: '#166534', fontSize: 11, fontWeight: 600 }}>
                          {u.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

