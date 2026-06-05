import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { userService, assignmentService, professionalService, noticeService, clientService, adminService } from '../../services'

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
  
  // Search state split into 3 fields
  const [searchAssessee, setSearchAssessee] = useState('')
  const [searchPan, setSearchPan] = useState('')
  const [searchProfessional, setSearchProfessional] = useState('')
  
  // Summary Cards State
  const [professionalsCount, setProfessionalsCount] = useState(0)
  const [clientsCount, setClientsCount] = useState(0)
  const [pendingNoticesCount, setPendingNoticesCount] = useState(0)

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
          file_no: item.client?.file_name || item.client?.file_no || item.client?.fileNumber || item.client?.fileId || item.file_name || item.file_no || item.fileNumber || item.fileId || 'N/A',
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

    // Fetch Summary Counts
    adminService.getProfessionalsCount()
      .then(res => setProfessionalsCount(res?.data?.count || 0))
      .catch(() => setProfessionalsCount(0))

    adminService.getClientsCount()
      .then(res => setClientsCount(res?.data?.count || 0))
      .catch(() => setClientsCount(0))

  }, [])

  // Calculate pending notices dynamically
  useEffect(() => {
    const count = clients.filter(c => getStatus(c) === 'Pending').length
    setPendingNoticesCount(count)
  }, [clients])

  const uniqueProfessionals = Array.from(new Set([
    ...professionals.map(p => p.name || p.professional_name || '').filter(Boolean),
    ...clients.map(c => c.assigned_professional?.professional_name || c.assigned_professional || '').filter(Boolean)
  ]))

  // Fetch chronological timeline of dynamic events progressively to not block rendering
  useEffect(() => {
    if (clients.length === 0) return

    const fetchTimelinesProgressively = async () => {
      try {
        const noticesRes = await noticeService.getNotices()
        const allN = noticesRes?.data || []
        
        // 1. Initial pass: compute unread status and "Notice Opened" events immediately
        const initialTimelines = {}
        const unreadData = {}
        const ayMap = {}

        clients.forEach(c => {
          const cName = (c.name || '').toLowerCase()
          const cId = c.client_id
          if (!cId) return

          const cNotices = allN.filter(n => (n.user || '').toLowerCase() === cName)

          // Unread state
          const hasUnread = cNotices.some(n => {
            const nId = n.notice_id ?? n.id
            return !getNoticeReadState({ ...n, is_read: readNoticeIds.includes(nId) ? true : (n.is_read || false) })
          })
          unreadData[cId] = hasUnread

          let events = []
          cNotices.forEach(n => {
            if (n.issued_on) {
              events.push({ name: 'Notice Opened', date: n.issued_on })
            }
            if (n.assessment_year && !ayMap[cId]) {
              ayMap[cId] = n.assessment_year
            }
          })
          
          events.sort((a, b) => new Date(a.date) - new Date(b.date))
          initialTimelines[cId] = events
        })

        // Update clients to have assessment_year dynamically extracted if missing
        setClients(prev => prev.map(c => ({
          ...c,
          assessment_year: (c.assessment_year && c.assessment_year !== 'N/A') ? c.assessment_year : (ayMap[c.client_id] || 'N/A')
        })))

        setClientUnreadMap(unreadData)
        setClientTimelines(prev => ({...prev, ...initialTimelines}))

        const finalAyMap = { ...ayMap }

        // 2. Async pass: fetch Responses and Proceedings progressively without blocking
        clients.forEach(async (c) => {
          const cName = (c.name || '').toLowerCase()
          const cId = c.client_id
          if (!cId) return
          const cNotices = allN.filter(n => (n.user || '').toLowerCase() === cName)

          let extraEvents = []

          // Partial Response
          await Promise.all(cNotices.map(async (n) => {
            try {
              const respRes = await noticeService.getResponse(n.notice_id)
              const resp = respRes?.data?.response_details || respRes?.response_details || respRes?.data || respRes
              if (resp && resp.response_submitted_on) {
                extraEvents.push({ name: 'Partial Response', date: resp.response_submitted_on })
              }
            } catch (e) {}
          }))

          // Notice Closed
          try {
            const procRes = await clientService.getClientProceedings(cId)
            const procs = procRes?.data?.proceedings || procRes?.proceedings || []
            procs.forEach(p => {
              if (p.closure_date) extraEvents.push({ name: p.status || p.proceeding_status || '', date: p.closure_date })
              if (p.assessment_year && !ayMap[cId]) ayMap[cId] = p.assessment_year
            })
          } catch (e) {}

          if (extraEvents.length > 0) {
            setClientTimelines(prev => {
              const merged = [...(prev[cId] || []), ...extraEvents]
              merged.sort((a, b) => new Date(a.date) - new Date(b.date))
              return { ...prev, [cId]: merged }
            })
          }
          
          if (finalAyMap[cId]) {
            // We'll map AY on the fly in the render to avoid race conditions here
          }
        })

      } catch (err) {
        console.warn('Failed to load timelines:', err)
      }
    }

    fetchTimelinesProgressively()
  }, [clients.length]) // Trigger only once when clients are initially loaded

  const filtered = clients.filter(c => {
    const qAssessee = searchAssessee.toLowerCase().trim()
    const qPan = searchPan.toLowerCase().trim()
    const qProf = searchProfessional.toLowerCase().trim()

    const nameMatch = !qAssessee || (c.name || '').toLowerCase().includes(qAssessee)
    const panMatch = !qPan || (c.pan || '').toLowerCase().includes(qPan)
    const profMatch = !qProf || (c.assigned_professional?.professional_name || c.assigned_professional || '').toLowerCase().includes(qProf)

    return nameMatch && panMatch && profMatch
  })

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Admin Dashboard' }]}>
      <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', width: '100%', flex: 1 }}>
        <h1 style={{ fontSize: 25, fontWeight: 700, color: '#1e293b', marginBottom: 20 }}>Admin Dashboard</h1>

        {/* SUMMARY CARDS */}
        <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div className="admin-stat-card" style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <p style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Professionals Count</p>
            <p style={{ color: '#0f172a', fontSize: 28, fontWeight: 700, marginTop: 4 }}>{professionalsCount}</p>
          </div>
          <div className="admin-stat-card" style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <p style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Clients Count</p>
            <p style={{ color: '#0f172a', fontSize: 28, fontWeight: 700, marginTop: 4 }}>{clientsCount}</p>
          </div>
          <div className="admin-stat-card" style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <p style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Pending Notices</p>
            <p style={{ color: '#d97706', fontSize: 28, fontWeight: 700, marginTop: 4 }}>{pendingNoticesCount}</p>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="admin-search-wrapper" style={{ position: 'relative', flex: 1, maxWidth: 600, display: 'flex', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 12, background: '#f8fafc' }}>
                <Search size={16} color="#94a3b8" />
              </div>
              <input
                type="text"
                placeholder="Assessee..."
                value={searchAssessee}
                onChange={e => setSearchAssessee(e.target.value)}
                style={{ flex: 1, padding: '9px 12px', border: 'none', borderRight: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }}
              />
              <input
                type="text"
                placeholder="PAN..."
                value={searchPan}
                onChange={e => setSearchPan(e.target.value)}
                style={{ flex: 1, padding: '9px 12px', border: 'none', borderRight: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }}
              />
              <input
                type="text"
                placeholder="Professional..."
                value={searchProfessional}
                onChange={e => setSearchProfessional(e.target.value)}
                style={{ flex: 1, padding: '9px 12px', border: 'none', fontSize: 14, outline: 'none' }}
              />
            </div>
          </div>

          <div className="admin-dashboard-list-container" style={{ flex: 1, width: '100%' }}>
            {/* Header Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr 1fr 1.1fr 1.4fr 1.4fr 1fr 1.1fr', width: '100%', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', minWidth: 1000 }}>
              {['File No', 'Assessee', 'PAN', 'Assessment Year', 'Assigned Professional', 'Activity Timeline', 'Action', 'Proceedings'].map(h => (
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
                <div key={c.id || i} style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr 1fr 1.1fr 1.4fr 1.4fr 1fr 1.1fr', width: '100%', borderBottom: '0.5px solid #f1f5f9', alignItems: 'center', transition: 'all 0.3s ease' }}>
                  <div style={{ padding: '14px 20px', color: '#475569', fontWeight: 600, fontSize: 14 }}>
                    {c.file_no || 'N/A'}
                  </div>
                  <div style={{ padding: '14px 20px', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 14, color: '#1e293b', fontWeight: 600 }}>{c.name}</span>
                    </div>
                  </div>
                  <div style={{ padding: '14px 20px', color: '#64748b', fontSize: 14 }}>{c.pan}</div>
                  <div style={{ padding: '14px 20px', color: '#475569', fontWeight: 500, fontSize: 14 }}>{c.assessment_year}</div>
                  <div style={{ padding: '14px 20px', color: '#1e3a8a', fontWeight: 500, fontSize: 14 }}>
                    <span 
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                      onClick={() => {
                        const profName = c.assigned_professional?.professional_name || c.assigned_professional;
                        if (profName && profName !== '—') {
                          const profObj = professionals.find(p => (p.name || p.professional_name || '').toLowerCase() === profName.toLowerCase());
                          const profId = profObj?.id || profObj?.professional_id || profName;
                          navigate(`/admin/professional/${profId}`);
                        }
                      }}
                    >
                      {c.assigned_professional?.professional_name || c.assigned_professional || '—'}
                    </span>
                  </div>
                  {/* Activity Timeline Column */}
                  <div style={{ padding: '14px 20px' }}>
                    <div style={{ maxHeight: 75, overflowY: 'auto', scrollBehavior: 'smooth' }}>
                      {!clientTimelines[c.client_id] ? (
                        <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>Loading...</span>
                      ) : clientTimelines[c.client_id].length === 0 ? (
                        <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>No activity</span>
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
