import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Loader2, Mail, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../services/api'
import './VerificationPage.css'

function getErrorMessage(error) {
  return error.normalizedMessage || error.response?.data?.detail || error.message || 'Verification failed.'
}

function getSearchValue(searchParams, keys) {
  for (const key of keys) {
    const value = searchParams.get(key)
    if (value) return value
  }

  return ''
}

export default function VerificationPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const hasAutoVerifyAttempted = useRef(false)
  const redirectTimer = useRef(null)

  const email = getSearchValue(searchParams, ['email']) || localStorage.getItem('audit_pending_verification_email') || ''
  const token = getSearchValue(searchParams, ['token', 'verification_token', 'code'])
  const status = searchParams.get('status') || (token ? 'verifying' : 'sent')
  const reason = searchParams.get('reason') || ''
  const initialPhase = token ? 'verifying' : status === 'send_failed' ? 'failure' : status

  const [phase, setPhase] = useState(initialPhase)
  const [message, setMessage] = useState(
    status === 'sent'
      ? 'A verification email has been sent. Check your inbox and click the link to complete activation.'
      : status === 'success'
        ? 'Your email has already been verified.'
        : '',
  )
  const [error, setError] = useState(reason)

  useEffect(() => {
    if (!token || hasAutoVerifyAttempted.current) return

    const nextParams = new URLSearchParams(searchParams.toString())
    hasAutoVerifyAttempted.current = true
    navigate(`/complete-registration?${nextParams.toString()}`, { replace: true })

    return () => {
      if (redirectTimer.current) {
        window.clearTimeout(redirectTimer.current)
      }
    }
  }, [navigate, searchParams, token])

  const resendVerification = async () => {
    if (!email) {
      setError('No email address was found for resending the verification link.')
      return
    }

    setPhase('resending')
    setError('')

    try {
      console.debug('[auth] send-verification request', { email })
      const response = await api.sendVerification({ email })
      console.debug('[auth] send-verification response', response)

      localStorage.setItem('audit_pending_verification_email', email)
      setPhase('sent')
      setMessage(`Verification email sent to ${email}. Check your inbox and spam folder.`)
      toast.success('Verification email resent.')
    } catch (sendError) {
      setPhase('failure')
      setError(getErrorMessage(sendError))
    }
  }

  const busy = phase === 'verifying' || phase === 'resending'

  return (
    <div className="verify-root">
      <div className="verify-shell">
        <div className="verify-brand">
          <div className="verify-brand__icon">
            <ShieldCheck size={30} />
          </div>
          <div>
            <p className="verify-brand__eyebrow">Audit Portal</p>
            <h1 className="verify-brand__title">Email Verification</h1>
          </div>
        </div>

        <div className={`verify-card verify-card--${phase}`}>
          <div className="verify-card__status-icon">
            {phase === 'verifying' || phase === 'resending' ? (
              <Loader2 className="spin" size={26} />
            ) : phase === 'success' ? (
              <CheckCircle2 size={26} />
            ) : (
              <AlertCircle size={26} />
            )}
          </div>

          <h2 className="verify-card__title">
            {phase === 'verifying' && 'Verifying your email'}
            {phase === 'success' && 'Verification complete'}
            {phase === 'resending' && 'Resending verification email'}
            {phase === 'failure' && 'Verification failed'}
            {phase === 'sent' && 'Check your inbox'}
          </h2>

          <p className="verify-card__message">
            {message || (
              phase === 'sent'
                ? 'Registration is complete. Open the verification link from your email to finish activating the account.'
                : phase === 'failure'
                  ? 'The verification link could not be processed.'
                  : 'We are preparing your account verification.'
            )}
          </p>

          {email && (
            <div className="verify-card__detail">
              <Mail size={16} />
              <span>{email}</span>
            </div>
          )}

          {error && <div className="verify-card__error">{error}</div>}

          <div className="verify-card__actions">
            {(phase === 'sent' || phase === 'failure') && (
              <button className="verify-btn verify-btn--primary" onClick={resendVerification} disabled={busy}>
                {phase === 'resending' ? 'Sending…' : 'Resend verification email'}
              </button>
            )}

            {phase === 'success' && (
              <button className="verify-btn verify-btn--primary" onClick={() => navigate('/login', { replace: true })}>
                Continue to login
              </button>
            )}

            <Link className="verify-btn verify-btn--secondary" to="/register">
              Back to registration
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
