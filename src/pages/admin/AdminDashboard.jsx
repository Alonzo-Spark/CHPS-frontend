import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { dashboardService, userService } from '../../services'

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [assignResult, setAssignResult] = useState(null)
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

  const handleRunAssignment = async () => {
    try {
      setAssigning(true)
      setAssignResult(null)
      const res = await userService.runAutoAssignment()
      setAssignResult(res.data)
    } catch (err) {
      console.error(err)
      alert('Assignment failed')
    } finally {
      setAssigning(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', padding: '20px 22px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>Admin Dashboard</h1>
        <p style={{ color: '#64748b', fontSize: 14 }}>Welcome back, {user?.name || user?.username}</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Users', value: summary?.total_users ?? '—', color: '#2563eb', sub: '↑ +12%', subColor: '#16a34a' },
          { label: 'Pending Tasks', value: summary?.pending_notices ?? '—', color: '#dc2626', sub: 'Due today', subColor: '#64748b' },
          { label: 'Active Users', value: summary?.active_users ?? '—', color: '#1e293b', sub: 'Active', subColor: '#64748b' },
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

      <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 12, padding: '32px 40px', textAlign: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>Admin Panel</h2>
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>Manage users, notices, and system settings</p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          <button 
            disabled={assigning}
            onClick={handleRunAssignment}
            style={{ padding: '10px 24px', background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: 8, cursor: assigning ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600, opacity: assigning ? 0.7 : 1 }}
          >
            {assigning ? 'Running Assignment...' : 'Run Auto-Assignment'}
          </button>
          
          <button onClick={() => { logout(); navigate('/login') }} style={{ padding: '10px 24px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Logout</button>
        </div>

        {assignResult && (
          <div style={{ marginTop: 24, padding: '16px 20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, textAlign: 'left', display: 'inline-block' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#166534', marginBottom: 8 }}>Assignment Results:</p>
            <div style={{ display: 'flex', gap: 20, fontSize: 12, color: '#166534' }}>
              <span>Processed: <strong>{assignResult.processed}</strong></span>
              <span>Assigned: <strong>{assignResult.assigned}</strong></span>
              <span>Skipped: <strong>{assignResult.skipped}</strong></span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

