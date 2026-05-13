import React, { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Filter, Search } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import LoadingSpinner from '../../../components/common/LoadingSpinner'
import EmptyState from '../../../components/common/EmptyState'
import { assignmentService } from '../../../services/assignmentService'
import TableRow from './TableRow'

const getItems = (payload) => {
  if (Array.isArray(payload)) return payload
  return payload?.items || payload?.data?.items || []
}

const AssignmentTable = () => {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
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
    }, 400)

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
      })
      const payload = response?.data || response || {}
      setAssignments(getItems(payload))
      setPagination({
        current_page: payload.current_page ?? page,
        page_size: payload.page_size ?? 10,
        total_pages: payload.total_pages ?? 0,
        total_count: payload.total_count ?? 0,
      })
    } catch (requestError) {
      console.error('Failed to load assignments', requestError)
      setAssignments([])
      setError('Failed to load assignments from server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignments()
  }, [debouncedSearch, page, user?.professional_id, user?.id])

  const handleViewNotice = (row) => {
    const referenceId = row?.reference_id || row?.notice_reference_id || row?.proceeding_id || row?.notice_id || row?.id
    console.log('View Notice clicked', referenceId, row)
  }

  const tableRows = useMemo(
    () => assignments.map((row, index) => (
      <TableRow
        key={row.notice_id || row.id || `${index}-${row.proceeding_id || row.reference_id || 'assignment'}`}
        row={row}
        index={index}
        onViewNotice={handleViewNotice}
      />
    )),
    [assignments]
  )

  return (
    <section className="overflow-hidden rounded-[12px] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">My Assignments</h2>
          <p className="mt-1 text-sm text-slate-500">Managing notification workflow and compliance deadlines</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search assignments..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="button"
            onClick={() => console.log('Filter clicked')}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Filter size={16} />
            Filter
          </button>

          <button
            type="button"
            onClick={() => console.log('Add Client clicked')}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            Add Client
          </button>

          <button
            type="button"
            onClick={() => console.log('New Notice clicked')}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            New Notice
          </button>
        </div>
      </div>

      <div className="relative min-h-[300px]">
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center bg-white/80">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
            <EmptyState message={error} onAction={fetchAssignments} actionLabel="Retry" />
          </div>
        ) : assignments.length === 0 ? (
          <div className="flex min-h-[300px] items-center justify-center p-8 text-center">
            <EmptyState message="No assignments found matching your criteria" onAction={fetchAssignments} actionLabel="Reload" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left">
              <thead className="bg-slate-50/80">
                <tr className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Proceeding Name</th>
                  <th className="px-6 py-4 font-semibold">Notice Type</th>
                  <th className="px-6 py-4 font-semibold">Reference ID</th>
                  <th className="px-6 py-4 font-semibold">Issued On</th>
                  <th className="px-6 py-4 font-semibold">Due Date</th>
                  <th className="px-6 py-4 font-semibold text-right">Notice</th>
                </tr>
              </thead>
              <tbody className="bg-white">{tableRows}</tbody>
            </table>
          </div>
        )}
      </div>

      {!error && assignments.length > 0 && (
        <div className="flex items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <p className="text-sm text-slate-500">
            Showing <span className="font-medium text-slate-900">{assignments.length}</span> of <span className="font-medium text-slate-900">{pagination.total_count}</span> assignments
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                console.log('Pagination previous clicked')
                setPage((currentPage) => Math.max(1, currentPage - 1))
              }}
              disabled={page <= 1}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => {
                console.log('Pagination next clicked')
                setPage((currentPage) => Math.min(pagination.total_pages || 1, currentPage + 1))
              }}
              disabled={page >= (pagination.total_pages || 1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default AssignmentTable
