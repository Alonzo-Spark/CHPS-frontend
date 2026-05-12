import React from 'react'

const DashboardCards = ({ stats }) => {
  const cards = [
    { title: 'Total Assigned', value: stats?.total_assigned, subtitle: 'All active assignments', barColor: '#2563eb' },
    { title: 'Pending Tasks', value: stats?.pending_tasks, subtitle: 'Awaiting action', barColor: '#f59e0b' },
    { title: 'Recently Updated', value: stats?.recently_updated, subtitle: 'Last 24h', barColor: '#6b7280' },
    { title: 'Completed Today', value: stats?.completed_today, subtitle: 'Today only', barColor: '#16a34a' },
    { title: 'Overdue', value: stats?.overdue, subtitle: 'Needs attention', barColor: '#dc2626' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      {cards.map((card) => (
        <div key={card.title} className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">{card.title}</p>
          <div className="text-3xl font-bold text-gray-900">{card.value ?? '—'}</div>
          <p className="text-xs text-gray-400 mt-0.5">{card.subtitle}</p>
          <div className="h-1.5 rounded mt-4 w-12" style={{ background: card.barColor }} />
        </div>
      ))}
    </div>
  )
}

export default DashboardCards
