import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, UserPlus } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { userService, professionalService, noticeControlService } from '../../services'

const statusBadge = (status = '') => {
  const s = (status || '').toLowerCase().replace(/[_-]/g, ' ').trim()
  const map = {
    pending: { bg: '#fff7ed', color: '#d97706' },
    'under review': { bg: '#eff6ff', color: '#1d4ed8' },
    completed: { bg: '#f0fdf4', color: '#16a34a' },
    'in progress': { bg: '#eff6ff', color: '#2563eb' },
    assigned: { bg: '#f5f3ff', color: '#7c3aed' },
  }
  const style = map[s] || { bg: '#f1f5f9', color: '#475569' }
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace(/[_]/g, ' ') : 'N/A'
  return (
    <span style={{ background: style.bg, color: style.color, padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 600 }}>{label}</span>
  )
}

const avatarColors = ['#1e40af', '#166534', '#7c3aed', '#9a3412', '#166534']

// Assessment years for Notice Control - these are the fiscal year options
const ALL_YEARS = ['2019-20', '2020-21', '2021-22', '2022-23', '2023-24', '2024-25']

// Status: issue+due=Completed, issue only=Pending
const getStatus = (item) => {
  const hasIssueDate = !!(item?.issued_on || item?.issue_date)
  const hasDueDate = !!(item?.due_date || item?.response_due_date)
  if (hasIssueDate && hasDueDate) return 'Completed'
  if (hasIssueDate && !hasDueDate) return 'Pending'
  if (item?.is_completed || (item?.status || '').toLowerCase() === 'completed') return 'Completed'
  return item?.status || item?.workflow_status || 'Pending'
}

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
  const [assignDropdownOpen, setAssignDropdownOpen] = useState(null)
  const [noticeControl, setNoticeControl] = useState({})
  const [yearDropdownOpen, setYearDropdownOpen] = useState(null)
  const [selectedYears, setSelectedYears] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    userService.getUsers({ skip: 0, limit: 50 })
      .then(res => {
        const raw = res?.data?.items || res?.data || []
        const data = Array.isArray(raw) ? raw : []
        console.log('CLIENT DATA:', data)
        setClients(data)
      })
      .catch(err => {
        console.warn('getUsers failed:', err)
        setClients([])
      })
      .finally(() => setLoading(false))

    professionalService.getProfessionals()
      .then(res => {
        const raw = res?.data?.items || res?.data || []
        setProfessionals(Array.isArray(raw) ? raw : [])
      })
      .catch(() => setProfessionals([]))
  }, [])

  // Fetch notice control data for each client once clients are loaded
  useEffect(() => {
    if (clients.length === 0) return
    clients.forEach(c => {
      const cid = c.id
      if (!cid) return
      Promise.all([
        noticeControlService.getNoticeControl(cid).catch(() => null),
        noticeControlService.getAssessmentYears(cid).catch(() => null)
      ]).then(([ncRes, ayRes]) => {
        const commonYearsRaw = ayRes?.data?.data || ayRes?.data?.years || ayRes?.data?.available_years || ayRes?.data || ayRes?.years || ayRes?.available_years || ayRes || null
        const commonYears = Array.isArray(commonYearsRaw) ? commonYearsRaw : null

        const ncData = ncRes?.data || {}
        const blocked = ncData.blocked_years || []

        let available = commonYears || ncData.available_years || []
        if (blocked.length > 0) {
          available = available.filter(y => !blocked.includes(y))
        }

        setNoticeControl(prev => ({
          ...prev,
          [cid]: {
            available_years: available,
            blocked_years: blocked
          }
        }))
      }).catch(err => {
        console.warn('Failed to load years/control details for client:', cid, err)
        setNoticeControl(prev => ({ ...prev, [cid]: { available_years: [], blocked_years: [] } }))
      })
    })
  }, [clients])

  const handleBlockYears = async (clientId) => {
    const sel = selectedYears[clientId] || []
    if (sel.length === 0) return
    const res = await noticeControlService.blockYears(clientId, sel)
    setNoticeControl(prev => {
      const cur = prev[clientId] || { available_years: [], blocked_years: [] }
      const newBlocked = [...new Set([...cur.blocked_years, ...sel])]
      const newAvailable = cur.available_years.filter(y => !sel.includes(y))
      return { ...prev, [clientId]: { available_years: newAvailable, blocked_years: newBlocked } }
    })
    setSelectedYears(prev => ({ ...prev, [clientId]: [] }))
  }

  const handleUnblockYears = async (clientId) => {
    const cur = noticeControl[clientId]
    if (!cur || cur.blocked_years.length === 0) return
    const res = await noticeControlService.unblockYears(clientId, cur.blocked_years)
    setNoticeControl(prev => {
      const c = prev[clientId]
      const newAvailable = [...new Set([...c.available_years, ...c.blocked_years])].sort()
      return { ...prev, [clientId]: { available_years: newAvailable, blocked_years: [] } }
    })
    setSelectedYears(prev => ({ ...prev, [clientId]: [] }))
  }

  const toggleYearSelection = (clientId, year) => {
    setSelectedYears(prev => {
      const cur = prev[clientId] || []
      return { ...prev, [clientId]: cur.includes(year) ? cur.filter(y => y !== year) : [...cur, year] }
    })
  }

  const uniqueProfessionals = Array.from(new Set([
    ...professionals.map(p => p.name || p.professional_name || '').filter(Boolean),
    ...clients.map(c => c.assigned_professional?.professional_name || c.assigned_professional || '').filter(Boolean)
  ]))

  const filtered = (Array.isArray(clients) ? clients : []).filter(c => {
    const searchMatch = search === '' ||
      (c?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c?.pan || '').toLowerCase().includes(search.toLowerCase()) ||
      (c?.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (c?.assigned_professional?.professional_name || c?.assigned_professional || '').toLowerCase().includes(search.toLowerCase())

    const cStatus = getStatus(c).toLowerCase()
    const targetStatus = appliedStatus.toLowerCase()
    const statusMatch = !appliedStatus || cStatus === targetStatus

    const cProf = (c?.assigned_professional?.professional_name || c?.assigned_professional || '').toLowerCase()
    const profMatch = !appliedProfessional || cProf === appliedProfessional.toLowerCase()

    return searchMatch && statusMatch && profMatch
  })

  const getInitials = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const bgFor = (i) => ['#dbeafe', '#f0fdf4', '#fdf4ff', '#fff7ed', '#f0fdf4'][i % 5]

  const stats = [
    { label: 'Total Users', value: (clients || []).length, color: '#1e293b', bar: '#2563eb' },
    { label: 'Under Review', value: (clients || []).filter(c => getStatus(c).toLowerCase() === 'under review').length, color: '#d97706', bar: '#d97706' },
    { label: 'Pending', value: (clients || []).filter(c => getStatus(c).toLowerCase() === 'pending').length, color: '#dc2626', bar: '#dc2626' },
    { label: 'Completed', value: (clients || []).filter(c => getStatus(c).toLowerCase() === 'completed').length, color: '#16a34a', bar: '#16a34a' },
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

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '14%' }} /><col style={{ width: '15%' }} /><col style={{ width: '11%' }} />
              <col style={{ width: '16%' }} /><col style={{ width: '10%' }} /><col style={{ width: '10%' }} /><col style={{ width: '24%' }} />
            </colgroup>
            <thead>
              <tr>
                {['User', 'Email', 'PAN', 'Assigned Professional', 'Status', 'Action', 'Notice Control'].map(h => (
                  <th key={h} style={{ background: '#f8fafc', color: '#64748b', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', padding: '10px 10px', borderBottom: '0.5px solid #e2e8f0', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>Loading users...</td></tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8', fontSize: 13 }}>
                    No data available
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 48, color: '#94a3b8', fontSize: 12 }}>
                    No users found matching the active search or filters.
                  </td>
                </tr>
              ) : (
                filtered.map((c, i) => (
                  <tr key={c.id || i} style={{ borderBottom: '0.5px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          onClick={() => navigate(`/staff/notices?assessee=${encodeURIComponent(c.name)}&pan=${encodeURIComponent(c.pan || '')}&uid=${encodeURIComponent(c.id || '')}`, { state: { assesseeName: c.name, assesseePan: c.pan, assesseeId: c.id } })}
                          style={{ fontWeight: 600, fontSize: 13, cursor: 'pointer', color: '#1e3a8a' }}
                          onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                        >
                          {c.name}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 10px', fontSize: 13 }}>{c.email}</td>
                    <td style={{ padding: '12px 10px', color: '#64748b', fontSize: 12 }}>{c.pan}</td>
                    <td style={{ padding: '12px 10px', color: '#1e3a8a', fontWeight: 500, fontSize: 13 }}>
                      {c.assigned_professional?.professional_name || c.assigned_professional}
                    </td>
                    <td style={{ padding: '12px 10px' }}>{statusBadge(getStatus(c))}</td>
                    <td style={{ padding: '11px 10px', position: 'relative' }}>
                      <button
                        style={{ background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                        onClick={() => setAssignDropdownOpen(assignDropdownOpen === (c.id || i) ? null : (c.id || i))}
                      >
                        Assign
                      </button>
                      {assignDropdownOpen === (c.id || i) && (
                        <>
                          <div
                            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }}
                            onClick={() => setAssignDropdownOpen(null)}
                          />
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            zIndex: 100,
                            background: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: 8,
                            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                            minWidth: 180,
                            maxHeight: 200,
                            overflowY: 'auto',
                            marginTop: 4
                          }}>
                            {uniqueProfessionals.length === 0 ? (
                              <div style={{ padding: '10px 14px', fontSize: 11, color: '#94a3b8' }}>No professionals available</div>
                            ) : (
                              uniqueProfessionals.map(profName => (
                                <div
                                  key={profName}
                                  onClick={async () => {
                                    // Find professional id from loaded professionals
                                    const profObj = professionals.find(p => (p.name || p.professional_name || '').toLowerCase() === (profName || '').toLowerCase())
                                    try {
                                      if (profObj && profObj.id) {
                                        await userService.assignProfessional(c.id, profObj.id)
                                      } else {
                                        // Fallback: attempt to call API with professional name if id not found
                                        await userService.assignProfessional(c.id, profName)
                                      }
                                    } catch (err) {
                                      console.warn('assignProfessional API failed:', err)
                                    }

                                    // Update local clients state for immediate UI feedback
                                    setClients(prev => prev.map(cl => {
                                      if ((cl.id || clients.indexOf(cl)) === (c.id || i)) {
                                        return { ...cl, assigned_professional: profName, status: 'completed' }
                                      }
                                      return cl
                                    }))

                                    // Notify other dashboards to refresh or update UI
                                    try {
                                      window.dispatchEvent(new CustomEvent('professionalAssigned', { detail: { userId: c.id, professionalName: profName } }))
                                    } catch (e) {
                                      // ignore if dispatch not supported
                                    }

                                    setAssignDropdownOpen(null)
                                  }}
                                  style={{
                                    padding: '9px 14px',
                                    fontSize: 12,
                                    color: '#1e293b',
                                    cursor: 'pointer',
                                    borderBottom: '0.5px solid #f1f5f9',
                                    transition: 'background 0.15s'
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                  {profName}
                                </div>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </td>
                    <td style={{ padding: '8px 6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {/* Multi-select year dropdown */}
                        <div style={{ position: 'relative' }}>
                          <button
                            onClick={() => setYearDropdownOpen(yearDropdownOpen === (c.id || i) ? null : (c.id || i))}
                            style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff', fontSize: 10, cursor: 'pointer', color: '#1e293b', minWidth: 70, textAlign: 'left', whiteSpace: 'nowrap' }}
                          >
                            {(selectedYears[c.id] || []).length > 0 ? `${(selectedYears[c.id]).length} selected` : 'Years ▾'}
                          </button>
                          {yearDropdownOpen === (c.id || i) && (
                            <>
                              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }} onClick={() => setYearDropdownOpen(null)} />
                              <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: 130, marginTop: 4, maxHeight: 180, overflowY: 'auto' }}>
                                {((noticeControl[c.id] || {}).available_years || []).length === 0 ? (
                                  <div style={{ padding: '8px 10px', fontSize: 10, color: '#94a3b8' }}>All years blocked</div>
                                ) : (
                                  ((noticeControl[c.id] || {}).available_years || []).map(year => (
                                    <label key={year} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', fontSize: 11, cursor: 'pointer', borderBottom: '0.5px solid #f1f5f9' }}
                                      onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                      <input type="checkbox" checked={(selectedYears[c.id] || []).includes(year)} onChange={() => toggleYearSelection(c.id, year)} style={{ accentColor: '#1e3a8a', cursor: 'pointer' }} />
                                      {year}
                                    </label>
                                  ))
                                )}
                              </div>
                            </>
                          )}
                        </div>
                        <button
                          onClick={() => handleBlockYears(c.id)}
                          style={{ padding: '4px 10px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}
                        >
                          Block
                        </button>
                        <button
                          onClick={() => handleUnblockYears(c.id)}
                          disabled={!((noticeControl[c.id] || {}).blocked_years || []).length}
                          style={{ padding: '4px 10px', background: ((noticeControl[c.id] || {}).blocked_years || []).length ? '#16a34a' : '#d1d5db', color: '#fff', border: 'none', borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: ((noticeControl[c.id] || {}).blocked_years || []).length ? 'pointer' : 'default' }}
                        >
                          Unblock
                        </button>
                        {((noticeControl[c.id] || {}).blocked_years || []).length > 0 && (
                          <div style={{ fontSize: 9, color: '#dc2626', marginTop: 2, width: '100%' }}>
                            Blocked: {(noticeControl[c.id].blocked_years).join(', ')}
                          </div>
                        )}
                      </div>
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