import React from 'react'
import { FileX } from 'lucide-react'

const EmptyState = ({ message = 'No data available', icon: Icon = FileX, actionLabel, onAction }) => (
  <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-center px-4">
    <Icon size={40} className="mb-3 opacity-40" />
    <p className="text-sm">{message}</p>
    {onAction && (
      <button
        type="button"
        onClick={onAction}
        className="mt-4 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        {actionLabel || 'Retry'}
      </button>
    )}
  </div>
)

export default EmptyState
