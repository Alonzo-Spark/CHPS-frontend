import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../services/api'
import './RegisterPage.css'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [form, setForm] = useState(() => {
    try {
      const saved = localStorage.getItem('audit_reg_form')
      return saved ? JSON.parse(saved) : {
        full_name: '', email: '', password: '', confirm_password: '', role: 'Staff', pan_number: ''
      }
    } catch {
      return { full_name: '', email: '', password: '', confirm_password: '', role: 'Staff', pan_number: '' }
    }
  })
  
  const [verificationStatus, setVerificationStatus] = useState(() => {
    try {
      return localStorage.getItem('audit_reg_status') || 'unverified'
    } catch {
      return 'unverified'
    }
  })

  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState({})
  const [loadingComplete, setLoadingComplete] = useState(false)

  // 1. FORM STATE PERSISTENCE FIX
  useEffect(() => {
    localStorage.setItem('audit_reg_form', JSON.stringify(form))
  }, [form])

  useEffect(() => {
    localStorage.setItem('audit_reg_status', verificationStatus)
  }, [verificationStatus])

  // 2. VERIFICATION REDIRECT HANDLING
  useEffect(() => {
    // Detect ?verified=true&email=...
    const verified = searchParams.get('verified') === 'true' || searchParams.get('verification') === 'success';

    if (verified) {
      // 3. EMAIL VERIFIED STATE FIX
      setVerificationStatus('verified');
      
      // Remove query params cleanly without losing React state
      navigate('/register', { replace: true });
    }
  }, [searchParams, navigate])

  const handle = (e) => {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
    setErrors(p => ({ ...p, [name]: '' }))

    if (name === 'email' && verificationStatus !== 'unverified') {
      setVerificationStatus('unverified')
    }
  }

  const validate = () => {
    const e = {}
    if (!form.full_name || !form.full_name.trim()) e.full_name = 'Full name required.'
    if (!form.email || !form.email.trim()) e.email = 'Email required.'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email.'
    if (!form.role) e.role = 'Role required.'
    if (!form.password) e.password = 'Password required.'
    else if (form.password.length < 6) e.password = 'Minimum 6 characters.'
    if (form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match.'
    return e
  }

  const handleVerifyEmail = async () => {
    const errs = validate()
    if (Object.keys(errs).length) { 
      setErrors(errs)
      toast.error('Please fix the errors in the form before verifying.')
      return 
    }
    
    setVerificationStatus('verifying')
    try {
      // Build exact payload required by FastAPI
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        role: form.role,
        pan_number: form.pan_number ? form.pan_number.trim() : '',
        password: form.password,
        confirm_password: form.confirm_password
      }

      // Ensure no undefined/null values
      console.log('--- SEND VERIFICATION PAYLOAD ---')
      console.log(JSON.stringify(payload, null, 2))

      await api.sendVerification(payload)
      toast.success("Check your email for verification")
    } catch (error) {
      setVerificationStatus('unverified')
    }
  }

  // 4. COMPLETE REGISTRATION BUTTON FIX
  const isCompleteEnabled = 
    form.full_name && form.full_name.trim() !== '' &&
    form.email && form.email.trim() !== '' &&
    form.password && form.password !== '' &&
    form.confirm_password && form.confirm_password !== '' &&
    form.password === form.confirm_password &&
    verificationStatus === 'verified'

  const submit = async (e) => {
    e.preventDefault()
    
    if (!isCompleteEnabled) {
      if (verificationStatus !== 'verified') {
        toast.error('Email verification required')
      } else {
        toast.error('Please ensure all fields are filled correctly')
      }
      return
    }

    setLoadingComplete(true)
    try {
      // Create exact required payload mapping
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        role: form.role,
        pan_number: form.pan_number ? form.pan_number.trim() : '',
        password: form.password,
        confirm_password: form.confirm_password
      };

      // 3. VERIFY NO EMPTY VALUES (No undefined, null, or empty string allowed)
      for (const [key, value] of Object.entries(payload)) {
        if (value === undefined || value === null || value === '') {
          toast.error(`Missing required field: ${key}`);
          setLoadingComplete(false);
          return;
        }
      }

      // Log exactly what is being sent to backend
      console.log('--- COMPLETE REGISTRATION PAYLOAD ---');
      console.log(JSON.stringify(payload, null, 2));

      // 5. COMPLETE REGISTRATION API FIX: Full Payload
      await api.completeRegistration(payload)
      toast.success("Registration complete")
      
      // REMOVE FORM RESET BUG: Only clear after actual backend success
      localStorage.removeItem('audit_reg_form')
      localStorage.removeItem('audit_reg_status')
      
      navigate('/login')
    } catch (error) {
      // Interceptor handles the toast
    } finally {
      setLoadingComplete(false)
    }
  }

  return (
    <div className="reg-root">
      <div className="reg-card">
        {/* Header banner */}
        <div className="reg-banner">
          <div className="reg-banner__icon">
             <ShieldCheck size={28} />
          </div>
          <h1 className="reg-banner__title">Audit Portal</h1>
          <p className="reg-banner__sub">INTERNAL MANAGEMENT SYSTEM</p>
        </div>

        <div className="reg-body">
          <h2 className="reg-heading">Create Your Account</h2>
          <p className="reg-subheading">Register to manage notification compliance</p>

          {/* VERIFICATION BOX */}
          <div className={`verify-box status-${verificationStatus}`}>
            {verificationStatus === 'unverified' && (
              <>
                <div className="verify-icon"><AlertCircle size={24} /></div>
                <div className="verify-content">
                  <span className="verify-title">Email Not Verified</span>
                  <span className="verify-desc">Please fill the form and verify your email.</span>
                </div>
                <button type="button" className="verify-action-btn" onClick={handleVerifyEmail}>
                  Verify Email
                </button>
              </>
            )}
            {verificationStatus === 'verifying' && (
              <>
                <div className="verify-icon"><Loader2 className="spin" size={24} /></div>
                <div className="verify-content">
                  <span className="verify-title">Verification Pending</span>
                  <span className="verify-desc">Check your email for the verification link...</span>
                </div>
              </>
            )}
            {verificationStatus === 'verified' && (
              <>
                <div className="verify-icon"><CheckCircle2 size={24} /></div>
                <div className="verify-content">
                  <span className="verify-title">Email Confirmed Successfully</span>
                  <span className="verify-desc">You can now complete your registration.</span>
                </div>
              </>
            )}
          </div>

          <form onSubmit={submit} noValidate>
            <div className="reg-field">
              <label className="reg-label">FULL NAME</label>
              <input className={`reg-input ${errors.full_name ? 'reg-input--err' : ''}`}
                type="text" name="full_name" placeholder="Jane Smith"
                value={form.full_name} onChange={handle} autoComplete="name" />
              {errors.full_name && <span className="reg-err">{errors.full_name}</span>}
            </div>

            <div className="reg-field">
              <label className="reg-label">EMAIL ADDRESS</label>
              <input className={`reg-input ${errors.email ? 'reg-input--err' : ''}`}
                type="email" name="email" placeholder="official@agency.gov"
                value={form.email} onChange={handle} autoComplete="email" />
              {errors.email && <span className="reg-err">{errors.email}</span>}
            </div>

            <div className="reg-row">
              <div className="reg-field">
                <label className="reg-label">ROLE</label>
                <select className={`reg-input ${errors.role ? 'reg-input--err' : ''}`}
                  name="role" value={form.role} onChange={handle}>
                  <option value="Staff">Staff</option>
                  <option value="Admin">Admin</option>
                </select>
                {errors.role && <span className="reg-err">{errors.role}</span>}
              </div>

              <div className="reg-field">
                <label className="reg-label">PAN NUMBER</label>
                <input className={`reg-input ${errors.pan_number ? 'reg-input--err' : ''}`}
                  type="text" name="pan_number" placeholder="ABCDE1234F"
                  value={form.pan_number} onChange={handle} />
                {errors.pan_number && <span className="reg-err">{errors.pan_number}</span>}
              </div>
            </div>

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
                  <input className={`reg-input ${errors.confirm_password ? 'reg-input--err' : ''}`}
                    type={showConfirm ? 'text' : 'password'} name="confirm_password" placeholder="••••••••"
                    value={form.confirm_password} onChange={handle} autoComplete="new-password" />
                  <button type="button" className="pass-eye" onClick={() => setShowConfirm(v => !v)}>
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.confirm_password && <span className="reg-err">{errors.confirm_password}</span>}
              </div>
            </div>

            <button 
              className="reg-btn" 
              type="submit" 
              disabled={!isCompleteEnabled || loadingComplete}
            >
              {loadingComplete ? 'Completing Registration...' : 'Complete Registration →'}
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
