import { useState } from 'react'
import { ShieldCheck, Lock, Eye, EyeOff, X } from 'lucide-react'
import { authService } from '../../services'

export default function ChangePasswordModal({ isOpen, onClose }) {
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm_new_password: '' })
  const [showOldPw, setShowOldPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const checks = {
    length: form.new_password.length >= 8,
    upper: /[A-Z]/.test(form.new_password),
    lower: /[a-z]/.test(form.new_password),
    digit: /[0-9]/.test(form.new_password),
    match: form.new_password === form.confirm_new_password && form.new_password.length > 0,
  }

  const allValid = Object.values(checks).every(Boolean)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!form.old_password) {
      setError('Please enter your current password.')
      return
    }
    if (!allValid) {
      setError('Please ensure the new password meets all requirements and matches.')
      return
    }

    setLoading(true)
    try {
      await authService.changePassword({
        old_password: form.old_password,
        new_password: form.new_password
      })
      setSuccess('Password changed successfully. Your admin has been notified.')
      setForm({ old_password: '', new_password: '', confirm_new_password: '' })
      setTimeout(() => {
        onClose()
        setSuccess('')
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to change password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', border: '1px solid #d1d5db', borderRadius: 8,
    padding: '9px 40px', fontSize: 13, outline: 'none', color: '#1e293b', background: '#fff'
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      {/* Backdrop */}
      <div 
        style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }} 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 420, background: '#fff', borderRadius: 12, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: '#e0e7ff', padding: 6, borderRadius: 8, color: '#4f46e5' }}>
              <Lock size={18} />
            </div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Change Password</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '10px 12px', marginBottom: 16, fontSize: 13, color: '#b91c1c' }}>{error}</div>}
          {success && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '10px 12px', marginBottom: 16, fontSize: 13, color: '#15803d' }}>{success}</div>}

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Current Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input type={showOldPw ? 'text' : 'password'} placeholder="••••••••••••" value={form.old_password} onChange={e => setForm({ ...form, old_password: e.target.value })} style={inputStyle} />
              <button type="button" onClick={() => setShowOldPw(!showOldPw)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                {showOldPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>New Password</label>
            <div style={{ position: 'relative' }}>
              <ShieldCheck size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input type={showNewPw ? 'text' : 'password'} placeholder="••••••••••••" value={form.new_password} onChange={e => setForm({ ...form, new_password: e.target.value })} style={inputStyle} />
              <button type="button" onClick={() => setShowNewPw(!showNewPw)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Live validation */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px', marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { key: 'length', label: 'Min 8 chars' },
              { key: 'upper', label: 'Uppercase' },
              { key: 'lower', label: 'Lowercase' },
              { key: 'digit', label: 'One number' },
            ].map(({ key, label }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                <span style={{ color: checks[key] ? '#16a34a' : '#cbd5e1', fontWeight: checks[key] ? 700 : 400 }}>{checks[key] ? '✓' : '○'}</span>
                <span style={{ color: checks[key] ? '#16a34a' : '#64748b' }}>{label}</span>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <ShieldCheck size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: checks.match ? '#16a34a' : '#94a3b8' }} />
              <input type={showConfirmPw ? 'text' : 'password'} placeholder="••••••••••••" value={form.confirm_new_password} onChange={e => setForm({ ...form, confirm_new_password: e.target.value })} style={inputStyle} />
              <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} disabled={loading} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, fontWeight: 500, color: '#475569', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '8px 16px', background: '#4f46e5', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500, color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
