import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProfessorDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 12, padding: '32px 40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>Professor Dashboard</h2>
        <p style={{ color: '#64748b', fontSize: 13 }}>Welcome, {user?.username}</p>
        <button onClick={() => { logout(); navigate('/login') }} style={{ marginTop: 20, padding: '8px 20px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}>Logout</button>
      </div>
    </div>
  )
}
