import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react'
import { authService } from '../../services'

export default function PasswordSetupPage() {
  const [form, setForm] = useState({ password: '', confirm_password: '' })
  const [showPw, setShowPw] = useState(false)
  const [showCpw, setShowCpw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const token = searchParams.get('token') || ''

  useEffect(() => {
    if (!token) {
      setError('Missing verification token.')
      setVerifying(false)
      return
    }
    authService.verifyEmail(token)
      .then((res) => {
        setTokenValid(true)
      })
      .catch((err) => {
        setError(err.response?.data?.detail || err.response?.data?.message || 'Invalid or expired registration token.')
      })
      .finally(() => {
        setVerifying(false)
      })
  }, [token])

  const checks = {
    length: form.password.length >= 8,
    upper: /[A-Z]/.test(form.password),
    lower: /[a-z]/.test(form.password),
    digit: /[0-9]/.test(form.password),
    match: form.password === form.confirm_password && form.password.length > 0,
  }

  const allValid = Object.values(checks).every(Boolean)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!tokenValid) { setError('Invalid token. Cannot set password.'); return }
    if (!allValid) { setError('Please fix password requirements.'); return }
    setLoading(true)
    try {
      await authService.setPassword({ token, password: form.password, confirm_password: form.confirm_password })
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to set password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', border: '1px solid #d1d5db', borderRadius: 8,
    padding: '11px 42px', fontSize: 13, outline: 'none', color: '#1e293b', background: '#fff'
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f4ff 0%, #e8edf8 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 52, height: 52, background: '#1e3a8a', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <ShieldCheck size={28} color="#fff" />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b' }}>Audit Notification Manager</h1>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Secure Account Finalization</p>
      </div>

      {/* Card */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '32px 36px', width: '100%', maxWidth: 440, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e3a8a', marginBottom: 6 }}>Set Your Credentials</h2>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 24 }}>Please choose a secure password to complete your institutional registration.</p>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#dc2626' }}>{error}</div>
        )}

        {verifying ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ fontSize: 13, color: '#64748b' }}>Verifying your secure link, please wait...</p>
          </div>
        ) : !tokenValid ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ fontSize: 14, color: '#dc2626', fontWeight: 600 }}>Verification Failed</p>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>This link is invalid, expired, or has already been used.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input type={showPw ? 'text' : 'password'} placeholder="••••••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={inputStyle} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 5 }}>Minimum 8 characters, including symbols and numbers.</p>
            </div>

            {/* Live validation */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 14px', marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
              {[
                { key: 'length', label: 'Min 8 characters' },
                { key: 'upper', label: 'Uppercase letter' },
                { key: 'lower', label: 'Lowercase letter' },
                { key: 'digit', label: 'At least one digit' },
              ].map(({ key, label }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                  <span style={{ color: checks[key] ? '#16a34a' : '#94a3b8', fontWeight: 700 }}>{checks[key] ? '✓' : '○'}</span>
                  <span style={{ color: checks[key] ? '#16a34a' : '#64748b' }}>{label}</span>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 6 }}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <ShieldCheck size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: checks.match ? '#16a34a' : '#94a3b8' }} />
                <input type={showCpw ? 'text' : 'password'} placeholder="••••••••••••" value={form.confirm_password} onChange={e => setForm({ ...form, confirm_password: e.target.value })} style={inputStyle} />
                <button type="button" onClick={() => setShowCpw(!showCpw)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                  {showCpw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '13px', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {loading ? 'Setting Password...' : 'Register →'}
            </button>
          </form>
        )}

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 14px', marginTop: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldCheck size={16} color="#64748b" />
          <p style={{ fontSize: 11, color: '#64748b' }}>This connection is secured via enterprise-grade 256-bit encryption. Your credentials are encrypted before storage.</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 24 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }}></div>
        <span style={{ fontSize: 11, color: '#64748b' }}>System Status: Operational</span>
        <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto' }}>© 2024 Institutional Audit Management. All Rights Reserved.</span>
      </div>
    </div>
  )
}
