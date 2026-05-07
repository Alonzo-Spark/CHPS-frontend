import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FileText, Mail, ChevronLeft, Filter, Download, Search, Eye, X, AlertCircle } from 'lucide-react'
import api from '../services/api'
import './EProceedings.css'

const STATUS_OPTS = ['All', 'In Progress', 'Pending Action', 'Completed', 'Open', 'Closed']
const YEAR_OPTS   = ['All', '2024-25', '2023-24', '2022-23', '2021-22', '2020-21', '2019-20']
const ACT_OPTS    = ['All', 'Audit Act 1961', 'Finance Act', 'Income Tax Act']
const TABS        = ['For your Action', 'For your Information']

function StatusBadge({ status }) {
  const map = {
    'In Progress':    'bdg--blue',
    'Pending Action': 'bdg--orange',
    'Completed':      'bdg--green',
    'Open':           'bdg--yellow',
    'Closed':         'bdg--grey',
  }
  return <span className={`ep-badge ${map[status] || 'bdg--grey'}`}>{status}</span>
}

function FilterPanel({ filters, onChange, onClose, onReset }) {
  return (
    <div className="ep-filter-panel">
      <div className="ep-filter-panel__hd">
        <span>Filters</span>
        <button className="ep-icon-btn" onClick={onClose}><X size={15} /></button>
      </div>
      {[
        { key: 'status', label: 'Status', opts: STATUS_OPTS },
        { key: 'assessmentYear', label: 'Assessment Year', opts: YEAR_OPTS },
        { key: 'applicableAct', label: 'Applicable Act', opts: ACT_OPTS },
      ].map(({ key, label, opts }) => (
        <div key={key} className="ep-filter-grp">
          <label className="ep-filter-lbl">{label}</label>
          <select className="ep-filter-sel" value={filters[key]}
            onChange={e => onChange(key, e.target.value)}>
            {opts.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      ))}
      <div className="ep-filter-actions">
        <button className="ep-btn ep-btn--ghost" onClick={onReset}>Reset</button>
        <button className="ep-btn ep-btn--primary" onClick={onClose}>Apply</button>
      </div>
    </div>
  )
}

function ProceedingCard({ item }) {
  const Icon = item.type === 'letter' ? Mail : FileText
  return (
    <div className="ep-card">
      <div className="ep-card-top">
        <div className="ep-card-icon"><Icon size={18} /></div>
        <div className="ep-card-hd">
          <span className="ep-card-title">{item.title}</span>
          <span className="ep-card-yr">Assessment Year: {item.assessmentYear}</span>
        </div>
        <StatusBadge status={item.status} />
      </div>

      <div className="ep-card-meta">
        {[
          { lbl: 'AUDIT ID / PAN',    val: item.auditId },
          { lbl: item.dateLabel || 'LIMITATION DATE', val: item.limitationDate },
          { lbl: 'FINANCIAL YEAR',    val: item.financialYear },
          { lbl: item.status === 'Pending Action' ? 'CURRENT STATUS' : 'RECENT ACTIVITY',
            val: item.recentActivity, cls: item.statusColor },
        ].map(({ lbl, val, cls }) => (
          <div key={lbl} className="ep-meta-item">
            <span className="ep-meta-lbl">{lbl}</span>
            <span className={`ep-meta-val ${cls || ''}`}>{val || '—'}</span>
          </div>
        ))}
      </div>

      {item.applicableAct && (
        <div className="ep-meta-item ep-meta-item--inline">
          <span className="ep-meta-lbl">APPLICABLE ACT</span>
          <span className="ep-meta-val">{item.applicableAct}</span>
        </div>
      )}
      {item.assessee && (
        <div className="ep-meta-item ep-meta-item--inline">
          <span className="ep-meta-lbl">ASSESSEE NAME</span>
          <span className="ep-meta-val">{item.assessee}</span>
        </div>
      )}

      <div className="ep-card-actions">
        <button className="ep-btn ep-btn--primary ep-btn--sm">
          <Eye size={13} /> View Notices/Orders ({item.noticeCount ?? 0})
        </button>
        {/* "+ Add / View Authorized Representative" intentionally removed */}
      </div>
    </div>
  )
}

export default function EProceedings() {
  const navigate = useNavigate()
  const location = useLocation()
  const isAdmin  = location.pathname.startsWith('/admin')
  const back     = isAdmin ? '/admin/tasks' : '/staff/tasks'

  const [activeTab, setActiveTab] = useState(TABS[0])
  const [data, setData]           = useState([])
  const [loading, setLoading]     = useState(false)
  const [search, setSearch]       = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [filters, setFilters]     = useState({ status: 'All', assessmentYear: 'All', applicableAct: 'All' })

  useEffect(() => {
    setLoading(true)
    const tab = activeTab === TABS[0] ? 'action' : 'info'
    api.getEProceedings(tab)
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [activeTab])

  const filtered = useMemo(() => {
    return data.filter(item => {
      const q = search.toLowerCase()
      const matchQ = !q ||
        item.auditId?.toLowerCase().includes(q) ||
        item.assessee?.toLowerCase().includes(q) ||
        item.title?.toLowerCase().includes(q)
      const matchS = filters.status === 'All' || item.status === filters.status
      const matchY = filters.assessmentYear === 'All' ||
        item.assessmentYear === filters.assessmentYear ||
        item.financialYear  === filters.assessmentYear
      const matchA = filters.applicableAct === 'All' || item.applicableAct === filters.applicableAct
      return matchQ && matchS && matchY && matchA
    })
  }, [data, search, filters])

  const activeCount = Object.values(filters).filter(v => v !== 'All').length
  const changeFilter = (k, v) => setFilters(p => ({ ...p, [k]: v }))
  const resetFilters = () => setFilters({ status: 'All', assessmentYear: 'All', applicableAct: 'All' })

  return (
    <div className="ep-page">
      {/* Breadcrumb */}
      <div className="ep-breadcrumb">
        <button onClick={() => navigate(back)}><ChevronLeft size={15} /> Back</button>
        <span>/</span><span>e-Proceedings</span>
      </div>

      {/* Page header */}
      <div className="ep-header">
        <h1 className="ep-title">e-Proceedings</h1>
        <div className="ep-header-right">
          {/* Search */}
          <div className="ep-search">
            <Search size={14} />
            <input placeholder="Search by ID or Name…" value={search}
              onChange={e => setSearch(e.target.value)} />
            {search && <button onClick={() => setSearch('')}><X size={13} /></button>}
          </div>

          {/* Filter button */}
          <button
            className={`ep-btn ep-btn--outline ${activeCount ? 'ep-btn--filter-on' : ''}`}
            onClick={() => setShowFilter(v => !v)}>
            <Filter size={14} /> Filter
            {activeCount > 0 && <span className="ep-filter-cnt">{activeCount}</span>}
          </button>

          {/* Excel */}
          <button className="ep-btn ep-btn--dark" onClick={() => alert('Connect to API for export')}>
            <Download size={14} /> Excel Download
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilter && (
        <FilterPanel filters={filters} onChange={changeFilter}
          onClose={() => setShowFilter(false)} onReset={resetFilters} />
      )}

      {/* Active filter chips */}
      {activeCount > 0 && (
        <div className="ep-chips">
          {Object.entries(filters).map(([k, v]) =>
            v !== 'All' ? (
              <span key={k} className="ep-chip">
                {v} <button onClick={() => changeFilter(k, 'All')}><X size={11} /></button>
              </span>
            ) : null
          )}
          <button className="ep-chip-clear" onClick={resetFilters}>Clear all</button>
        </div>
      )}

      {/* Tabs — Self/Of Other ID toggle intentionally removed */}
      <div className="ep-tabs">
        {TABS.map(t => (
          <button key={t} className={`ep-tab ${activeTab === t ? 'ep-tab--active' : ''}`}
            onClick={() => setActiveTab(t)}>{t}</button>
        ))}
      </div>

      {/* List */}
      <div className="ep-list">
        {loading ? (
          <div className="ep-empty"><p>Loading proceedings…</p></div>
        ) : filtered.length === 0 ? (
          <div className="ep-empty">
            <AlertCircle size={34} />
            <p>{search || activeCount ? 'No proceedings match your filters.' : 'No proceedings available.'}</p>
            {(search || activeCount > 0) && (
              <button className="ep-btn ep-btn--outline" onClick={() => { setSearch(''); resetFilters() }}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          filtered.map(item => <ProceedingCard key={item.id} item={item} />)
        )}
      </div>
    </div>
  )
}
