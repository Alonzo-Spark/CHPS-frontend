import React, { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Shield, Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react'
import { authService } from '../../services/authService'
import { useToast } from '../../context/ToastContext'

const rules = [
  { id: 'length',    label: 'Minimum 8 characters',        test: (p) => p.length >= 8 },
  { id: 'upper',     label: 'At least one uppercase letter',test: (p) => /[A-Z]/.test(p) },
  { id: 'lower',     label: 'At least one lowercase letter',test: (p) => /[a-z]/.test(p) },
  { id: 'digit',     label: 'At least one number',         test: (p) => /\d/.test(p) },
]

const PasswordSetupPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { addToast } = useToast()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const errs = {}
    const failedRules = rules.filter((r) => !r.test(password))
    if (failedRules.length > 0) errs.password = 'Password does not meet requirements'
    if (password !== confirmPassword) errs.confirm = 'Passwords do not match'
    return errs
  }

  React.useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        addToast('No verification token provided. Please use the link from your email.', 'error');
        navigate('/login');
        return;
      }
      try {
        await authService.verifyEmail(token);
      } catch (err) {
        addToast(err?.response?.data?.detail || 'Invalid or expired verification token.', 'error');
        navigate('/login');
      }
    };
    validateToken();
  }, [token, navigate, addToast]);

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      await authService.setPassword({ token, password, confirm_password: confirmPassword })
      addToast('Account created successfully! Please log in.', 'success')
      navigate('/login')
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Failed to set password. The link may have expired.'
      addToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100 flex flex-col items-center justify-center px-4 py-10">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-blue-900 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Shield size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-blue-900">Audit Notification Manager</h1>
        <p className="text-gray-500 text-sm mt-1">Secure Account Finalization</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 w-full max-w-lg p-8">
        <h2 className="text-xl font-bold text-blue-900 mb-1">Set Your Credentials</h2>
        <p className="text-sm text-gray-500 mb-6">
          Please choose a secure password to complete your institutional registration.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors({}) }}
                placeholder="············"
                className={`w-full pl-9 pr-10 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.password ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Minimum 8 characters, including symbols and numbers.</p>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          {/* Password validation rules */}
          <div className="grid grid-cols-2 gap-1.5">
            {rules.map((rule) => {
              const passed = rule.test(password)
              return (
                <div key={rule.id} className={`flex items-center gap-1.5 text-xs ${passed ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckCircle2 size={13} className={passed ? 'text-green-500' : 'text-gray-300'} />
                  {rule.label}
                </div>
              )
            })}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Confirm Password</label>
            <div className="relative">
              <Shield size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setErrors({}) }}
                placeholder="············"
                className={`w-full pl-9 pr-10 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.confirm ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Register
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Security Notice */}
        <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-start gap-2">
          <Shield size={15} className="text-blue-700 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-500 leading-relaxed">
            This connection is secured via enterprise-grade 256-bit encryption. Your credentials are encrypted before storage.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between w-full max-w-lg mt-6 px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-gray-400">System Status: Operational</span>
        </div>
        <span className="text-xs text-gray-400">© 2024 Institutional Audit Management. All Rights Reserved.</span>
      </div>
    </div>
  )
}

export default PasswordSetupPage
