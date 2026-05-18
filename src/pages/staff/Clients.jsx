import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, UserPlus } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { userService, professionalService } from '../../services'

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
  const [professionals, setProfessionals] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [tempStatus, setTempStatus] = useState('')
  const [tempProfessional, setTempProfessional] = useState('')
  const [appliedStatus, setAppliedStatus] = useState('')
  const [appliedProfessional, setAppliedProfessional] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    userService.getUsers({ skip: 0, limit: 50 })
      .then(res => setClients(res.data.items || res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))

    professionalService.getProfessionals()
      .then(res => setProfessionals(res.data.items || res.data || []))
      .catch(console.error)
  }, [])

  const uniqueProfessionals = Array.from(new Set([
    ...professionals.map(p => p.name || p.professional_name || '').filter(Boolean),
    ...clients.map(c => c.assigned_professional?.professional_name || c.assigned_professional || '').filter(Boolean)
  ]))

  const filtered = clients.filter(c => {
    const searchMatch = search === '' ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.pan?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      (c.assigned_professional?.professional_name || c.assigned_professional || '').toLowerCase().includes(search.toLowerCase());

    const cStatus = (c.status || 'pending').toLowerCase();
    let targetStatus = appliedStatus.toLowerCase();
    
    const statusMatch = !appliedStatus || 
      cStatus === targetStatus || 
      (targetStatus === 'in progress' && cStatus === 'under review');

    const cProf = (c.assigned_professional?.professional_name || c.assigned_professional || '').toLowerCase();
    const profMatch = !appliedProfessional || cProf === appliedProfessional.toLowerCase();

    return searchMatch && statusMatch && profMatch;
  })

  const getInitials = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const bgFor = (i) => ['#dbeafe', '#f0fdf4', '#fdf4ff', '#fff7ed', '#f0fdf4'][i % 5]

  const stats = [
    { label: 'Total Users', value: clients.length, color: '#1e293b', bar: '#2563eb' },
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
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1e293b' }}>Users</h2>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Manage all registered users and their professional assignments</p>
          </div>
          <button
            onClick={() => navigate('/staff/create-client')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 500, cursor: 'pointer', marginTop: 4 }}
          >
            <UserPlus size={13} /> Add User
          </button>
        </div>


        {/* Table */}
        <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '0.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>All Users</p>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>View and manage all user assignments</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '0.5px solid #cbd5e1', borderRadius: 8, padding: '6px 11px', background: '#fff' }}>
                <Search size={13} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Search by User / PAN…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ border: 'none', outline: 'none', fontSize: 12, color: '#1e293b', background: 'transparent', width: 180 }}
                />
              </div>
              <button 
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: 5, 
                  padding: '7px 12px', 
                  background: showFilterPanel ? '#eff6ff' : '#fff', 
                  color: showFilterPanel ? '#2563eb' : '#64748b', 
                  border: showFilterPanel ? '1px solid #bfdbfe' : '0.5px solid #e2e8f0', 
                  borderRadius: 7, 
                  fontSize: 12, 
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
              >
                <Filter size={13} color={showFilterPanel ? '#2563eb' : '#64748b'} /> Filter
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilterPanel && (
            <div style={{ padding: '12px 18px', background: '#f8fafc', borderBottom: '0.5px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Status:</label>
                <select
                  value={tempStatus}
                  onChange={e => setTempStatus(e.target.value)}
                  style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 12, outline: 'none', background: '#fff', cursor: 'pointer', color: '#1e293b' }}
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Professional:</label>
                <select
                  value={tempProfessional}
                  onChange={e => setTempProfessional(e.target.value)}
                  style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 12, outline: 'none', background: '#fff', cursor: 'pointer', color: '#1e293b' }}
                >
                  <option value="">All Professionals</option>
                  {uniqueProfessionals.map(prof => (
                    <option key={prof} value={prof}>{prof}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                <button
                  onClick={() => {
                    setAppliedStatus(tempStatus);
                    setAppliedProfessional(tempProfessional);
                  }}
                  style={{
                    padding: '6px 14px',
                    background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1d4ed8' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2563eb' }}
                >
                  Apply
                </button>
                <button
                  onClick={() => {
                    setTempStatus(appliedStatus);
                    setTempProfessional(appliedProfessional);
                    setShowFilterPanel(false);
                  }}
                  style={{
                    padding: '6px 14px',
                    background: '#f3f4f6',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e5e7eb' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6' }}
                >
                  Cancel
                </button>
                {(appliedStatus || appliedProfessional) && (
                  <button
                    onClick={() => {
                      setTempStatus('');
                      setTempProfessional('');
                      setAppliedStatus('');
                      setAppliedProfessional('');
                    }}
                    style={{
                      padding: '6px 12px',
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
          )}

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '16.66%' }} /><col style={{ width: '16.66%' }} /><col style={{ width: '16.66%' }} />
              <col style={{ width: '16.66%' }} /><col style={{ width: '16.66%' }} /><col style={{ width: '16.66%' }} />
            </colgroup>
            <thead>
              <tr>
                {['User', 'Email', 'PAN', 'Assigned Professional', 'Status', 'Action'].map(h => (
                  <th key={h} style={{ background: '#f8fafc', color: '#64748b', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', padding: '9px 10px', borderBottom: '0.5px solid #e2e8f0', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>Loading users...</td></tr>
                ) : clients.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8', fontSize: 13 }}>
                      No data available
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 48, color: '#94a3b8', fontSize: 12 }}>
                      No users found matching the active search or filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c, i) => (
                    <tr key={c.id || i} style={{ borderBottom: '0.5px solid #f1f5f9' }}>
                      <td style={{ padding: '11px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span 
                            onClick={() => navigate(`/staff/notice-orders/${c.id || 1}`)}
                            style={{ fontWeight: 600, fontSize: 12, cursor: 'pointer', color: '#1e3a8a' }}
                            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                          >
                            {c.name}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '11px 10px' }}>{c.email}</td>
                      <td style={{ padding: '11px 10px', color: '#64748b', fontSize: 11 }}>{c.pan}</td>
                      <td style={{ padding: '11px 10px', color: '#1e3a8a', fontWeight: 500 }}>
                        {c.assigned_professional?.professional_name || c.assigned_professional}
                      </td>
                      <td style={{ padding: '11px 10px' }}>{statusBadge(c.status)}</td>
                      <td style={{ padding: '11px 10px' }}>
                        <button
                          style={{ background: '#fff', border: '0.5px solid #cbd5e1', borderRadius: 4, padding: '4px 8px', fontSize: 10, cursor: 'pointer' }}
                          onClick={() => {/* Trigger assignment modal */ }}
                        >
                          Assign
                        </button>
                      </td>
                    </tr>
                  ))
                )}
            </tbody>
          </table>


          <div style={{ padding: '11px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '0.5px solid #f1f5f9' }}>
            <p style={{ fontSize: 12, color: '#64748b' }}>Showing {filtered.length} of {clients.length} users</p>
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