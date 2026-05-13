import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Shield, User, Mail, Phone, Lock, ChevronDown, ArrowRight } from 'lucide-react'
import { authService } from '../../services/authService'
import { useToast } from '../../context/ToastContext'

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'staff', label: 'Staff' },
  { value: 'professor', label: 'Professor' },
]

const RegisterPage = () => {
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [form, setForm] = useState({
    username: '',
    email: '',
    phone_number: '',
    role: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const errs = {}
    if (!form.username.trim()) errs.username = 'Username is required'
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email format'
    if (!form.phone_number.trim()) errs.phone_number = 'Phone number is required'
    if (!form.role) errs.role = 'Please select a role'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
       await authService.register(form)
       addToast('Registration successful! Check your email to verify your account.', 'success')
       navigate('/registration-success')
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Registration failed. Please try again.'
      addToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (field) =>
    `w-full pl-9 pr-3 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
      errors[field] ? 'border-red-400' : 'border-gray-300'
    }`

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100 flex flex-col items-center justify-center px-4 py-10">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-blue-900 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Shield size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-blue-900">Audit Notification Manager</h1>
        <p className="text-gray-500 text-sm mt-1">System Identity Registration</p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 w-full max-w-md p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Account Creation</h2>
        <p className="text-sm text-gray-500 mb-6">Complete your profile to access the audit portal.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Username</label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="j.doe_audit"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className={inputClass('username')}
              />
            </div>
            {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Email Address</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                placeholder="name@agency.gov"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClass('email')}
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Phone Number</label>
            <div className="relative">
              <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                placeholder="+91 (987) 654-3210"
                value={form.phone_number}
                onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                className={inputClass('phone_number')}
              />
            </div>
            {errors.phone_number && <p className="text-red-500 text-xs mt-1">{errors.phone_number}</p>}
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Access Role</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className={`w-full pl-9 pr-8 py-2.5 border rounded-md text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                  errors.role ? 'border-red-400' : 'border-gray-300'
                } ${!form.role ? 'text-gray-400' : 'text-gray-800'}`}
              >
                <option value="" disabled>Select assigned role</option>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-primary mt-2">
            {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Complete Registration
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="border-t border-gray-100 mt-6 pt-4 text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-semibold hover:underline">Log In</Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <p className="text-xs text-gray-400 text-center max-w-sm mt-6 leading-relaxed">
        This is a secure internal government management system. By registering, you agree to the{' '}
        <span className="font-semibold text-gray-500">Institutional Data Access Policy</span> and acknowledge that all actions are logged for audit purposes.
      </p>
    </div>
  )
}

export default RegisterPage
