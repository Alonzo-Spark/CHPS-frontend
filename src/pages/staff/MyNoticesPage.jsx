import React, { useState, useEffect } from 'react'
import { Search, Filter, FileText, Mail, CheckCircle, Clock, ChevronRight } from 'lucide-react'
import StatusBadge from '../../components/common/StatusBadge'
import FilterPanel from '../../components/common/FilterPanel'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import { noticeService } from '../../services/noticeService'

const TABS = [
  { id: 'action', label: 'For your Action' },
  { id: 'info', label: 'For your Information' },
]

const VIEWS = [
  { id: 'self', label: 'Self' },
  { id: 'other', label: 'Of Other ID' },
]

const NoticeCard = ({ notice }) => {
  const isAssessment = notice.proceeding_type === 'assessment'
  const Icon = isAssessment ? FileText : Mail
  const iconBg = isAssessment ? 'bg-blue-50' : 'bg-yellow-50'
  const iconColor = isAssessment ? 'text-blue-600' : 'text-yellow-600'

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center`}>
            <Icon size={18} className={iconColor} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{notice.proceeding_name}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">
              Assessment Year: <span className="font-semibold text-gray-600">{notice.assessment_year}</span>
            </p>
          </div>
        </div>
        <StatusBadge status={notice.status} />
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Col 1 */}
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Audit ID / PAN</p>
              <p className="text-sm font-bold text-gray-900">{notice.audit_id}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Assessee Name</p>
              <p className="text-sm font-bold text-gray-900">{notice.assessee_name}</p>
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Limitation Date</p>
              <p className="text-sm font-semibold text-gray-900">{notice.limitation_date}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Applicable Act</p>
              <p className="text-sm font-semibold text-gray-900">{notice.applicable_act}</p>
            </div>
          </div>

          {/* Col 3 */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Financial Year</p>
            <p className="text-sm font-semibold text-gray-900">{notice.financial_year}</p>
          </div>

          {/* Col 4 – Recent Activity */}
          <div>
            {notice.recent_activities && notice.recent_activities.length > 0 ? (
              <>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Recent Activity</p>
                <div className="space-y-2">
                  {notice.recent_activities.map((act, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{act.label}</p>
                        <p className="text-xs text-gray-400">{act.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Current Status</p>
                <p className="text-xs text-gray-400 mb-1">Since Recent Activity is not available</p>
                {notice.current_status && (
                  <div className="flex items-start gap-2">
                    <Clock size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-blue-700">{notice.current_status.label}</p>
                      <p className="text-xs text-gray-400">{notice.current_status.description}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 pb-4">
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-md transition-colors">
          <FileText size={13} />
          View Notices/Orders ({notice.notice_count ?? 0})
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  )
}

const MyNoticesPage = () => {
  const [activeTab, setActiveTab] = useState('action')
  const [activeView, setActiveView] = useState('self')
  const [search, setSearch] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [notices, setNotices] = useState([])
  const [counts, setCounts] = useState({ action: 0, info: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotices = async () => {
      setLoading(true)
      try {
        const data = await noticeService.getNotices({
          tab: activeTab,
          view: activeView,
          search,
        })
        setNotices(data.items || data.results || [])
        setCounts({
          action: data.action_count ?? data.counts?.action ?? 0,
          info: data.info_count ?? data.counts?.info ?? 0,
        })
      } catch {
        setNotices([])
      } finally {
        setLoading(false)
      }
    }
    const debounce = setTimeout(fetchNotices, 300)
    return () => clearTimeout(debounce)
  }, [activeTab, activeView, search])

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-400 mb-4">
        <span>Dashboard</span>
        <span className="mx-1.5 text-gray-300">&rsaquo;</span>
        <span className="text-gray-700 font-medium">My Notices</span>
      </nav>

      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">My Notices</h1>
          {/* View Toggle */}
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                onClick={() => setActiveView(v.id)}
                className={`px-4 py-1.5 text-xs font-medium transition-colors ${
                  activeView === v.id
                    ? 'bg-white text-gray-900 font-semibold'
                    : 'bg-gray-50 text-gray-500 hover:bg-white'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID or Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
            />
          </div>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Filter size={14} />
            Filter
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilter && (
        <div className="mb-4">
          <FilterPanel onClose={() => setShowFilter(false)} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-5">
        {TABS.map((tab) => {
          const count = tab.id === 'action' ? counts.action : counts.info
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label} {count > 0 ? `(${count})` : ''}
            </button>
          )
        })}
      </div>

      {/* Notices List */}
      {loading ? (
        <LoadingSpinner />
      ) : notices.length === 0 ? (
        <EmptyState message="No notices found" icon={FileText} />
      ) : (
        <div>
          {notices.map((notice, idx) => (
            <NoticeCard key={notice.id || idx} notice={notice} />
          ))}
        </div>
      )}
    </div>
  )
}

export default MyNoticesPage
