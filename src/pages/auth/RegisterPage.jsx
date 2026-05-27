import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ShieldCheck, User, Mail, Phone, Lock } from 'lucide-react'
import { authService } from '../../services'

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', phone_number: '', role: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!form.username || !form.email || !form.phone_number || !form.role) {
      setError('All fields are required.'); return
    }
    setLoading(true)
    try {
      const res = await authService.register(form)
      setSuccess(res.data?.message || 'Your registration is pending admin approval. You will receive an email with the setup link once approved.')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', border: '1px solid #d1d5db', borderRadius: 8,
    padding: '10px 14px 10px 38px', fontSize: 13, outline: 'none', color: '#1e293b', background: '#fff'
  }
  const iconStyle = { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f4ff 0%, #e8edf8 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 52, height: 52, background: '#1e3a8a', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <ShieldCheck size={28} color="#fff" />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b' }}>Audit Notification Manager</h1>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>System Identity Registration</p>
      </div>

      {/* Card */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '32px 36px', width: '100%', maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>Account Creation</h2>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 24 }}>Complete your profile to access the audit portal.</p>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#dc2626' }}>{error}</div>
        )}

        {success ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '16px', fontSize: 13, color: '#16a34a', lineHeight: 1.6, marginBottom: 24 }}>
              <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Registration Requested!</p>
              {success}
            </div>
            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                background: '#2563eb',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: 8,
                padding: '12px 24px',
                fontSize: 13,
                fontWeight: 600
              }}
            >
              Return to Login Page
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 5 }}>Username</label>
              <div style={{ position: 'relative' }}>
                <User size={14} style={iconStyle} />
                <input type="text" placeholder="j.doe_audit" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 5 }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={iconStyle} />
                <input type="email" placeholder="name@agency.gov" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 5 }}>Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={14} style={iconStyle} />
                <input type="tel" placeholder="+91 (987) 654-3210" value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 5 }}>Access Role</label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={iconStyle} />
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                >
                  <option value="">Select assigned role</option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                  <option value="professor">Professor</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '12px', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {loading ? 'Processing...' : 'Complete Registration →'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
          <p style={{ fontSize: 13, color: '#64748b' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>Log In</Link>
          </p>
        </div>
      </div>

      <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 20, maxWidth: 380 }}>
        This is a secure internal government management system. By registering, you agree to the{' '}
        <span style={{ color: '#1e3a8a', fontWeight: 600 }}>Institutional Data Access Policy</span> and acknowledge that all actions are logged for audit purposes.
      </p>
    </div>
  )
}
