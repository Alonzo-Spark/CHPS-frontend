import React from 'react'
import { FileX } from 'lucide-react'

const EmptyState = ({ message = 'No data available', icon: Icon = FileX }) => (
  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
    <Icon size={40} className="mb-3 opacity-40" />
    <p className="text-sm">{message}</p>
  </div>
)

export default EmptyState
