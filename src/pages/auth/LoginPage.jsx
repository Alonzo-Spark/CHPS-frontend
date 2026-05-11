import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Building2, Info } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

const LoginPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { addToast } = useToast()

  const [form, setForm] = useState({ email_or_username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!form.email_or_username) errs.email_or_username = 'Email is required'
    if (!form.password) errs.password = 'Password is required'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      const data = await login(form)
      const roleMap = {
        admin: '/admin/dashboard',
        professor: '/professor/dashboard',
        staff: '/staff/dashboard',
        professional: '/staff/dashboard',
      }
      navigate(roleMap[data.role] || '/staff/dashboard')
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Invalid credentials. Please try again.'
      addToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-2 text-gray-800">
          <Building2 size={20} />
          <span className="text-sm font-medium">Audit Notification Manager</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-sm p-8">
          <h2 className="text-center text-xl font-semibold text-gray-800 mb-6">Login</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1.5">Email:</label>
              <input
                type="text"
                placeholder="Enter email"
                value={form.email_or_username}
                onChange={(e) => setForm({ ...form, email_or_username: e.target.value })}
                className={`input-field ${errors.email_or_username ? 'border-red-400 focus:ring-red-400' : ''}`}
              />
              {errors.email_or_username && <p className="text-red-500 text-xs mt-1">{errors.email_or_username}</p>}
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1.5">Password:</label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={`input-field ${errors.password ? 'border-red-400 focus:ring-red-400' : ''}`}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showPwd"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="w-4 h-4 accent-blue-600"
              />
              <label htmlFor="showPwd" className="text-sm text-gray-600 cursor-pointer">show password</label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary mt-2"
            >
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              Sign In
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have account?{' '}
            <Link to="/register" className="text-blue-600 font-medium hover:underline">Sign up</Link>
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-sm p-6 mt-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-blue-900 flex items-center justify-center">
              <Info size={12} className="text-white" />
            </div>
            <span className="font-semibold text-gray-800 text-sm">Know about your User ID</span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Your User ID is the unique identifier associated with your account for secure access to the Audit Notification Manager.
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
