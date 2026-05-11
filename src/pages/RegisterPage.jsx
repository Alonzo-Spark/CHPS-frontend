import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ShieldCheck, User, Mail, Phone } from 'lucide-react'
import toast from 'react-hot-toast'
import { API_BASE_URL, api } from '../services/api'
import './RegisterPage.css'

const DEFAULT_FORM = {
  full_name: '',
  email: '',
  phone_number: '',
  role: '',
}

function normalizeRole(role) {
  const normalized = String(role || '').trim().toLowerCase()
  if (normalized === 'admin') return 'admin'
  if (normalized === 'professor') return 'professor'
  return normalized === 'staff' ? 'staff' : ''
}

function getErrorMessage(error) {
  return error.normalizedMessage || error.response?.data?.detail || error.message || 'Unable to complete registration.'
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const requestInFlight = useRef(false)

  const [form, setForm] = useState(() => {
    try {
      const saved = localStorage.getItem('audit_reg_form')
      if (!saved) return DEFAULT_FORM

      const parsed = JSON.parse(saved)
      return {
        ...DEFAULT_FORM,
        ...parsed,
        role: normalizeRole(parsed.role),
      }
    } catch {
      return DEFAULT_FORM
    }
  })

  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitState, setSubmitState] = useState('idle')
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    localStorage.setItem('audit_reg_form', JSON.stringify(form))
  }, [form])

  const handle = (e) => {
    const { name, value } = e.target
    const nextValue = name === 'role' ? normalizeRole(value) : value
    setForm((prev) => ({ ...prev, [name]: nextValue }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
    setApiError('')
  }

  const validate = () => {
    const e = {}
    if (!form.full_name || !form.full_name.trim()) e.full_name = 'Username required.'
    if (!form.email || !form.email.trim()) e.email = 'Email required.'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email.'
    if (!form.phone_number || !form.phone_number.trim()) e.phone_number = 'Phone number required.'
    else if (!/^[\d\s\-\+\(\)]+$/.test(form.phone_number.trim())) e.phone_number = 'Invalid phone number.'
    if (!form.role) e.role = 'Role required.'
    return e
  }

  const isCompleteEnabled =
    form.full_name.trim() !== '' &&
    form.email.trim() !== '' &&
    form.phone_number.trim() !== '' &&
    form.role !== '' &&
    submitState === 'idle'

  const submit = async (e) => {
    e.preventDefault()

    if (requestInFlight.current) return

    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      toast.error('Please fix the errors in the form before continuing.')
      return
    }

    requestInFlight.current = true
    setSubmitState('registering')
    setApiError('')
    let reachedVerificationStep = false

    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone_number: form.phone_number.trim(),
      role: normalizeRole(form.role),
    }

    console.debug('[auth] POST /api/auth/register', payload)

    try {
      const registerResponse = await api.register(payload)
      console.debug('[auth] register response', registerResponse)

      setSubmitState('sending_verification')
      reachedVerificationStep = true
      console.debug('[auth] POST /api/auth/send-verification', { email: payload.email })
      try {
        const verificationResponse = await api.sendVerification({ email: payload.email })
        console.debug('[auth] send-verification response', verificationResponse)
      } catch (verificationError) {
        throw verificationError
      }

      localStorage.setItem('audit_pending_verification_email', payload.email)
      setForm(DEFAULT_FORM)
      localStorage.removeItem('audit_reg_form')
      toast.success('Registration created. Verification email sent.')
      navigate(`/verify-email?email=${encodeURIComponent(payload.email)}&status=sent`, { replace: true })
    } catch (error) {
      const status = error.response?.status
      const message = getErrorMessage(error)

      if (status === 404) {
        setApiError('The registration endpoint could not be reached. Check the backend route configuration.')
      } else if (status === 409) {
        setApiError('An account with this email already exists.')
      } else if (status === 500 && reachedVerificationStep) {
        localStorage.setItem('audit_pending_verification_email', payload.email)
        navigate(
          `/verify-email?email=${encodeURIComponent(payload.email)}&status=send_failed&reason=${encodeURIComponent(message)}`,
          { replace: true },
        )
        return
      } else if (reachedVerificationStep) {
        localStorage.setItem('audit_pending_verification_email', payload.email)
        navigate(
          `/verify-email?email=${encodeURIComponent(payload.email)}&status=send_failed&reason=${encodeURIComponent(message)}`,
          { replace: true },
        )
        return
      } else if (!error.response) {
        setApiError(`Network error. Please confirm the backend is running at ${API_BASE_URL.replace(/\/api$/, '')}.`)
      } else {
        setApiError(message)
      }

      requestInFlight.current = false
      setSubmitState('idle')
      return
    }

    requestInFlight.current = false
    setSubmitState('idle')
  }

  return (
    <div className="reg-root">
      <div className="reg-card">
        {/* Header banner */}
        <div className="reg-banner">
          <div className="reg-banner__icon">
             <ShieldCheck size={28} />
          </div>
          <h1 className="reg-banner__title">Audit Notification Manager</h1>
          <p className="reg-banner__sub">System Identity Registration</p>
        </div>

        <div className="reg-body">
          <h2 className="reg-heading">Account Creation</h2>
          <p className="reg-subheading">Complete your profile to access the audit portal.</p>

          {apiError && <div className="reg-api-error">{apiError}</div>}

          <form onSubmit={submit} noValidate>
            <div className="reg-field">
              <label className="reg-label">USERNAME</label>
              <div className="reg-input-wrapper">
                <User className="reg-input-icon" size={18} />
                <input className={`reg-input ${errors.full_name ? 'reg-input--err' : ''}`}
                  type="text" name="full_name" placeholder="j.doe_audit"
                  value={form.full_name} onChange={handle} autoComplete="username" />
              </div>
              {errors.full_name && <span className="reg-err">{errors.full_name}</span>}
            </div>

            <div className="reg-field">
              <label className="reg-label">EMAIL ADDRESS</label>
              <div className="reg-input-wrapper">
                <Mail className="reg-input-icon" size={18} />
                <input className={`reg-input ${errors.email ? 'reg-input--err' : ''}`}
                  type="email" name="email" placeholder="name@agency.gov"
                  value={form.email} onChange={handle} autoComplete="email" />
              </div>
              {errors.email && <span className="reg-err">{errors.email}</span>}
            </div>

            <div className="reg-field">
              <label className="reg-label">PHONE NUMBER</label>
              <div className="reg-input-wrapper">
                <Phone className="reg-input-icon" size={18} />
                <input className={`reg-input ${errors.phone_number ? 'reg-input--err' : ''}`}
                  type="tel" name="phone_number" placeholder="+91 (987) 654-3210"
                  value={form.phone_number} onChange={handle} autoComplete="tel" />
              </div>
              {errors.phone_number && <span className="reg-err">{errors.phone_number}</span>}
            </div>

            <div className="reg-field">
              <label className="reg-label">ACCESS ROLE</label>
              <div className="reg-input-wrapper">
                <ShieldCheck className="reg-input-icon" size={18} />
                <select className={`reg-input ${errors.role ? 'reg-input--err' : ''}`}
                  name="role" value={form.role} onChange={handle}>
                  <option value="">Select assigned role</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                  <option value="professor">Professor</option>
                </select>
              </div>
              {errors.role && <span className="reg-err">{errors.role}</span>}
            </div>

            <button 
              className="reg-btn" 
              type="submit" 
              disabled={!isCompleteEnabled}
            >
              {submitState === 'registering' ? 'Registering…' : submitState === 'sending_verification' ? 'Sending Verification…' : 'Complete Registration →'}
            </button>
          </form>
        </div>

        <div className="reg-footer">
          <p className="reg-footer__login">Already have an account? <Link to="/login" className="reg-link">Log In</Link></p>
          <div className="reg-security-disclaimer">
            This is a secure internal government management system. By registering, you agree to the Institutional Data Access Policy and acknowledge that all actions are logged for audit purposes.
          </div>
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
