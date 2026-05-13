import React from 'react'
import StatCard from '../../../components/common/StatCard'

const DashboardSummaryCards = () => {
  const cards = [
    { key: 'total_assigned', title: 'Total Assigned', value: 124, subtitle: 'All active assignments', color: 'blue', trend: '+12%' },
    { key: 'pending_tasks', title: 'Pending Tasks', value: 18, subtitle: 'Due today', color: 'red' },
    { key: 'recently_updated', title: 'Recently Updated', value: 42, subtitle: 'Last 24h', color: 'gray' },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <StatCard key={card.key} title={card.title} value={card.value} subtitle={card.subtitle} color={card.color} trend={card.trend} />
      ))}
    </div>
  )
}

export default DashboardSummaryCards
