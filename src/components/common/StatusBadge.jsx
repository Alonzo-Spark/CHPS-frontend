import React from 'react'

const statusConfig = {
  urgent:   { bg: 'bg-red-100',    text: 'text-red-700',    label: 'URGENT' },
  pending:  { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'PENDING' },
  settled:  { bg: 'bg-green-100',  text: 'text-green-700',  label: 'SETTLED' },
  reviewed: { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'REVIEWED' },
  'in progress': { bg: 'bg-teal-100', text: 'text-teal-700', label: 'IN PROGRESS' },
  'pending action': { bg: 'bg-orange-100', text: 'text-orange-700', label: 'PENDING ACTION' },
}

const StatusBadge = ({ status }) => {
  const key = status?.toLowerCase() || ''
  const cfg = statusConfig[key] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status?.toUpperCase() }
  return (
    <span className={`status-badge ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  )
}

export default StatusBadge
