import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Landmark } from 'lucide-react'
import { authService } from '../../services'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.email || !form.password) {
      setError('All fields are required.')
      return
    }

    setLoading(true)

    try {
      // ✅ Try API login first
      const res = await authService.login({
        username: form.email,
        password: form.password
      })


      login(res.data)
      const user = res.data.user
      navigate(`/${user.role}/dashboard`)

    } catch (err) {

      // ⚠️ If API fails → use dummy login

      const dummyUser = {
        email: "staff123",
        password: "123456",
        role: "staff",
        access_token: "dummy-token-123"
      }

      if (
        form.email === dummyUser.email &&
        form.password === dummyUser.password
      ) {
        // ✅ Dummy login success
        login({
          access_token: dummyUser.access_token,
          user: {
            id: 99,
            name: "Dummy Staff",
            email: "staff@example.com",
            role: dummyUser.role
          }
        })

        navigate("/staff/dashboard")
      } else {
        setError("Invalid credentials. Please try again.")
      }

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
                placeholder="Enter email or username"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
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