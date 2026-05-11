import React, { useState, useEffect, useRef } from 'react'
import { Search, Check, Play, Eye, MessageSquare } from 'lucide-react'
import { taskService } from '../../services/taskService'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import { useToast } from '../../context/ToastContext'

const TABS = [
  { id: 'all',         label: 'All Tasks' },
  { id: 'pending',     label: 'Pending' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'completed',   label: 'Completed' },
  { id: 'overdue',     label: 'Overdue' },
]

const AVATAR_COLORS = ['#3b82f6', '#7c3aed', '#059669', '#ea580c', '#1d4ed8', '#dc2626']

const priorityBadge = {
  high:   { background: '#fee2e2', color: '#b91c1c' },
  medium: { background: '#fef9c3', color: '#92400e' },
  low:    { background: '#dcfce7', color: '#166534' },
}

const statusPill = {
  'in progress': { background: '#dbeafe', color: '#1d4ed8' },
  pending:       { background: '#fef9c3', color: '#92400e' },
  overdue:       { background: '#fee2e2', color: '#b91c1c' },
  completed:     { background: '#dcfce7', color: '#166534' },
}

const StatCard = ({ label, value, sub, barColor, valueColor }) => (
  <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: '10px', padding: '18px 22px', flex: 1 }}>
    <p style={{ fontSize: '10px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</p>
    <p style={{ fontSize: '28px', fontWeight: '700', color: valueColor || '#1e293b', marginTop: '6px' }}>{value ?? '—'}</p>
    <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{sub}</p>
    <div style={{ height: '3px', borderRadius: '2px', marginTop: '14px', width: '48px', background: barColor }} />
  </div>
)

const TasksPage = () => {
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch]       = useState('')
  const [tasks, setTasks]         = useState([])
  const [tabCounts, setTabCounts] = useState({})
  const [stats, setStats]         = useState(null)
  const [loading, setLoading]     = useState(true)
  const [remarkTarget, setRemarkTarget] = useState(null)
  const [remarkText, setRemarkText]     = useState('')
  const remarkRef = useRef(null)

  const loadStats = async () => {
    try {
      const d = await taskService.getStats()
      setStats(d)
    } catch {}
  }

  const loadTasks = async () => {
    setLoading(true)
    try {
      const d = await taskService.getTasks({ tab: activeTab, search })
      setTasks(d.items || d.results || [])
      setTabCounts(d.counts || {})
    } catch {
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadStats() }, [])

  useEffect(() => {
    const t = setTimeout(loadTasks, 300)
    return () => clearTimeout(t)
  }, [activeTab, search])

  const handleStart = async (id) => {
    try {
      await taskService.updateStatus(id, 'in_progress')
      addToast('Task started', 'success')
      loadTasks()
    } catch { addToast('Failed to update task', 'error') }
  }

  const handleComplete = async (id) => {
    try {
      await taskService.updateStatus(id, 'completed')
      addToast('Task marked complete', 'success')
      loadTasks(); loadStats()
    } catch { addToast('Failed to update task', 'error') }
  }

  const handleRemark = async () => {
    if (!remarkText.trim()) return
    try {
      await taskService.addRemark(remarkTarget, remarkText)
      addToast('Remark added', 'success')
      setRemarkTarget(null); setRemarkText('')
    } catch { addToast('Failed to add remark', 'error') }
  }

  const getInitials = (name) => name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '??'
  const getAvatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length]

  return (
    <div style={{ padding: '20px 28px', fontFamily: 'sans-serif', fontSize: '13px' }}>
      {/* Title + Search */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b' }}>My Tasks</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '7px 12px', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <Search size={14} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search by Reference ID / Assessee Name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: '12px', color: '#1e293b', background: 'transparent', width: '240px' }}
          />
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
        <StatCard label="Total Assigned"  value={stats?.total_assigned}    sub="All active tasks"      barColor="#2563eb" />
        <StatCard label="Pending"         value={stats?.pending}            sub="Awaiting action"       barColor="#f59e0b" />
        <StatCard label="Overdue"         value={stats?.overdue}            sub="Requires attention"    barColor="#dc2626" valueColor="#dc2626" />
        <StatCard label="Completed Today" value={stats?.completed_today}    sub="Last 24 hours"         barColor="#16a34a" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1.5px solid #e2e8f0', marginBottom: '16px' }}>
        {TABS.map((tab) => {
          const count = tabCounts[tab.id]
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ padding: '10px 18px', fontSize: '13px', border: 'none', background: 'none', cursor: 'pointer', color: isActive ? '#2563eb' : '#64748b', fontWeight: isActive ? '500' : '400', borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent', marginBottom: '-1.5px' }}
            >
              {tab.label}{count != null ? ` (${count})` : ''}
            </button>
          )
        })}
      </div>

      {/* Table */}
      {loading ? <LoadingSpinner /> : tasks.length === 0 ? <EmptyState message="No tasks found" /> : (
        <div style={{ background: '#fff', borderRadius: '10px', border: '0.5px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Reference ID', 'Assessee Name', 'Task Type', 'Priority', 'Due Date', 'Status', 'Assigned By', 'Actions'].map(col => (
                  <th key={col} style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, idx) => {
                const statusKey = (task.status || '').toLowerCase().replace(' ', '_').replace('_', ' ')
                const sp = statusPill[statusKey] || statusPill.pending
                const priKey = (task.priority || '').toLowerCase()
                const pb = priorityBadge[priKey] || priorityBadge.medium
                const isDone = statusKey === 'completed'
                const isOverdue = statusKey === 'overdue'
                const isPending = statusKey === 'pending'

                return (
                  <tr key={task.id || idx} style={{ borderBottom: '0.5px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 12px', color: '#2563eb', fontWeight: '500' }}>{task.reference_id}</td>
                    <td style={{ padding: '12px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: getAvatarColor(task.assessee_name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600', color: '#fff', flexShrink: 0 }}>
                          {getInitials(task.assessee_name)}
                        </div>
                        <span style={{ fontWeight: '500' }}>{task.assessee_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <span style={{ background: '#f1f5f9', padding: '3px 9px', borderRadius: '5px', fontSize: '11px' }}>{task.task_type}</span>
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', ...pb }}>
                        {(task.priority || '').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 12px', color: isOverdue ? '#dc2626' : '#1e293b', fontWeight: isOverdue ? '500' : '400' }}>
                      {task.due_date}{isOverdue ? ' ⚠' : ''}
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', ...sp }}>
                        {(task.status || '').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 12px', color: '#64748b' }}>{task.assigned_by}</td>
                    <td style={{ padding: '12px 12px' }}>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        {!isDone && (isPending || isOverdue) && (
                          <button onClick={() => handleStart(task.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '500', border: 'none', cursor: 'pointer', background: '#2563eb', color: '#fff' }}>
                            <Play size={11} />Start
                          </button>
                        )}
                        {!isDone && statusKey === 'in progress' && (
                          <button onClick={() => handleComplete(task.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '500', border: 'none', cursor: 'pointer', background: '#16a34a', color: '#fff' }}>
                            <Check size={11} />Complete
                          </button>
                        )}
                        <button style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '500', cursor: 'pointer', background: '#fff', color: '#1e3a8a', border: '0.5px solid #1e3a8a' }}>
                          <Eye size={11} />View
                        </button>
                        <button
                          onClick={() => { setRemarkTarget(task.id); setRemarkText('') }}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '500', cursor: 'pointer', background: '#fff', color: '#64748b', border: '0.5px solid #e2e8f0' }}
                        >
                          <MessageSquare size={11} />Remark
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Remark Modal */}
      {remarkTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', marginBottom: '12px' }}>Add Remark</h3>
            <textarea
              ref={remarkRef}
              value={remarkText}
              onChange={(e) => setRemarkText(e.target.value)}
              placeholder="Enter your remark…"
              rows={4}
              style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: 'sans-serif' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <button onClick={() => setRemarkTarget(null)} style={{ padding: '7px 16px', border: '1px solid #e2e8f0', borderRadius: '7px', background: '#fff', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleRemark} style={{ padding: '7px 16px', border: 'none', borderRadius: '7px', background: '#1e3a8a', color: '#fff', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TasksPage
