import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import './RegisterPage.css'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [form, setForm] = useState({
    username: '', email: '', verifyEmail: false,
    password: '', confirmPassword: '',
  })
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const handle = (e) => {
    const { name, value, type, checked } = e.target
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }))
    setErrors(p => ({ ...p, [name]: '' }))
    setApiError('')
  }

  const validate = () => {
    const e = {}
    if (!form.username.trim()) e.username = 'Username is required.'
    if (!form.email.trim()) e.email = 'Email address is required.'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email.'
    if (!form.password) e.password = 'Password is required.'
    else if (form.password.length < 6) e.password = 'Minimum 6 characters.'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match.'
    return e
  }

  const submit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    const result = await register({ 
      name: form.username, 
      email: form.email, 
      password: form.password, 
      confirmPassword: form.confirmPassword, 
      role: 'staff' 
    })
    setLoading(false)
    if (result.success) {
      navigate(result.role === 'admin' ? '/admin/dashboard' : '/staff/dashboard')
    } else {
      setApiError(result.message)
    }
  }

  return (
    <div className="reg-root">
      <div className="reg-card">
        {/* Dark header banner */}
        <div className="reg-banner">
          <div className="reg-banner__icon"><ShieldCheck size={28} /></div>
          <h1 className="reg-banner__title">Audit Portal</h1>
          <p className="reg-banner__sub">INTERNAL MANAGEMENT SYSTEM</p>
        </div>

        <div className="reg-body">
          <h2 className="reg-heading">Create Your Account</h2>
          <p className="reg-subheading">Register to manage notification compliance</p>

          {apiError && <div className="reg-api-error">{apiError}</div>}

          <form onSubmit={submit} noValidate>
            <div className="reg-field">
              <label className="reg-label">USERNAME</label>
              <input className={`reg-input ${errors.username ? 'reg-input--err' : ''}`}
                type="text" name="username" placeholder="jsmith_audit"
                value={form.username} onChange={handle} autoComplete="username" />
              {errors.username && <span className="reg-err">{errors.username}</span>}
            </div>

            <div className="reg-field">
              <label className="reg-label">EMAIL ADDRESS</label>
              <input className={`reg-input ${errors.email ? 'reg-input--err' : ''}`}
                type="email" name="email" placeholder="official@agency.gov"
                value={form.email} onChange={handle} autoComplete="email" />
              {errors.email && <span className="reg-err">{errors.email}</span>}
            </div>

            <label className="reg-check">
              <input type="checkbox" name="verifyEmail"
                checked={form.verifyEmail} onChange={handle} />
              <span>Verify email address</span>
            </label>

            <div className="reg-row">
              <div className="reg-field">
                <label className="reg-label">SET PASSWORD</label>
                <div className="pass-wrap">
                  <input className={`reg-input ${errors.password ? 'reg-input--err' : ''}`}
                    type={showPass ? 'text' : 'password'} name="password" placeholder="••••••••"
                    value={form.password} onChange={handle} autoComplete="new-password" />
                  <button type="button" className="pass-eye" onClick={() => setShowPass(v => !v)}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && <span className="reg-err">{errors.password}</span>}
              </div>

              <div className="reg-field">
                <label className="reg-label">CONFIRM PASSWORD</label>
                <div className="pass-wrap">
                  <input className={`reg-input ${errors.confirmPassword ? 'reg-input--err' : ''}`}
                    type={showConfirm ? 'text' : 'password'} name="confirmPassword" placeholder="••••••••"
                    value={form.confirmPassword} onChange={handle} autoComplete="new-password" />
                  <button type="button" className="pass-eye" onClick={() => setShowConfirm(v => !v)}>
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.confirmPassword && <span className="reg-err">{errors.confirmPassword}</span>}
              </div>
            </div>

            <button className="reg-btn" type="submit" disabled={loading}>
              {loading ? 'Creating account…' : 'Sign Up →'}
            </button>
          </form>

          <p className="reg-terms">
            By Signing Up, you agree to our{' '}
            <a href="#" className="reg-link">Terms of Services</a> and{' '}
            <a href="#" className="reg-link">Privacy Policy</a>
          </p>
        </div>

        <div className="reg-footer">
          <p>Already have an account? <Link to="/login" className="reg-link">Log In</Link></p>
        </div>
      </div>

      <div className="secure-node">
        <div className="secure-node__icon"><ShieldCheck size={14} /></div>
        <div>
          <div className="secure-node__title">SECURE ACCESS NODE</div>
          <div className="secure-node__sub">v4.2.1 Stable Production</div>
        </div>
      </div>
    </div>
  )
}
