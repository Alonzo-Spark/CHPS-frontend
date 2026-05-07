import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Building2, Globe, Accessibility } from 'lucide-react'
import './LoginPage.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
    setError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.email.trim() || !form.password) {
      setError('Please enter both email and password.')
      return
    }
    setLoading(true)
    const result = await login(form.email.trim(), form.password)
    setLoading(false)
    if (result.success) {
      navigate(result.role === 'admin' ? '/admin/dashboard' : '/staff/dashboard')
    } else {
      setError(result.message)
    }
  }

  return (
    <div className="login-root">
      {/* Top nav */}
      <header className="login-nav">
        <div className="login-nav__brand">
          <Building2 size={20} />
          <span>Audit Notification Manager</span>
        </div>
        <div className="login-nav__actions">
          <button className="nav-icon-btn"><Globe size={18} /><span>English</span></button>
          <button className="nav-icon-btn"><Accessibility size={18} /></button>
        </div>
      </header>

      {/* Center form */}
      <main className="login-main">
        <div className="login-card">
          <h1 className="login-title">Login</h1>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={submit} noValidate>
            <div className="field-group">
              <label className="field-label">Email:</label>
              <input
                className="field-input"
                type="email"
                name="email"
                placeholder="Enter email"
                value={form.email}
                onChange={handle}
                autoComplete="email"
              />
            </div>

            <div className="field-group">
              <label className="field-label">Password:</label>
              <div className="pass-wrap">
                <input
                  className="field-input"
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={handle}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="pass-toggle"
                  onClick={() => setShowPass(v => !v)}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <label className="show-pass-check">
              <input
                type="checkbox"
                checked={showPass}
                onChange={e => setShowPass(e.target.checked)}
              />
              <span>show password</span>
            </label>

            <button className="signin-btn" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="login-links">
            <a href="#" className="link-blue">Forgot username/password?</a>
            <p>Don't have account? <Link to="/register" className="link-blue">Sign up</Link></p>
          </div>
        </div>

        {/* Info box */}
        <div className="info-card">
          <div className="info-card__icon">ℹ</div>
          <div>
            <strong>Know about your User ID</strong>
            <p>Your User ID is the unique identifier associated with your account for secure access to the Audit Notification Manager.</p>
          </div>
        </div>

        {/* Demo credentials hint */}
        <div className="demo-hint">
          <strong>Demo:</strong>&nbsp;
          admin@test.com / admin123 &nbsp;|&nbsp; staff@test.com / staff123
        </div>
      </main>

      {/* Footer */}
      <footer className="login-footer">
        <div className="footer-left">
          <span>© 2024 Audit Notification Manager. All rights reserved.</span>
          <small>Secure Institutional Portal | Version 4.2.1-stable</small>
        </div>
        <div className="footer-links">
          <a href="#">PRIVACY POLICY</a>
          <a href="#">TERMS OF SERVICE</a>
          <a href="#">ACCESSIBILITY</a>
          <a href="#">SUPPORT</a>
        </div>
      </footer>
    </div>
  )
}
