import React, { useState } from 'react'
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'AUTO_ASSIGNED', label: 'Auto Assigned' },
  { value: 'REASSIGNED', label: 'Reassigned' },
]

const PROCEEDING_TYPES = [
  { value: '', label: 'All' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'notice', label: 'Notice' },
  { value: 'appeal', label: 'Appeal' },
  { value: 'letter', label: 'Letter' },
]

const ACTS = [
  { value: '', label: 'All' },
  { value: 'ita_1961', label: 'Income Tax Act 1961' },
  { value: 'ita_2025', label: 'Income Tax Act 2025' },
]

const FilterPanel = ({ onClose, onApply }) => {
  const [status, setStatus] = useState('')
  const [proceedingType, setProceedingType] = useState('')
  const [act, setAct] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [professionalId, setProfessionalId] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [sortExpanded, setSortExpanded] = useState(false)

  const handleApply = () => {
    onApply?.({
      status,
      proceeding_type: proceedingType,
      applicable_act: act,
      start_date: startDate,
      end_date: endDate,
      professional_id: professionalId,
      sortBy,
    })
    onClose?.()
  }

  const handleReset = () => {
    setStatus('')
    setProceedingType('')
    setAct('')
    setStartDate('')
    setEndDate('')
    setProfessionalId('')
    setSortBy('')
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg w-full max-w-2xl p-5 space-y-5">
      {/* Status */}
      <div>
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Status</p>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((option) => (
            <label key={option.value || option.label} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="status"
                value={option.value}
                checked={status === option.value}
                onChange={(e) => setStatus(e.target.value)}
                className="accent-blue-600"
              />
              <span className="text-xs text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Proceeding Type */}
      <div>
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Proceeding Type</p>
        <div className="flex flex-wrap gap-2">
          {PROCEEDING_TYPES.map((option) => (
            <label key={option.value || option.label} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="proceeding_type"
                value={option.value}
                checked={proceedingType === option.value}
                onChange={(e) => setProceedingType(e.target.value)}
                className="accent-blue-600"
              />
              <span className="text-xs text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Applicable Act */}
      <div>
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Applicable Act</p>
        <div className="space-y-1.5">
          {ACTS.map((a) => (
            <label key={a.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="act"
                value={a.value}
                checked={act === a.value}
                onChange={(e) => setAct(e.target.value)}
                className="accent-blue-600"
              />
              <span className="text-xs text-gray-700">{a.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Date Filters */}
      <div>
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Date Filters</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2">Start Date</p>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-3 pr-8 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Calendar size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2">End Date</p>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-3 pr-8 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Calendar size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Professional ID */}
      <div>
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Professional ID</p>
        <input
          type="text"
          value={professionalId}
          onChange={(e) => setProfessionalId(e.target.value)}
          placeholder="Enter professional ID"
          className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Sort By */}
      <div>
        <button
          type="button"
          onClick={() => setSortExpanded(!sortExpanded)}
          className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2"
        >
          Sort By
          {sortExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {sortExpanded && (
          <div className="space-y-1.5">
            {[
              { value: 'proc_created', label: 'Proc Created Date' },
              { value: 'proc_closure', label: 'Proc Closure Date' },
              { value: 'proc_limitation', label: 'Proc Limitation Date' },
            ].map((o) => (
              <label key={o.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sortBy"
                  value={o.value}
                  checked={sortBy === o.value}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="accent-blue-600"
                />
                <span className="text-xs text-gray-700">{o.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
        <button onClick={handleReset} className="text-xs text-gray-500 hover:text-gray-700 font-medium px-3 py-1.5">Reset</button>
        <button onClick={onClose} className="btn-secondary text-xs px-4 py-1.5">Cancel</button>
        <button onClick={handleApply} className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-colors">Apply</button>
      </div>
    </div>
  )
}

export default FilterPanel
