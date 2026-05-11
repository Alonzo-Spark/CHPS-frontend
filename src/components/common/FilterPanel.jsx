import React, { useState } from 'react'
import { Calendar, ChevronDown, ChevronUp, X } from 'lucide-react'

const PROCEEDING_STATUSES = [
  'Open/Pending',
  'Closed',
  'Submitted',
  'e-Submission re-enabled by AO',
  'e-Submission closed by officer',
]

const ACTS = [
  { value: 'ita_1961', label: 'Income Tax Act 1961' },
  { value: 'ita_2025', label: 'Income Tax Act 2025' },
]

const SORT_OPTIONS = [
  { value: 'proc_created', label: 'Proc Created Date' },
  { value: 'proc_closure', label: 'Proc Closure Date' },
  { value: 'proc_limitation', label: 'Proc Limitation Date' },
]

const DateRangeGroup = ({ label }) => (
  <div>
    <p className="text-xs font-semibold text-gray-700 mb-2">{label}</p>
    <div className="space-y-2">
      {['From', 'To'].map((t) => (
        <div key={t} className="relative">
          <input
            type="text"
            placeholder="Choose Date"
            className="w-full pl-3 pr-8 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <Calendar size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      ))}
    </div>
  </div>
)

const FilterPanel = ({ onClose, onApply }) => {
  const [procStatus, setProcStatus] = useState('Open/Pending')
  const [displayNew, setDisplayNew] = useState(false)
  const [act, setAct] = useState('ita_1961')
  const [sortBy, setSortBy] = useState('proc_created')
  const [sortExpanded, setSortExpanded] = useState(true)

  const handleApply = () => {
    onApply?.({ procStatus, displayNew, act, sortBy })
    onClose?.()
  }

  const handleReset = () => {
    setProcStatus('Open/Pending')
    setDisplayNew(false)
    setAct('ita_1961')
    setSortBy('proc_created')
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg w-full max-w-2xl p-5 space-y-5">
      {/* Proceeding Status */}
      <div>
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Proceeding Status</p>
        <div className="flex flex-wrap gap-2">
          {PROCEEDING_STATUSES.map((s) => (
            <label key={s} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="procStatus"
                value={s}
                checked={procStatus === s}
                onChange={(e) => setProcStatus(e.target.value)}
                className="accent-blue-600"
              />
              <span className="text-xs text-gray-700">{s}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Display Only */}
      <div>
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Display Only</p>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={displayNew}
            onChange={(e) => setDisplayNew(e.target.checked)}
            className="accent-blue-600"
          />
          <span className="text-xs text-gray-700">New e-Proceedings</span>
        </label>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <DateRangeGroup label="Proc Created Date" />
          <DateRangeGroup label="Proc Closure Date" />
          <DateRangeGroup label="Proc Limitation Date" />
          <DateRangeGroup label="Notice Issued Date" />
        </div>
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
            {SORT_OPTIONS.map((o) => (
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
