import React from 'react'

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend }) => {
  const barColor = {
    blue:   'bg-blue-500',
    red:    'bg-red-400',
    gray:   'bg-gray-300',
  }[color]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start justify-between">
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">{value ?? '—'}</span>
          {trend && (
            <span className="text-xs text-green-600 font-semibold">{trend}</span>
          )}
        </div>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        <div className={`h-0.5 w-16 mt-3 rounded-full ${barColor}`} />
      </div>
      {Icon && (
        <div className="text-gray-200">
          <Icon size={36} />
        </div>
      )}
    </div>
  )
}

export default StatCard
