import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Eye, FileText, Mail, Scale } from 'lucide-react'
import { noticeService } from '../../services/noticeService'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'

const PROCEEDING_ICONS = {
  assessment: { icon: FileText, color: '#2563eb' },
  letter:     { icon: Mail,     color: '#d97706' },
  appeal:     { icon: Scale,    color: '#7c3aed' },
}

const statusStyle = {
  'in progress':    { background: '#eff6ff', color: '#1d4ed8', border: '0.5px solid #bfdbfe' },
  'pending action': { background: '#fffbeb', color: '#92400e', border: '0.5px solid #fcd34d' },
  'completed':      { background: '#f0fdf4', color: '#166534', border: '0.5px solid #bbf7d0' },
}

const TlDot = ({ type }) => {
  if (type === 'done') return (
    <div style={{ width: '15px', height: '15px', borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
      <svg width="9" height="9" viewBox="0 0 9 9"><path d="M1.5 4.5l2 2 4-4" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </div>
  )
  if (type === 'open') return (
    <div style={{ width: '15px', height: '15px', borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
      <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#fff' }} />
    </div>
  )
  return (
    <div style={{ width: '15px', height: '15px', borderRadius: '50%', border: '2px solid #d97706', background: '#fffbeb', flexShrink: 0, marginTop: '1px' }} />
  )
}

const NoticeCard = ({ notice, onViewOrders }) => {
  const iconKey = notice.proceeding_type || 'assessment'
  const IconMeta = PROCEEDING_ICONS[iconKey] || PROCEEDING_ICONS.assessment
  const Icon = IconMeta.icon
  const statusKey = (notice.status || '').toLowerCase()
  const sStyle = statusStyle[statusKey] || statusStyle['in progress']

  return (
    <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
      {/* Header */}
      <div style={{ background: '#f0f4f8', borderBottom: '0.5px solid #e2e8f0', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon size={15} color={IconMeta.color} />
          <span style={{ fontSize: '12px', color: '#64748b' }}>Proceeding Name :</span>
          <span style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>{notice.proceeding_name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Assessment Year :</span>
          <span style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>{notice.assessment_year}</span>
          <span style={{ marginLeft: '6px', padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '500', ...sStyle }}>
            {notice.status}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 180px', gap: '0' }}>
        {/* Timeline */}
        <div style={{ padding: '14px 16px', borderRight: '0.5px solid #e2e8f0' }}>
          <p style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Activity timeline</p>
          {(notice.timeline || []).map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: i < (notice.timeline.length - 1) ? '10px' : '0', position: 'relative' }}>
              {i < (notice.timeline.length - 1) && (
                <div style={{ position: 'absolute', left: '7px', top: '16px', width: '1.5px', height: 'calc(100% + 2px)', background: '#e2e8f0' }} />
              )}
              <TlDot type={item.type} />
              <div>
                <p style={{ fontSize: '12px', fontWeight: '500', color: '#1e293b' }}>{item.date}</p>
                <p style={{ fontSize: '11px', color: item.type === 'done' ? '#16a34a' : item.type === 'open' ? '#2563eb' : '#d97706' }}>{item.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Details */}
        <div style={{ padding: '14px 16px', borderRight: '0.5px solid #e2e8f0' }}>
          {notice.limitation_date && (
            <>
              <p style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '3px' }}>Proceeding limitation date</p>
              <p style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b', marginBottom: '10px' }}>{notice.limitation_date}</p>
            </>
          )}
          <p style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '3px' }}>Financial year</p>
          <p style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b', marginBottom: '10px' }}>{notice.financial_year}</p>
          <p style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '3px' }}>Applicable act</p>
          <p style={{ fontSize: '12px', fontWeight: '500', color: '#1e293b' }}>{notice.applicable_act}</p>
        </div>

        {/* Action */}
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <button
            onClick={() => onViewOrders(notice.id)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 14px', background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '11px', fontWeight: '500', cursor: 'pointer', width: '100%', justifyContent: 'center' }}
          >
            <Eye size={13} />
            View Notices/Orders ({notice.order_count ?? 0})
          </button>
        </div>
      </div>
    </div>
  )
}

const NoticesActionPage = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('action')
  const [search, setSearch] = useState('')
  const [notices, setNotices] = useState([])
  const [counts, setCounts] = useState({ action: 0, info: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const data = await noticeService.getNotices({ tab: activeTab, search })
        setNotices(data.items || data.results || [])
        setCounts({ action: data.action_count ?? 0, info: data.info_count ?? 0 })
      } catch {
        setNotices([])
      } finally {
        setLoading(false)
      }
    }
    const t = setTimeout(fetch, 300)
    return () => clearTimeout(t)
  }, [activeTab, search])

  const total = notices.length
  const shown = notices.length

  return (
    <div style={{ padding: '16px 20px', fontFamily: 'sans-serif', fontSize: '13px' }}>
      {/* Title + Search */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <h2 style={{ fontSize: '19px', fontWeight: '500', color: '#1e293b' }}>Notices</h2>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>View and manage notice proceedings and responses</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '0.5px solid #cbd5e1', borderRadius: '8px', padding: '7px 12px', background: '#fff' }}>
          <Search size={13} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search by Notice ID / Name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: '12px', color: '#1e293b', background: 'transparent', width: '200px' }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1.5px solid #e2e8f0', marginBottom: '16px' }}>
        <button
          onClick={() => setActiveTab('action')}
          style={{ padding: '8px 16px', fontSize: '13px', fontWeight: activeTab === 'action' ? '500' : '400', color: activeTab === 'action' ? '#2563eb' : '#64748b', border: 'none', background: 'none', cursor: 'pointer', borderBottom: activeTab === 'action' ? '2px solid #2563eb' : '2px solid transparent', marginBottom: '-1.5px' }}
        >
          For your Action ({counts.action})
        </button>
        <button
          onClick={() => setActiveTab('info')}
          style={{ padding: '8px 16px', fontSize: '13px', fontWeight: activeTab === 'info' ? '500' : '400', color: activeTab === 'info' ? '#2563eb' : '#64748b', border: 'none', background: 'none', cursor: 'pointer', borderBottom: activeTab === 'info' ? '2px solid #2563eb' : '2px solid transparent', marginBottom: '-1.5px' }}
        >
          For your Information ({counts.info})
        </button>
      </div>

      {/* Cards */}
      {loading ? (
        <LoadingSpinner />
      ) : notices.length === 0 ? (
        <EmptyState message="No notices found" />
      ) : (
        <>
          {notices.map((notice, i) => (
            <NoticeCard
              key={notice.id || i}
              notice={notice}
              onViewOrders={(id) => navigate(`/staff/notice-orders/${id}`)}
            />
          ))}
          <p style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', padding: '4px 0' }}>
            Showing {shown} of {total} proceedings
          </p>
        </>
      )}
    </div>
  )
}

export default NoticesActionPage
