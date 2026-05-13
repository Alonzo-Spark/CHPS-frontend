import React from 'react'
import { AlertCircle } from 'lucide-react'

const DashboardSummaryCards = ({ summary, isLoading, error, onRetry }) => {
  const cards = [
    { key: 'total_assigned', title: 'Total Assigned', value: summary?.total_assigned || 0, subtitle: 'All active assignments', barColor: '#2563eb' },
    { key: 'pending_tasks', title: 'Pending Tasks', value: summary?.pending_tasks || 0, subtitle: 'Awaiting action', barColor: '#f59e0b' },
    { key: 'recently_updated', title: 'Recently Updated', value: summary?.recently_updated || 0, subtitle: 'Last 24h', barColor: '#6b7280' },
    { key: 'completed_today', title: 'Completed Today', value: summary?.completed_today || 0, subtitle: 'Today only', barColor: '#16a34a' },
    { key: 'overdue', title: 'Overdue', value: summary?.overdue || 0, subtitle: 'Needs attention', barColor: '#dc2626' },
  ]

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex flex-col items-center justify-center text-center">
        <AlertCircle className="text-red-500 mb-2" size={32} />
        <h3 className="text-sm font-semibold text-red-800 mb-1">Failed to load statistics</h3>
        <p className="text-xs text-red-600 mb-4">{error}</p>
        <button 
          onClick={onRetry}
          className="px-4 py-2 bg-white border border-red-300 rounded-md text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-28 animate-pulse flex flex-col justify-between">
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2" />
            <div className="h-2 bg-gray-200 rounded w-full mt-auto" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      {cards.map((card) => (
        <div key={card.key} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">{card.title}</p>
          <div className="text-3xl font-bold text-gray-900">{card.value ?? '—'}</div>
          <p className="text-xs text-gray-400 mt-0.5">{card.subtitle}</p>
          <div className="h-1.5 rounded mt-4 w-12" style={{ background: card.barColor }} />
        </div>
      ))}
    </div>
  )
}

export default DashboardSummaryCards
