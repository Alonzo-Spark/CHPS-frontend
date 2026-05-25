import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Landmark } from 'lucide-react'
import { authService } from '../../services'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const [form, setForm] = useState({ username: 'prof123', password: 'prof123' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.username || !form.password) {
      setError('All fields are required.')
      return
    }

    setLoading(true)

    // Check for dummy credentials first
    if ((form.username === 'prof123' && form.password === 'prof123') || (form.username === 'staff123' && form.password === 'staff123')) {
      const isProf = form.username === 'prof123'
      const dummyRes = {
        data: {
          access_token: isProf ? 'dummy-prof-token' : 'dummy-staff-token',
          token_type: 'bearer',
          role: isProf ? 'professional' : 'staff',
          username: isProf ? 'prof123' : 'staff123'
        }
      }
      localStorage.setItem("token", dummyRes.data.access_token)
      login(dummyRes.data)
      const normalizedRole = dummyRes.data.role.toLowerCase()
      if (normalizedRole === 'professional') {
        navigate('/professional-dashboard', { replace: true })
      } else if (normalizedRole === 'staff') {
        navigate('/staff/dashboard', { replace: true })
      }
      setLoading(false)
      return
    }

    try {
      const res = await authService.login({
        username: form.username,
        password: form.password
      })

      console.log("LOGIN RESPONSE:", res.data)
      if (res.data?.access_token) {
        localStorage.setItem("token", res.data.access_token)
      }

      login(res.data)
      const normalizedRole = (res.data?.role || '').toLowerCase()
      if (normalizedRole === 'professional') {
        navigate('/professional-dashboard', { replace: true })
      } else if (normalizedRole === 'staff') {
        navigate('/staff/dashboard', { replace: true })
      } else {
        navigate(res.data?.redirect_url || `/${normalizedRole}/dashboard`, { replace: true })
      }

    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Landmark size={20} color="#1e3a8a" />
        <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
          Audit Notification Manager
        </span>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        
        {/* Login card */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '32px 36px', width: '100%', maxWidth: 380, marginBottom: 16 }}>
          <h2 style={{ textAlign: 'center', fontSize: 18, fontWeight: 600, color: '#1e293b', marginBottom: 24 }}>
            Login
          </h2>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#dc2626' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            
            {/* Email / Username */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: '#374151', display: 'block', marginBottom: 6 }}>
                Email / Username:
              </label>
              <input
                type="text"
                name="username"
                placeholder="Enter email or username"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                style={{
                  width: '100%',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: 13,
                  outline: 'none',
                  color: '#1e293b'
                }}
              />
            </div>


            {/* Password */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: '#374151', display: 'block', marginBottom: 6 }}>
                Password:
              </label>
              <input
                type={showPw ? 'text' : 'password'}
                name="password"
                placeholder="Enter password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                style={{
                  width: '100%',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: 13,
                  outline: 'none',
                  color: '#1e293b'
                }}
              />
            </div>

            {/* Show password */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <input
                type="checkbox"
                id="showpw"
                checked={showPw}
                onChange={e => setShowPw(e.target.checked)}
                style={{ width: 14, height: 14, cursor: 'pointer' }}
              />
              <label htmlFor="showpw" style={{ fontSize: 13, color: '#374151', cursor: 'pointer' }}>
                Show password
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '12px',
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Register link */}
          <p style={{ textAlign: 'center', fontSize: 13, color: '#64748b', marginTop: 20 }}>
            Don't have account?{' '}
            <Link to="/register" style={{ color: '#2563eb', fontWeight: 500, textDecoration: 'none' }}>
              Sign up
            </Link>
          </p>
        </div>

        {/* Quick Fill / Test Credentials */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderRadius: 12,
          padding: '16px 20px',
          width: '100%',
          maxWidth: 380,
          marginBottom: 16,
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
            <span>🔑</span> Quick Fill Test Credentials
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={() => setForm({ username: 'prof123', password: 'prof123' })}
              type="button"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                fontSize: 12,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                outline: 'none'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.backgroundColor = '#f0f9ff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.backgroundColor = '#fff'; }}
            >
              <span style={{ fontWeight: 600, color: '#2563eb' }}>Professional View</span>
              <span style={{ color: '#64748b', fontFamily: 'monospace' }}>prof123 / prof123</span>
            </button>
            <button
              onClick={() => setForm({ username: 'staff123', password: 'staff123' })}
              type="button"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                fontSize: 12,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                outline: 'none'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.backgroundColor = '#f0fdf4'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.backgroundColor = '#fff'; }}
            >
              <span style={{ fontWeight: 600, color: '#16a34a' }}>Staff View</span>
              <span style={{ color: '#64748b', fontFamily: 'monospace' }}>staff123 / staff123</span>
            </button>
          </div>
        </div>

        {/* Info card */}
        <div style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: '20px 24px',
          width: '100%',
          maxWidth: 380,
          textAlign: 'center'
        }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>
            ℹ Know about your User ID
          </p>
          <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
            Your User ID is the unique identifier associated with your account for secure access to the Audit Notification Manager.
          </p>
        </div>
      </div>
    </div>
  )
}
