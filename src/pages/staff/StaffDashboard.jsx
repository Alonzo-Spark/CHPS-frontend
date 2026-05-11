import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Plus, ChevronLeft, ChevronRight, ClipboardList, AlertCircle, Clock } from 'lucide-react'
import StatCard from '../../components/common/StatCard'
import StatusBadge from '../../components/common/StatusBadge'
import FilterPanel from '../../components/common/FilterPanel'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import { dashboardService } from '../../services/dashboardService'
import { useToast } from '../../context/ToastContext'

const StaffDashboard = () => {
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [stats, setStats] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [totalAssignments, setTotalAssignments] = useState(0)
  const [statsLoading, setStatsLoading] = useState(true)
  const [tableLoading, setTableLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showFilter, setShowFilter] = useState(false)
  const pageSize = 10

  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true)
      try {
        const data = await dashboardService.getStats()
        setStats(data)
      } catch {
        // Stats unavailable
      } finally {
        setStatsLoading(false)
      }
    }
    fetchStats()
  }, [])

  useEffect(() => {
    const fetchAssignments = async () => {
      setTableLoading(true)
      try {
        const data = await dashboardService.getAssignments({ search, page, page_size: pageSize })
        setAssignments(data.items || data.results || [])
        setTotalAssignments(data.total || data.count || 0)
      } catch {
        setAssignments([])
      } finally {
        setTableLoading(false)
      }
    }
    const debounce = setTimeout(fetchAssignments, 300)
    return () => clearTimeout(debounce)
  }, [search, page])

  const totalPages = Math.ceil(totalAssignments / pageSize)

  return (
    <div className="space-y-5">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statsLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-28 animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-1/3" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              title="Total Assigned"
              value={stats?.total_assigned}
              trend={stats?.total_assigned_trend}
              icon={ClipboardList}
              color="blue"
            />
            <StatCard
              title="Pending Tasks"
              value={stats?.pending_tasks}
              subtitle={stats?.pending_due_today ? `${stats.pending_due_today} Due today` : undefined}
              icon={AlertCircle}
              color="red"
            />
            <StatCard
              title="Recently Updated"
              value={stats?.recently_updated}
              subtitle={stats?.recently_updated_period || 'Last 24h'}
              icon={Clock}
              color="gray"
            />
          </>
        )}
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-900">My Assignments</h2>
            <p className="text-xs text-gray-400 mt-0.5">Managing notification workflow and compliance deadlines</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search assignments..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
              />
            </div>
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Filter size={15} />
              Filter
            </button>
            <button
              onClick={() => navigate('/staff/notices')}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold transition-colors"
            >
              <Plus size={15} />
              New Notice
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilter && (
          <div className="px-5 pb-4">
            <FilterPanel onClose={() => setShowFilter(false)} />
          </div>
        )}

        {/* Table */}
        {tableLoading ? (
          <LoadingSpinner />
        ) : assignments.length === 0 ? (
          <EmptyState message="No assignments found" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-y border-gray-200">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">User/Client Name</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Penalty Type</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount Due</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Issue Date</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Due Date</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Notice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {assignments.map((row, idx) => {
                    const initials = row.client_name
                      ? row.client_name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
                      : '??'
                    return (
                      <tr key={row.id || idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs flex-shrink-0">
                              {initials}
                            </div>
                            <span className="font-medium text-gray-900">{row.client_name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-sm">{row.penalty_type}</td>
                        <td className="px-5 py-3 font-semibold text-gray-900">{row.amount_due}</td>
                        <td className="px-5 py-3 text-gray-500 text-sm">{row.issue_date}</td>
                        <td className="px-5 py-3 text-gray-500 text-sm">{row.due_date}</td>
                        <td className="px-5 py-3"><StatusBadge status={row.status} /></td>
                        <td className="px-5 py-3">
                          <button
                            onClick={() => navigate('/staff/notices')}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-colors"
                          >
                            VIEW NOTICE
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-5 py-3 flex items-center justify-between border-t border-gray-100">
              <span className="text-xs text-gray-500">
                Showing {assignments.length} of {totalAssignments} assignments
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default StaffDashboard
