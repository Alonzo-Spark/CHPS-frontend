import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { dashboardService } from '../../services'

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sumRes = await dashboardService.getSummary()
        setSummary(sumRes.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', padding: '20px 22px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>Admin Dashboard</h1>
        <p style={{ color: '#64748b', fontSize: 14 }}>Welcome back, {user?.username}</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Users', value: summary?.total_users ?? '—', color: '#2563eb', sub: '↑ +12%', subColor: '#16a34a' },
          { label: 'Pending Tasks', value: summary?.pending_notices ?? '—', color: '#dc2626', sub: 'Due today', subColor: '#64748b' },
          { label: 'Users', value: summary?.active_users ?? '—', color: '#1e293b', sub: 'Active', subColor: '#64748b' },
        ].map(({ label, value, color, sub, subColor }) => (
          <div key={label} style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 10, padding: '18px 20px' }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.07em' }}>{label}</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
              <p style={{ fontSize: 28, fontWeight: 700, color }}>{loading ? '...' : value}</p>
              <span style={{ fontSize: 11, color: subColor, fontWeight: 600 }}>{sub}</span>
            </div>
            <div style={{ height: 3, background: color, borderRadius: 2, width: 44, marginTop: 12 }}></div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 12, padding: '32px 40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>Admin Panel</h2>
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>Manage users, notices, and system settings</p>
        <button onClick={() => { logout(); navigate('/login') }} style={{ padding: '8px 20px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}>Logout</button>
      </div>
    </div>
  )
}
