import React, { useEffect, useState } from 'react'
import { Search, Filter, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { assignmentService } from '../../../services/assignmentService'
import LoadingSpinner from '../../../components/common/LoadingSpinner'
import EmptyState from '../../../components/common/EmptyState'
import StatusBadge from '../../../components/common/StatusBadge'
import FilterPanel from '../../../components/common/FilterPanel'
import { resolveUuid } from '../../../services/paramHelpers'
import { useNavigate } from 'react-router-dom'

const AssignmentList = ({ user }) => {
  const navigate = useNavigate()

  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showFilter, setShowFilter] = useState(false)
  const [filters, setFilters] = useState({})

  const [pagination, setPagination] = useState({
    current_page: 1,
    page_size: 10,
    total_pages: 0,
    total_count: 0,
  })

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 500)
    return () => clearTimeout(handler)
  }, [search])

  const fetchAssignments = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await assignmentService.getAssignments({
        search: debouncedSearch,
        page,
        page_size: 10,
        professional_id: user?.professional_id || user?.id || undefined,
        ...filters,
      })
      const payload = response?.data || response || {}
      setAssignments(payload.items || [])
      setPagination({
        current_page: payload.current_page ?? page,
        page_size: payload.page_size ?? 10,
        total_pages: payload.total_pages ?? 0,
        total_count: payload.total_count ?? 0,
      })
    } catch (err) {
      console.error('Failed to load assignments', err)
      setAssignments([])
      setError('Failed to load assignments from server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignments()
  }, [debouncedSearch, page, filters, user?.professional_id, user?.id])

  const handleApplyFilters = (nextFilters) => {
    setFilters(nextFilters)
    setPage(1)
    setShowFilter(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      <div className="px-6 py-5 flex items-center justify-between flex-wrap gap-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-900">My Assignments</h2>
          <p className="text-sm text-gray-500 mt-1">Managing notification workflow and compliance deadlines</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search assignments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64 transition-shadow"
            />
          </div>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm transition-colors ${
              showFilter || Object.keys(filters).length > 0
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter size={16} />
            Filter {Object.keys(filters).length > 0 && `(${Object.keys(filters).length})`}
          </button>
        </div>
      </div>

      {showFilter && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <FilterPanel
            onClose={() => setShowFilter(false)}
            onApply={handleApplyFilters}
            initialFilters={filters}
          />
        </div>
      )}

      <div className="flex-1 min-h-[300px] relative">
        {loading ? (
          <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center min-h-[300px]">
            <LoadingSpinner />
          </div>
        ) : null}

        {error ? (
          <div className="p-8 flex flex-col items-center justify-center min-h-[300px] text-center">
            <AlertCircle className="text-red-500 mb-3" size={40} />
            <h3 className="text-base font-semibold text-gray-900 mb-1">Error Loading Data</h3>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <button
              onClick={fetchAssignments}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Retry Connection
            </button>
          </div>
        ) : !loading && assignments.length === 0 ? (
          <div className="min-h-[300px] flex items-center justify-center">
            <EmptyState message="No assignments found matching your criteria" onAction={fetchAssignments} actionLabel="Reload" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Assessee</th>
                  <th className="px-6 py-4 font-semibold">Professional</th>
                  <th className="px-6 py-4 font-semibold">Assignment Details</th>
                  <th className="px-6 py-4 font-semibold">Assigned On</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {assignments.map((row, index) => {
                  const assesseeName = row.notice_assessee_name || row.assessee_name || 'Unknown Client'
                  const professionalName = row.professional_name || row.assigned_professional?.professional_name || row.assigned_professional?.name || 'Unassigned'
                  const assignmentIdentifier = row.assignment_id || row.id || row.notice_id || index
                  const initials = assesseeName
                    ? assesseeName.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase()
                    : '??'
                  const assignmentUuid = resolveUuid(row.assignment_id, row.id, row.notice_id)

                  return (
                    <tr key={assignmentUuid || assignmentIdentifier} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">
                            {row.first_letter || initials}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{assesseeName}</div>
                            <div className="text-xs text-gray-500 mt-0.5">Proceeding ID: {row.proceeding_id || row.notice_id || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{professionalName}</td>
                      <td className="px-6 py-4 text-gray-600">
                        <div className="space-y-0.5">
                          <div className="text-gray-900 font-medium">Method: {row.assignment_method || '—'}</div>
                          <div className="text-xs text-gray-500">Alphabet: {row.assigned_alphabet || '—'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {row.assigned_at ? new Date(row.assigned_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={row.assignment_status || row.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex flex-col items-end gap-2">
                          <button
                            onClick={() => navigate(`/staff/assignments/${assignmentUuid || assignmentIdentifier}`)}
                            className="px-4 py-2 bg-white border border-gray-200 text-blue-600 hover:bg-blue-50 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => navigate(`/staff/notice-orders/${row.notice_id || row.proceeding_id}`)}
                            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                          >
                            View Notice
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
      </div>

      {!error && assignments.length > 0 && (
        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100 bg-gray-50">
          <span className="text-sm text-gray-500">
            Showing <span className="font-medium text-gray-900">{assignments.length}</span> of <span className="font-medium text-gray-900">{pagination.total_count}</span> assignments
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} className="text-gray-600" />
            </button>
            <span className="text-sm font-medium text-gray-700 px-2">
              Page {page} of {pagination.total_pages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
              disabled={page >= pagination.total_pages}
              className="p-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AssignmentList
