import { useState, useEffect } from 'react'
import { Search, Filter, Trash2, Ban, AlertTriangle, UserPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { userService } from '../../services'

export default function ProfessionalClients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Search and Filter State
  const [searchFields, setSearchFields] = useState({ fileNo: '', name: '', pan: '' })
  const [statusFilter, setStatusFilter] = useState('All')
  
  // Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [clientToDelete, setClientToDelete] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const res = await userService.getUsers()
      const rawClients = res.data || []

      // Extra deduplication on frontend to guarantee no duplicate rows
      const uniqueClientsMap = new Map()
      rawClients.forEach(c => {
        const clientId = c.user_id || c.client_id || c.id || c.userId || `${c.email || c.name || c.username || 'unknown'}-${c.pan_number || c.pan || 'na'}`
        
        // Normalize status: treat anything that is not explicitly BLOCKED as ACTIVE
        const rawStatus = (c.status || c.account_status || c.stage || '').toUpperCase()
        const normalizedStatus = rawStatus === 'BLOCKED' ? 'BLOCKED' : 'ACTIVE'

        const normalizedClient = {
          ...c,
          client_id: clientId,
          file_no: c.file_name || c.file_no || c.fileNumber || c.fileId || c.client?.file_name || c.client?.file_no || 'N/A',
          client_name: c.client_name || c.name || c.full_name || c.username || 'Unknown User',
          pan_number: c.pan_number || c.pan || 'N/A',
          status: normalizedStatus
        }

        if (!uniqueClientsMap.has(clientId)) {
          uniqueClientsMap.set(clientId, normalizedClient)
        }
      })

      setClients(Array.from(uniqueClientsMap.values()))
    } catch (err) {
      console.error('Failed to fetch clients', err)
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  const handleBlock = async (clientId) => {
    try {
      await userService.blockUser(clientId)
      // Update local state
      setClients(prev => prev.map(c => c.client_id === clientId ? { ...c, status: 'BLOCKED' } : c))
    } catch (err) {
      console.error('Failed to block client', err)
      alert('Failed to block client. Please try again.')
    }
  }

  const handleUnblock = async (clientId) => {
    try {
      await userService.unblockUser(clientId)
      // Update local state
      setClients(prev => prev.map(c => c.client_id === clientId ? { ...c, status: 'ACTIVE' } : c))
    } catch (err) {
      console.error('Failed to unblock client', err)
      alert('Failed to unblock client. Please try again.')
    }
  }

  const confirmDelete = (client) => {
    setClientToDelete(client)
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    if (!clientToDelete) return
    try {
      await userService.deleteUser(clientToDelete.client_id)
      setClients(prev => prev.filter(c => c.client_id !== clientToDelete.client_id))
      setShowDeleteModal(false)
      setClientToDelete(null)
    } catch (err) {
      console.error('Failed to delete client', err)
      alert('Failed to delete client. Please try again.')
    }
  }

  // Derived Stats
  const totalClients = clients.length
  const activeClients = clients.filter(c => (c.status || '').toUpperCase() === 'ACTIVE').length
  const blockedClients = clients.filter(c => (c.status || '').toUpperCase() === 'BLOCKED').length

  // Filtering Logic
  const filteredClients = clients.filter(c => {
    const fileNoTerm = searchFields.fileNo.toLowerCase().trim()
    const nameTerm = searchFields.name.toLowerCase().trim()
    const panTerm = searchFields.pan.toLowerCase().trim()
    
    const matchesFileNo = !fileNoTerm || (c.file_no || '').toLowerCase().includes(fileNoTerm)
    const matchesName = !nameTerm || (c.client_name || '').toLowerCase().includes(nameTerm)
    const matchesPan = !panTerm || (c.pan_number || '').toLowerCase().includes(panTerm)
    
    const matchesStatus = statusFilter === 'All' || (c.status || '').toUpperCase() === statusFilter.toUpperCase()
    
    return matchesFileNo && matchesName && matchesPan && matchesStatus
  })

  // Badge Color Helper
  const getBadgeStyle = (status) => {
    const st = (status || '').toUpperCase()
    if (st === 'BLOCKED') return { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' }
    return { bg: '#dcfce7', color: '#166534', border: '#bbf7d0' } // ACTIVE (default)
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Clients' }]}>
      <div style={{ padding: '20px 22px' }}>
        
        {/* SUMMARY CARDS */}
        <div className="prof-clients-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          
          <div className="prof-clients-stat-card dashboard-card" style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <p style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Total Clients</p>
            <p style={{ color: '#0f172a', fontSize: 28, fontWeight: 700, marginTop: 4 }}>{totalClients}</p>
          </div>
          
          <div className="prof-clients-stat-card dashboard-card" style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <p style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Active Clients</p>
            <p style={{ color: '#16a34a', fontSize: 28, fontWeight: 700, marginTop: 4 }}>{activeClients}</p>
          </div>
          

          <div className="prof-clients-stat-card dashboard-card" style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <p style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Blocked Clients</p>
            <p style={{ color: '#b91c1c', fontSize: 28, fontWeight: 700, marginTop: 4 }}>{blockedClients}</p>
          </div>
          
        </div>

        {/* MAIN PANEL */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          
          {/* HEADER & CONTROLS */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            
            <div>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#1e293b' }}>Client Management</p>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>View and manage your assigned clients</p>
            </div>
            
            <div className="prof-clients-controls-container" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flex: 1, maxWidth: 800, justifyContent: 'flex-end' }}>
              
              {/* SEARCH */}
              <div className="prof-clients-search-box" style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 12px', background: '#f8fafc', flex: 1, minWidth: 400 }}>
                <Search size={16} color="#64748b" />
                <input 
                  type="text" 
                  placeholder="File No..." 
                  value={searchFields.fileNo}
                  onChange={(e) => setSearchFields({...searchFields, fileNo: e.target.value})}
                  style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: '#1e293b' }}
                />
                <div style={{ width: 1, height: 16, background: '#cbd5e1' }} />
                <input 
                  type="text" 
                  placeholder="Client Name..." 
                  value={searchFields.name}
                  onChange={(e) => setSearchFields({...searchFields, name: e.target.value})}
                  style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: '#1e293b' }}
                />
                <div style={{ width: 1, height: 16, background: '#cbd5e1' }} />
                <input 
                  type="text" 
                  placeholder="PAN Number..." 
                  value={searchFields.pan}
                  onChange={(e) => setSearchFields({...searchFields, pan: e.target.value})}
                  style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: '#1e293b' }}
                />
              </div>
              
              {/* STATUS FILTER */}
              <select
                className="prof-clients-filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, color: '#1e293b', background: '#f8fafc', cursor: 'pointer', outline: 'none' }}
              >
                <option value="All">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="BLOCKED">Blocked</option>
              </select>
              
            </div>
          </div>
          
          {/* TABLE */}
          <div className="prof-clients-table-wrapper" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>File No</th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client Name</th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PAN Number</th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading clients...</td>
                  </tr>
                ) : filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No clients found.</td>
                  </tr>
                ) : (
                  filteredClients.map((client) => {
                    const badge = getBadgeStyle(client.status)
                    const isBlocked = (client.status || '').toUpperCase() === 'BLOCKED'
                    
                    return (
                      <tr key={client.client_id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '16px 20px', fontSize: 14, color: isBlocked ? '#94a3b8' : '#475569', fontWeight: 600 }}>
                          {client.file_no || 'N/A'}
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: 500, color: isBlocked ? '#94a3b8' : '#1e293b' }}>
                          {client.client_name}
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: 14, color: isBlocked ? '#94a3b8' : '#475569' }}>
                          {client.pan_number || 'N/A'}
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{ 
                            display: 'inline-block', 
                            padding: '4px 10px', 
                            borderRadius: 9999, 
                            fontSize: 11, 
                            fontWeight: 600, 
                            background: badge.bg, 
                            color: badge.color, 
                            border: `1px solid ${badge.border}` 
                          }}>
                            {client.status}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            {isBlocked ? (
                              <button 
                                onClick={() => handleUnblock(client.client_id)}
                                style={{ 
                                  display: 'flex', alignItems: 'center', gap: 6, 
                                  padding: '6px 12px', 
                                  borderRadius: 6, 
                                  fontSize: 12, fontWeight: 500, 
                                  cursor: 'pointer',
                                  border: '1px solid #16a34a', 
                                  background: '#dcfce7', 
                                  color: '#166534',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#bbf7d0' }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = '#dcfce7' }}
                              >
                                Unblock
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleBlock(client.client_id)}
                                style={{ 
                                  display: 'flex', alignItems: 'center', gap: 6, 
                                  padding: '6px 12px', 
                                  borderRadius: 6, 
                                  fontSize: 12, fontWeight: 500, 
                                  cursor: 'pointer',
                                  border: '1px solid #cbd5e1', 
                                  background: '#fff', 
                                  color: '#475569',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc' }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = '#fff' }}
                              >
                                <Ban size={14} /> Block
                              </button>
                            )}
                            <button 
                              onClick={() => confirmDelete(client)}
                              style={{ 
                                display: 'flex', alignItems: 'center', gap: 6, 
                                padding: '6px 12px', 
                                borderRadius: 6, 
                                fontSize: 12, fontWeight: 500, cursor: 'pointer',
                                border: '1px solid #fecaca', 
                                background: '#fef2f2', 
                                color: '#dc2626',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                              onMouseLeave={(e) => e.currentTarget.style.background = '#fef2f2'}
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(15, 23, 42, 0.6)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          zIndex: 50, padding: 20 
        }}>
          <div style={{ 
            background: '#fff', borderRadius: 12, padding: 32, width: '100%', maxWidth: 400, 
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: '#ef4444' }}></div>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ background: '#fef2f2', padding: 12, borderRadius: '50%', color: '#ef4444' }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', margin: '0 0 8px 0' }}>Delete Client</h3>
                <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.5, margin: 0 }}>
                  Are you sure you want to permanently delete <strong>{clientToDelete?.client_name || clientToDelete?.name || clientToDelete?.full_name || clientToDelete?.username || 'this user'}</strong>? 
                  This will remove all their records and assignments. This action cannot be undone.
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
              <button 
                onClick={() => { setShowDeleteModal(false); setClientToDelete(null); }}
                style={{ 
                  padding: '10px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer',
                  border: '1px solid #cbd5e1', background: '#fff', color: '#475569'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                style={{ 
                  padding: '10px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer',
                  border: 'none', background: '#ef4444', color: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                Delete Client
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
