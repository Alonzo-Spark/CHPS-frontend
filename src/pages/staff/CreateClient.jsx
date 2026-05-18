import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Eye, EyeOff } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { clientService } from '../../services'

export default function CreateClient() {
  const [form, setForm] = useState({ client_name: '', pan_number: '', password: '', email: '', professor: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const professors = ['Dr. Priya Sharma', 'Dr. Arun Mehta', 'Prof. Kavita Rao', 'Dr. Suresh Iyer', 'Prof. Nandini Verma']

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!form.client_name || !form.pan_number || !form.email || !form.password) {
      setError('Name, PAN, Email, and Password are required.'); return
    }
    setLoading(true)
    try {
      await clientService.createClient({
        name: form.client_name,
        client_name: form.client_name,
        email: form.email,
        pan: form.pan_number,
        pan_number: form.pan_number,
        password: form.password,
        phone_number: '',
        reference_id: `REF-${Date.now()}`,
      })
      setSuccess('Client created successfully!')
      setTimeout(() => navigate('/staff/clients'), 1500)
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
              <input type="text" placeholder="Enter full name" value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} style={inputStyle} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>PAN No.</label>
              <input type="text" placeholder="e.g. ABCDE1234F" value={form.pan_number} onChange={e => setForm({ ...form, pan_number: e.target.value.toUpperCase() })} style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '.04em' }} />
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
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Mail</label>
              <input type="email" placeholder="client@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Professors Assignment</label>
              <div style={{ position: 'relative' }}>
                <select
                  value={form.professor}
                  onChange={e => setForm({ ...form, professor: e.target.value })}
                  style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', paddingRight: 36 }}
                >
                  <option value="" disabled>Select a professor</option>
                  {professors.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>▾</span>
              </div>
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
