import React, { useEffect, useState } from 'react'
import { AlertCircle, Building2, Calendar, FileText, RefreshCw } from 'lucide-react'
import DashboardHeader from './DashboardHeader'
import DashboardSummaryCards from './DashboardSummaryCards'
import AssignmentList from './AssignmentList'
import { dashboardService } from '../../../services/dashboardService'
import { useAuth } from '../../../context/AuthContext'
import LoadingSpinner from '../../../components/common/LoadingSpinner'
import EmptyState from '../../../components/common/EmptyState'
import ErrorBoundary from '../../../components/common/ErrorBoundary'

const getItems = (payload) => {
  if (Array.isArray(payload)) return payload
  return payload?.items || payload?.data?.items || []
}

const formatDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString()
}

const DashboardPage = () => {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [summaryError, setSummaryError] = useState(null)
  const [recentNotices, setRecentNotices] = useState([])
  const [recentNoticesLoading, setRecentNoticesLoading] = useState(true)
  const [recentNoticesError, setRecentNoticesError] = useState(null)
  const [professionalStats, setProfessionalStats] = useState([])
  const [professionalStatsLoading, setProfessionalStatsLoading] = useState(true)
  const [professionalStatsError, setProfessionalStatsError] = useState(null)

  const fetchSummary = async () => {
    setSummaryLoading(true)
    setSummaryError(null)
    try {
      const data = await dashboardService.getStats()
      setSummary(data)
    } catch (err) {
      console.error('Failed to load dashboard stats', err)
      setSummaryError('Failed to load statistics')
    } finally {
      setSummaryLoading(false)
    }
  }

  const fetchRecentNotices = async () => {
    setRecentNoticesLoading(true)
    setRecentNoticesError(null)
    try {
      const data = await dashboardService.getRecentNotices({ page: 1, page_size: 5 })
      setRecentNotices(getItems(data))
    } catch (err) {
      console.error('Failed to load recent notices', err)
      setRecentNotices([])
      setRecentNoticesError('Failed to load recent notices')
    } finally {
      setRecentNoticesLoading(false)
    }
  }

  const fetchProfessionalStats = async () => {
    setProfessionalStatsLoading(true)
    setProfessionalStatsError(null)
    try {
      const data = await dashboardService.getProfessionalStats()
      const normalized = Array.isArray(data) ? data : getItems(data)
      const list = Array.isArray(normalized) ? normalized : [normalized].filter(Boolean)
      setProfessionalStats(list)
    } catch (err) {
      console.error('Failed to load professional stats', err)
      setProfessionalStats([])
      setProfessionalStatsError('Failed to load professional stats')
    } finally {
      setProfessionalStatsLoading(false)
    }
  }

  const refreshDashboard = async () => {
    await Promise.all([fetchSummary(), fetchRecentNotices(), fetchProfessionalStats()])
  }

  useEffect(() => {
    refreshDashboard()
  }, [])

  const initialLoading = summaryLoading && recentNoticesLoading && professionalStatsLoading

  if (initialLoading) {
    return (
      <ErrorBoundary>
        <div className="p-6 flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <LoadingSpinner />
            <p className="text-sm text-gray-500 mt-2">Loading dashboard...</p>
          </div>
        </div>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DashboardHeader onRefresh={refreshDashboard} />

        <DashboardSummaryCards
          summary={summary}
          isLoading={summaryLoading}
          error={summaryError}
          onRetry={fetchSummary}
        />

        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Recent Notices</h2>
              <p className="text-sm text-gray-500 mt-1">Latest live notices from the backend</p>
            </div>
            <button
              type="button"
              onClick={fetchRecentNotices}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          {recentNoticesLoading ? (
            <LoadingSpinner />
          ) : recentNoticesError ? (
            <div className="p-6">
              <div className="rounded-xl border border-red-200 bg-red-50 p-5 flex flex-col items-center justify-center text-center">
                <AlertCircle className="text-red-500 mb-2" size={32} />
                <p className="text-sm text-red-700 mb-4">{recentNoticesError}</p>
                <button
                  type="button"
                  onClick={fetchRecentNotices}
                  className="px-4 py-2 bg-white border border-red-300 rounded-md text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : recentNotices.length === 0 ? (
            <EmptyState message="No recent notices available" onAction={fetchRecentNotices} actionLabel="Reload" />
          ) : (
            <div className="divide-y divide-gray-100">
              {recentNotices.map((notice, index) => (
                <div key={notice.notice_id || notice.id || `${notice.proceeding_id}-${notice.created_at}-${index}`} className="px-6 py-4 grid grid-cols-1 gap-3 md:grid-cols-5 md:items-center">
                  <div className="md:col-span-2">
                    <p className="text-sm font-semibold text-gray-900">{notice.assessee_name || notice.notice_assessee_name || 'Unknown Assessee'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Proceeding ID: {notice.proceeding_id || notice.notice_id || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 font-medium mb-1">Type</p>
                    <p className="text-sm text-gray-700 inline-flex items-center gap-2"><FileText size={14} className="text-blue-600" />{notice.notice_type || notice.proceeding_type || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 font-medium mb-1">Created</p>
                    <p className="text-sm text-gray-700 inline-flex items-center gap-2"><Calendar size={14} className="text-gray-500" />{formatDate(notice.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 font-medium mb-1">Status</p>
                    <p className="text-sm font-medium text-gray-800">{notice.status || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Professional Stats</h2>
              <p className="text-sm text-gray-500 mt-1">Live assignment metrics by professional</p>
            </div>
            <button
              type="button"
              onClick={fetchProfessionalStats}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Building2 size={16} />
              Refresh
            </button>
          </div>

          {professionalStatsLoading ? (
            <LoadingSpinner />
          ) : professionalStatsError ? (
            <div className="p-6">
              <div className="rounded-xl border border-red-200 bg-red-50 p-5 flex flex-col items-center justify-center text-center">
                <AlertCircle className="text-red-500 mb-2" size={32} />
                <p className="text-sm text-red-700 mb-4">{professionalStatsError}</p>
                <button
                  type="button"
                  onClick={fetchProfessionalStats}
                  className="px-4 py-2 bg-white border border-red-300 rounded-md text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : professionalStats.length === 0 ? (
            <EmptyState message="No professional stats available" onAction={fetchProfessionalStats} actionLabel="Reload" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 p-6">
              {professionalStats.map((item, index) => (
                <div key={item.professional_id || item.id || `${item.professional_name}-${index}`} className="rounded-xl border border-gray-200 p-4 bg-gray-50/60">
                  <p className="text-xs uppercase tracking-wide text-gray-400 font-medium mb-1">Professional</p>
                  <p className="text-sm font-semibold text-gray-900 mb-3">{item.professional_name || 'Unknown Professional'}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3"><span className="text-gray-500">Total Assignments</span><span className="font-medium text-gray-900">{item.total_assignments ?? 0}</span></div>
                    <div className="flex items-center justify-between gap-3"><span className="text-gray-500">Assigned Alphabets</span><span className="font-medium text-gray-900">{item.assigned_alphabets ?? item.assigned_alphabet ?? '—'}</span></div>
                    <div className="flex items-center justify-between gap-3"><span className="text-gray-500">Active</span><span className="font-medium text-gray-900">{String(item.is_active ?? false)}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <AssignmentList user={user} />
      </div>
    </ErrorBoundary>
  )
}

export default DashboardPage

