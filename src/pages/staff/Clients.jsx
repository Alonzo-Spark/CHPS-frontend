import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, UserPlus } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { clientService } from '../../services'

const statusBadge = (status = '') => {
  const map = {
    pending: { bg: '#fff7ed', color: '#d97706', label: 'Pending' },
    'under review': { bg: '#eff6ff', color: '#1d4ed8', label: 'Under Review' },
    completed: { bg: '#f0fdf4', color: '#16a34a', label: 'Completed' },
  }
  const s = map[(status || 'pending').toLowerCase()] || map.pending
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 600 }}>{s.label}</span>
  )
}

const avatarColors = ['#1e40af', '#166534', '#7c3aed', '#9a3412', '#166534']

export default function Clients() {
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    clientService.getClients()
      .then(res => setClients(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = clients.filter(c =>
    search === '' ||
    c.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.pan_number?.toLowerCase().includes(search.toLowerCase())
  )

  const getInitials = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const bgFor = (i) => ['#dbeafe', '#f0fdf4', '#fdf4ff', '#fff7ed', '#f0fdf4'][i % 5]

  const stats = [
    { label: 'Total Clients', value: clients.length, color: '#1e293b', bar: '#2563eb' },
    { label: 'Under Review', value: clients.filter(c => c.status === 'under review').length, color: '#d97706', bar: '#d97706' },
    { label: 'Pending', value: clients.filter(c => !c.status || c.status === 'pending').length, color: '#dc2626', bar: '#dc2626' },
    { label: 'Completed', value: clients.filter(c => c.status === 'completed').length, color: '#16a34a', bar: '#16a34a' },
  ]

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Dashboard', path: '/staff/dashboard' }, { label: 'Clients' }]}>
      <div style={{ padding: '20px 22px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1e293b' }}>Clients</h2>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Manage all registered clients and their proceedings</p>
          </div>
          <button
            onClick={() => navigate('/staff/create-client')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 500, cursor: 'pointer', marginTop: 4 }}
          >
            <UserPlus size={13} /> Add Client
          </button>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          {stats.map(({ label, value, color, bar }) => (
            <div key={label} style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 10, padding: '18px 20px' }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.07em' }}>{label}</p>
              <p style={{ fontSize: 28, fontWeight: 700, color, marginTop: 6 }}>{loading ? '...' : value}</p>
              <div style={{ height: 3, background: bar, borderRadius: 2, width: 44, marginTop: 12 }}></div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '0.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>All Clients</p>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>View and manage all client proceedings</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '0.5px solid #cbd5e1', borderRadius: 8, padding: '6px 11px', background: '#fff' }}>
                <Search size={13} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ border: 'none', outline: 'none', fontSize: 12, color: '#1e293b', background: 'transparent', width: 150 }}
                />
              </div>
              <button style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: '#fff', color: '#64748b', border: '0.5px solid #e2e8f0', borderRadius: 7, fontSize: 12, cursor: 'pointer' }}>
                <Filter size={13} /> Filter
              </button>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '18%' }} /><col style={{ width: '24%' }} /><col style={{ width: '22%' }} />
              <col style={{ width: '12%' }} /><col style={{ width: '12%' }} /><col style={{ width: '12%' }} />
            </colgroup>
            <thead>
              <tr>
                {['Name', 'Document Reference ID', 'Issued On', 'Response Due', 'Status'].map(h => (
                  <th key={h} style={{ background: '#f8fafc', color: '#64748b', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', padding: '9px 10px', borderBottom: '0.5px solid #e2e8f0', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>Loading clients...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No clients found.</td></tr>
              ) : (
                filtered.map((c, i) => (
                  <tr key={c.pan_number || i} style={{ borderBottom: '0.5px solid #f1f5f9' }}>
                    <td style={{ padding: '11px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: bgFor(i), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: avatarColors[i % 5], flexShrink: 0 }}>
                          {getInitials(c.client_name)}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 12 }}>{c.client_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '11px 10px', color: '#dc2626', fontWeight: 500 }}>{c.response_due || '—'}</td>
                    <td style={{ padding: '11px 10px' }}>{statusBadge(c.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div style={{ padding: '11px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '0.5px solid #f1f5f9' }}>
            <p style={{ fontSize: 12, color: '#64748b' }}>Showing {filtered.length} of {clients.length} clients</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {['‹', '›'].map(ch => (
                <button key={ch} style={{ width: 28, height: 28, border: '0.5px solid #e2e8f0', borderRadius: 6, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{ch}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
