import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { userService, assignmentService } from '../../services'

const statusBadge = (status = '') => {
  const s = (status || '').toLowerCase().replace(/[_-]/g, ' ').trim()
  const map = {
    pending: { bg: '#fff7ed', color: '#d97706' },
    completed: { bg: '#f0fdf4', color: '#16a34a' }
  }
  const style = map[s] || { bg: '#f1f5f9', color: '#475569' }
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace(/[_]/g, ' ') : 'N/A'
  return (
    <span style={{ background: style.bg, color: style.color, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{label}</span>
  )
}

const getStatus = (item) => {
  const hasIssueDate = !!(item?.issued_on || item?.issue_date)
  const hasDueDate = !!(item?.due_date || item?.response_due_date)
  if (hasIssueDate && hasDueDate) return 'Completed'
  if (hasIssueDate && !hasDueDate) return 'Pending'
  if (item?.is_completed || (item?.status || '').toLowerCase() === 'completed') return 'Completed'
  return item?.status || item?.workflow_status || 'Pending'
}

export default function AdminDashboard() {
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    assignmentService.searchAssignments()
      .then(res => {
        const raw = res?.data?.data || (Array.isArray(res?.data) ? res.data : [])
        const data = Array.isArray(raw) ? raw : []
        const mapped = data.map(item => ({
          id: item.assignment_id,
          name: item.client?.client_name || 'N/A',
          email: item.client?.client_email || 'N/A',
          pan: item.client?.client_pan || 'N/A',
          assigned_professional: item.professional ? {
            professional_name: item.professional.professional_name
          } : null,
          status: item.assigned_status || 'Pending',
          assessment_year: item.assessment_year || item.financial_year || item.year || item.assessmentYear || item.ay || item.client?.assessment_year || item.client?.financial_year || item.client?.year || 'N/A'
        }))
        setClients(mapped)
      })
      .catch(err => {
        console.warn('searchAssignments failed:', err)
        setClients([])
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = clients.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    const nameMatch = (c.name || '').toLowerCase().includes(q)
    const panMatch = (c.pan || '').toLowerCase().includes(q)
    const profMatch = ((c.assigned_professional?.professional_name || c.assigned_professional) || '').toLowerCase().includes(q)
    return nameMatch || panMatch || profMatch
  })

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Admin Dashboard' }]}>
      <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', width: '100%', flex: 1 }}>
        <h1 style={{ fontSize: 25, fontWeight: 700, color: '#1e293b', marginBottom: 20 }}>Admin Dashboard</h1>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ position: 'relative', width: 320 }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search Assessee, PAN, or Professional..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ flex: 1, width: '100%' }}>
            {/* Header Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', width: '100%', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Assessee', 'PAN', 'Assessment Year', 'Assigned Professional', 'Status', 'Proceedings'].map(h => (
                <div key={h} style={{ padding: '14px 28px', color: '#64748b', fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', textAlign: 'left' }}>{h}</div>
              ))}
            </div>

            {/* Data Rows */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 14 }}>Loading...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 14 }}>No data found.</div>
            ) : (
              filtered.map((c, i) => (
                <div key={c.id || i} style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', width: '100%', borderBottom: '0.5px solid #f1f5f9', alignItems: 'center' }}>
                  <div style={{ padding: '14px 28px', fontWeight: 600 }}>
                    <span style={{ fontSize: 14, color: '#1e293b' }}>{c.name}</span>
                  </div>
                  <div style={{ padding: '14px 28px', color: '#64748b', fontSize: 14 }}>{c.pan}</div>
                  <div style={{ padding: '14px 28px', color: '#475569', fontWeight: 500, fontSize: 14 }}>{c.assessment_year}</div>
                  <div style={{ padding: '14px 28px', color: '#1e3a8a', fontWeight: 500, fontSize: 14 }}>
                    {c.assigned_professional?.professional_name || c.assigned_professional || '—'}
                  </div>
                  <div style={{ padding: '14px 28px' }}>{statusBadge(getStatus(c))}</div>
                  <div style={{ padding: '14px 28px', display: 'flex', alignItems: 'center' }}>
                    <button
                      onClick={() => navigate(`/proceedings?assessee=${encodeURIComponent(c.name)}`, { state: { assesseeName: c.name } })}
                      style={{
                        background: '#2563eb',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        padding: '7px 16px',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2563eb'}
                    >
                      View Proceedings
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
