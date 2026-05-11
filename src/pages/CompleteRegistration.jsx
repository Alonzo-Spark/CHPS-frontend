import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Shield, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../services/api'
import './CompleteRegistration.css'

const PASSWORD_RULES = [
  { id: 'length', label: 'At least 12 characters', test: (value) => value.length >= 12 },
  { id: 'upper', label: 'One uppercase letter', test: (value) => /[A-Z]/.test(value) },
  { id: 'lower', label: 'One lowercase letter', test: (value) => /[a-z]/.test(value) },
  { id: 'number', label: 'One number', test: (value) => /\d/.test(value) },
  { id: 'symbol', label: 'One symbol', test: (value) => /[^A-Za-z0-9]/.test(value) },
]

function getSearchValue(searchParams, keys) {
  for (const key of keys) {
    const value = searchParams.get(key)
    if (value && value.trim()) return value.trim()
  }

  return ''
}

function getErrorMessage(error) {
  const fallback = 'Registration could not be completed. Please try again.'
  const message = error.normalizedMessage || error.response?.data?.detail || error.message || fallback

  if (Array.isArray(message)) {
    return message.map((item) => item.msg || String(item)).join(', ')
  }

  const normalized = String(message)
  const lower = normalized.toLowerCase()

  if (lower.includes('expired')) return 'This verification link has expired. Please request a new verification email.'
  if (lower.includes('invalid') && lower.includes('token')) return 'This verification link is invalid. Please use the most recent email link.'
  if (lower.includes('already')) return 'This registration has already been completed. You can sign in from the login page.'
  if (lower.includes('weak') || lower.includes('password')) return normalized

  return normalized || fallback
}

export default function CompleteRegistration() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTimer = useRef(null)
  const requestInFlight = useRef(false)

  const token = useMemo(
    () => getSearchValue(searchParams, ['token', 'verification_token', 'code', 'registration_token']),
    [searchParams],
  )

  const [form, setForm] = useState({ password: '', confirm_password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [status, setStatus] = useState(token ? 'idle' : 'missing_token')

  useEffect(() => {
    setStatus(token ? 'idle' : 'missing_token')
    setApiError(token ? '' : 'Missing verification token. Please open the complete registration link from your email.')
  }, [token])

  useEffect(() => {
    return () => {
      if (redirectTimer.current) window.clearTimeout(redirectTimer.current)
    }
  }, [])

  const passedRules = PASSWORD_RULES.filter((rule) => rule.test(form.password)).map((rule) => rule.id)

  const validate = () => {
    const nextErrors = {}

    if (!token) {
      nextErrors.token = 'Missing verification token. Please open the full link from your email.'
    }

    if (!form.password) {
      nextErrors.password = 'Password is required.'
    } else if (passedRules.length !== PASSWORD_RULES.length) {
      nextErrors.password = 'Password must meet all strength requirements.'
    }

    if (!form.confirm_password) {
      nextErrors.confirm_password = 'Please confirm your password.'
    } else if (form.password !== form.confirm_password) {
      nextErrors.confirm_password = 'Passwords do not match.'
    }

    return nextErrors
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => ({ ...previous, [name]: '' }))
    setApiError('')
  }

  const submit = async (event) => {
    event.preventDefault()

    if (requestInFlight.current || status === 'success') return

    const validationErrors = validate()
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors)
      if (validationErrors.token) setApiError(validationErrors.token)
      return
    }

    requestInFlight.current = true
    setStatus('submitting')
    setApiError('')

    try {
      await api.completeRegistration({
        token,
        password: form.password,
        confirm_password: form.confirm_password,
      })

      localStorage.removeItem('audit_pending_verification_email')
      setStatus('success')
      toast.success('Registration completed successfully.')

      redirectTimer.current = window.setTimeout(() => {
        navigate('/login', { replace: true })
      }, 1800)
    } catch (error) {
      setStatus('failure')
      setApiError(getErrorMessage(error))
    } finally {
      requestInFlight.current = false
    }
  }

  const isSubmitting = status === 'submitting'
  const isSuccess = status === 'success'
  const isTokenMissing = status === 'missing_token'

  return (
    <main className="complete-root">
      <section className="complete-panel" aria-labelledby="complete-title">
        <header className="complete-header">
          <div className="complete-brand-icon" aria-hidden="true">
            <ShieldCheck size={32} />
          </div>
          <h1 id="complete-title">Audit Notification Manager</h1>
          <p>Secure Account Finalization</p>
        </header>

        <div className="complete-card">
          <div className="complete-card__intro">
            <h2>Set Your Credentials</h2>
            <p>Please choose a secure password to complete your institutional registration.</p>
          </div>

          {(apiError || errors.token) && (
            <div className="complete-alert complete-alert--error" role="alert">
              {apiError || errors.token}
            </div>
          )}

          {isSuccess && (
            <div className="complete-alert complete-alert--success" role="status">
              <CheckCircle2 size={18} />
              Registration completed successfully. Redirecting to login...
            </div>
          )}

          <form className="complete-form" onSubmit={submit} noValidate>
            <div className="complete-field">
              <label htmlFor="completion-password">PASSWORD</label>
              <div className={`complete-input-wrap ${errors.password ? 'complete-input-wrap--error' : ''}`}>
                <Lock size={20} aria-hidden="true" />
                <input
                  id="completion-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter secure password"
                  autoComplete="new-password"
                  disabled={isSubmitting || isSuccess || isTokenMissing}
                />
                <button
                  type="button"
                  className="complete-visibility-btn"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={isSubmitting || isSuccess || isTokenMissing}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="complete-help">Minimum 12 characters, including symbols and numbers.</p>
              {errors.password && <span className="complete-error">{errors.password}</span>}
            </div>

            <div className="complete-field">
              <label htmlFor="completion-confirm-password">CONFIRM PASSWORD</label>
              <div className={`complete-input-wrap ${errors.confirm_password ? 'complete-input-wrap--error' : ''}`}>
                <Shield size={20} aria-hidden="true" />
                <input
                  id="completion-confirm-password"
                  name="confirm_password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={form.confirm_password}
                  onChange={handleChange}
                  placeholder="Confirm secure password"
                  autoComplete="new-password"
                  disabled={isSubmitting || isSuccess || isTokenMissing}
                />
                <button
                  type="button"
                  className="complete-visibility-btn"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  disabled={isSubmitting || isSuccess || isTokenMissing}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirm_password && <span className="complete-error">{errors.confirm_password}</span>}
            </div>

            <div className="complete-rules" aria-label="Password strength requirements">
              {PASSWORD_RULES.map((rule) => {
                const passed = passedRules.includes(rule.id)
                return (
                  <span key={rule.id} className={passed ? 'complete-rule complete-rule--passed' : 'complete-rule'}>
                    {rule.label}
                  </span>
                )
              })}
            </div>

            <button className="complete-submit" type="submit" disabled={isSubmitting || isSuccess || isTokenMissing}>
              {isSubmitting ? 'Completing Registration...' : 'Register'}
              {!isSubmitting && <ArrowRight size={19} aria-hidden="true" />}
            </button>
          </form>

          <div className="complete-divider" />

          <div className="complete-security">
            <ShieldCheck size={20} aria-hidden="true" />
            <p>This connection is secured via enterprise-grade encryption. Your credentials are encrypted before storage.</p>
          </div>

          <Link className="complete-login-link" to="/login">
            Return to Login
          </Link>
        </div>
      </section>

      <div className="complete-status" aria-hidden="true">
        <span />
        System Status: Operational
      </div>

      <footer className="complete-footer">&copy; 2024 Institutional Audit Management. All Rights Reserved.</footer>
    </main>
  )
}
