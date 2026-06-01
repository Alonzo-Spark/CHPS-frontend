import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { userService, assignmentService, professionalService, noticeService, clientService } from '../../services'

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

const formatTimelineDate = (dateStr) => {
  if (!dateStr || dateStr === '-') return '-'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const day = String(d.getDate()).padStart(2, '0')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = months[d.getMonth()]
    const year = d.getFullYear()
    return `${day}-${month}-${year}`
  } catch {
    return dateStr
  }
}

export default function AdminDashboard() {
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [professionals, setProfessionals] = useState([])
  const [assignDropdownOpen, setAssignDropdownOpen] = useState(null)
  const [clientTimelines, setClientTimelines] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    assignmentService.searchAssignments()
      .then(res => {
        const raw = res?.data?.data || (Array.isArray(res?.data) ? res.data : [])
        const data = Array.isArray(raw) ? raw : []
        const mapped = data.map(item => ({
          id: item.assignment_id,
          client_id: item.client?.client_id,
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

    professionalService.getProfessionals()
      .then(res => {
        const raw = res?.data?.items || res?.data || []
        setProfessionals(Array.isArray(raw) ? raw : [])
      })
      .catch(() => setProfessionals([]))
  }, [])

  const uniqueProfessionals = Array.from(new Set([
    ...professionals.map(p => p.name || p.professional_name || '').filter(Boolean),
    ...clients.map(c => c.assigned_professional?.professional_name || c.assigned_professional || '').filter(Boolean)
  ]))

  // Fetch chronological timeline of dynamic events (Notice Opened, Partial Response, Notice Closed) for each client
  useEffect(() => {
    if (clients.length === 0) return

    const fetchAllClientTimelines = async () => {
      try {
        const noticesRes = await noticeService.getNotices()
        const allN = noticesRes?.data || []
        const timelineData = {}

        await Promise.all(clients.map(async (c) => {
          const cName = (c.name || '').toLowerCase()
          const cId = c.client_id
          if (!cId) return

          const cNotices = allN.filter(n => (n.user || '').toLowerCase() === cName)

          let events = []

          // 1. Notice Opened
          cNotices.forEach(n => {
            if (n.issued_on) {
              events.push({
                name: 'Notice Opened',
                date: n.issued_on
              })
            }
          })

          // 2. Partial Response
          await Promise.all(cNotices.map(async (n) => {
            try {
              const respRes = await noticeService.getResponse(n.notice_id)
              const resp = respRes?.data?.response_details || respRes?.response_details || respRes?.data || respRes
              if (resp && resp.response_submitted_on) {
                events.push({
                  name: 'Partial Response',
                  date: resp.response_submitted_on
                })
              }
            } catch (e) {
              console.warn('Failed to fetch response for notice:', n.notice_id)
            }
          }))

          // 3. Notice Closed
          try {
            const procRes = await clientService.getClientProceedings(cId)
            const procs = procRes?.data?.proceedings || procRes?.proceedings || []
            procs.forEach(p => {
              if (p.closure_date) {
                events.push({
                  name: 'Notice Closed',
                  date: p.closure_date
                })
              }
            })
          } catch (e) {
            console.warn('Failed to fetch proceedings for client:', cId)
          }

          // Sort chronologically
          events.sort((a, b) => new Date(a.date) - new Date(b.date))
          timelineData[cId] = events
        }))

        setClientTimelines(timelineData)
      } catch (err) {
        console.warn('Failed to load timelines:', err)
      }
    }

    fetchAllClientTimelines()
  }, [clients])

  const filtered = clients.filter(c => {
    if (!search) return true
    const q = search.toLowerCase().trim()
    const nameMatch = (c.name || '').toLowerCase().includes(q)
    const panMatch = (c.pan || '').toLowerCase().includes(q)
    const profMatch = (c.assigned_professional?.professional_name || c.assigned_professional || '').toLowerCase().includes(q)
    const yearMatch = (c.assessment_year || '').toString().toLowerCase().includes(q)
    const statusMatch = (c.status || '').toLowerCase().includes(q)
    const timelineMatch = (clientTimelines[c.client_id] || []).some(evt => 
      (evt.name || '').toLowerCase().includes(q) || 
      formatTimelineDate(evt.date).toLowerCase().includes(q)
    )
    return nameMatch || panMatch || profMatch || yearMatch || statusMatch || timelineMatch
  })

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Admin Dashboard' }]}>
      <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', width: '100%', flex: 1 }}>
        <h1 style={{ fontSize: 25, fontWeight: 700, color: '#1e293b', marginBottom: 20 }}>Admin Dashboard</h1>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="admin-search-wrapper" style={{ position: 'relative', width: 320 }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search Assessee, PAN, Assessment Year, or Professional..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' }}
              />
            </div>
          </div>

          <div className="admin-dashboard-list-container" style={{ flex: 1, width: '100%' }}>
            {/* Header Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.1fr 1.4fr 1.4fr 1fr 1.1fr', width: '100%', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Assessee', 'PAN', 'Assessment Year', 'Assigned Professional', 'Activity Timeline', 'Action', 'Proceedings'].map(h => (
                <div key={h} style={{ padding: '14px 20px', color: '#64748b', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', textAlign: 'left' }}>{h}</div>
              ))}
            </div>

            {/* Data Rows */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 14 }}>Loading...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 14 }}>No data found.</div>
            ) : (
              filtered.map((c, i) => (
                <div key={c.id || i} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.1fr 1.4fr 1.4fr 1fr 1.1fr', width: '100%', borderBottom: '0.5px solid #f1f5f9', alignItems: 'center' }}>
                  <div style={{ padding: '14px 20px', fontWeight: 600 }}>
                    <span style={{ fontSize: 14, color: '#1e293b' }}>{c.name}</span>
                  </div>
                  <div style={{ padding: '14px 20px', color: '#64748b', fontSize: 14 }}>{c.pan}</div>
                  <div style={{ padding: '14px 20px', color: '#475569', fontWeight: 500, fontSize: 14 }}>{c.assessment_year}</div>
                  <div style={{ padding: '14px 20px', color: '#1e3a8a', fontWeight: 500, fontSize: 14 }}>
                    {c.assigned_professional?.professional_name || c.assigned_professional || '—'}
                  </div>
                  {/* Activity Timeline Column */}
                  <div style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '80px', overflowY: 'auto' }}>
                      {(clientTimelines[c.client_id] || []).length === 0 ? (
                        <span style={{ color: '#94a3b8', fontSize: 13, fontStyle: 'italic' }}>No activity</span>
                      ) : (
                        (clientTimelines[c.client_id] || []).map((evt, idx) => (
                          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <span style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{evt.name}</span>
                            <span style={{ fontSize: 12, color: '#64748b' }}>{formatTimelineDate(evt.date)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  {/* Action Column */}
                  <div style={{ padding: '14px 20px', position: 'relative' }}>
                    <button
                      style={{ background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      onClick={() => setAssignDropdownOpen(assignDropdownOpen === (c.client_id || i) ? null : (c.client_id || i))}
                    >
                      Transfer
                    </button>
                    {assignDropdownOpen === (c.client_id || i) && (
                      <>
                        <div
                          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }}
                          onClick={() => setAssignDropdownOpen(null)}
                        />
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 20,
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
                            <div style={{ padding: '10px 14px', fontSize: 12, color: '#94a3b8' }}>No professionals available</div>
                          ) : (
                            uniqueProfessionals.map(profName => (
                              <div
                                key={profName}
                                onClick={async () => {
                                  const profObj = professionals.find(p => (p.name || p.professional_name || '').toLowerCase() === (profName || '').toLowerCase())
                                  try {
                                    if (profObj && profObj.id) {
                                      await userService.assignProfessional(c.client_id, profObj.id)
                                    } else {
                                      await userService.assignProfessional(c.client_id, profName)
                                    }
                                  } catch (err) {
                                    console.warn('assignProfessional API failed:', err)
                                  }

                                  setClients(prev => prev.map(cl => {
                                    if (cl.client_id === c.client_id) {
                                      return { ...cl, assigned_professional: { professional_name: profName } }
                                    }
                                    return cl
                                  }))

                                  try {
                                    window.dispatchEvent(new CustomEvent('professionalAssigned', { detail: { userId: c.client_id, professionalName: profName } }))
                                  } catch (e) {}

                                  setAssignDropdownOpen(null)
                                }}
                                style={{
                                  padding: '9px 14px',
                                  fontSize: 13,
                                  color: '#1e293b',
                                  cursor: 'pointer',
                                  borderBottom: '0.5px solid #f1f5f9',
                                  transition: 'background 0.15s',
                                  textAlign: 'left'
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
                  </div>
                  <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center' }}>
                    <button
                      onClick={() => {
                        const isInfo = (c.status || '').toLowerCase() === 'completed' || (c.status || '').toLowerCase() === 'closed'
                        navigate(`/proceedings?assessee=${encodeURIComponent(c.name)}&uid=${c.client_id || ''}&tab=${isInfo ? 'info' : 'action'}`, { state: { assesseeName: c.name, assesseeId: c.client_id } })
                      }}
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
                      View Notice
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
