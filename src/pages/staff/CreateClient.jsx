import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Eye, EyeOff } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { clientService, professionalService } from '../../services'

export default function CreateClient() {
  const [form, setForm] = useState({ name: '', pan: '', password: '', email: '', professional_id: '', referred_by: '', referred_by_email: '', referred_by_phone: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [professionals, setProfessionals] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    professionalService.getProfessionals()
      .then(res => setProfessionals(res.data || res || []))
      .catch(err => {
        console.error('Failed to load professionals', err)
      })
  }, [])

  const validateForm = () => {
    const errors = {}
    if (!form.name.trim()) errors.name = 'Name is required'
    if (form.pan.trim().length !== 10) errors.pan = 'PAN must be exactly 10 characters'
    if (!form.email.trim()) errors.email = 'Email is required'
    if (form.password.length < 6) errors.password = 'Password must be at least 6 characters'
    if (!form.professional_id) errors.professional_id = 'Please select a professional'
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    const errors = validateForm()
    setFieldErrors(errors)
    if (Object.keys(errors).length) return

    setLoading(true)
    try {
      const payload = {
        name: form.name.trim().toUpperCase(),
        pan: form.pan.trim().toUpperCase(),
        password: form.password,
        email: form.email.trim().toLowerCase(),
        professional_id: Number(form.professional_id),
        referred_by_phone: form.referred_by_phone.trim(),
        ...(form.referred_by.trim() && { referred_by: form.referred_by.trim() })
      }

      const data = await clientService.createClient(payload)
      setSuccess(`Client created! ID: ${data?.data?.user_id || data?.user_id || ''}`)
      setTimeout(() => navigate('/staff/clients'), 1400)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create client.')
    } finally {
      setLoading(false)
    }
  }

  const labelStyle = { fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5, display: 'block' }
  const inputStyle = { width: '100%', border: '0.5px solid #cbd5e1', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#1e293b', background: '#fff', outline: 'none' }

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Dashboard', path: '/staff/dashboard' }, { label: 'Client Creation' }]}>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 12, padding: '32px 34px', width: '100%', maxWidth: 520 }}>
          {/* Icon + title */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 42, height: 42, background: '#eff6ff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <UserPlus size={20} color="#2563eb" />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1e293b' }}>Client Creation</h2>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Add a new client and assign them to a professor</p>
          </div>

          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#dc2626' }}>{error}</div>}
          {success && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#16a34a' }}>{success}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Name</label>
              <input type="text" placeholder="Enter full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
              {fieldErrors.name && <p style={{ marginTop: 6, color: '#dc2626', fontSize: 12 }}>{fieldErrors.name}</p>}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>PAN No.</label>
              <input type="text" placeholder="e.g. ABCDE1234F" value={form.pan} onChange={e => setForm({ ...form, pan: e.target.value.toUpperCase() })} style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '.04em' }} />
              {fieldErrors.pan && <p style={{ marginTop: 6, color: '#dc2626', fontSize: 12 }}>{fieldErrors.pan}</p>}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Create a secure password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  style={{ ...inputStyle, paddingRight: 38 }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {fieldErrors.password && <p style={{ marginTop: 6, color: '#dc2626', fontSize: 12 }}>{fieldErrors.password}</p>}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Mail</label>
              <input type="email" placeholder="client@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />
              {fieldErrors.email && <p style={{ marginTop: 6, color: '#dc2626', fontSize: 12 }}>{fieldErrors.email}</p>}
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Professional</label>
              <div style={{ position: 'relative' }}>
                <select
                  value={form.professional_id}
                  onChange={e => setForm({ ...form, professional_id: e.target.value })}
                  style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', paddingRight: 36 }}
                >
                  <option value="">Select Professional</option>
                  {professionals.map((prof) => (
                    <option key={prof.id} value={prof.id}>{prof.professional_name}</option>
                  ))}
                </select>
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>▾</span>
              </div>
              {fieldErrors.professional_id && <p style={{ marginTop: 6, color: '#dc2626', fontSize: 12 }}>{fieldErrors.professional_id}</p>}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Referred By</label>
              <input
                type="text"
                placeholder="Enter referrer name"
                value={form.referred_by}
                onChange={e => setForm({ ...form, referred_by: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Mail (Referred by)</label>
              <input
                type="email"
                placeholder="Enter referrer email"
                value={form.referred_by_email}
                onChange={e => setForm({ ...form, referred_by_email: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Phone No (Referred by)</label>
              <input
                type="text"
                placeholder="Enter referrer phone"
                value={form.referred_by_phone}
                onChange={e => setForm({ ...form, referred_by_phone: e.target.value })}
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '10px 24px', background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              <UserPlus size={14} /> {loading ? 'Creating...' : 'Create Client'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/staff/clients')}
              style={{ width: '100%', marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 10, background: 'none', color: '#64748b', border: '0.5px solid #e2e8f0', borderRadius: 7, fontSize: 13, cursor: 'pointer' }}
            >
              Cancel
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
