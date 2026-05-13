import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Search, SlidersHorizontal, FileText, FileType } from 'lucide-react'
import { noticeOrderService } from '../../services/noticeOrderService'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import { resolveUuid } from '../../services/paramHelpers'

const badgeStyle = {
  pending:     { background: '#fffbeb', color: '#92400e', border: '0.5px solid #fcd34d', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '500' },
  'in progress': { background: '#eff6ff', color: '#1d4ed8', border: '0.5px solid #bfdbfe', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '500' },
  completed:   { background: '#f0fdf4', color: '#166534', border: '0.5px solid #bbf7d0', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '500' },
}

const dueDateColor = {
  pending: '#dc2626',
  'in progress': '#d97706',
  completed: '#16a34a',
}

const OrderCard = ({ order }) => {
  const statusKey = (order.status || '').toLowerCase()
  const bs = badgeStyle[statusKey] || badgeStyle['pending']
  const dateColor = dueDateColor[statusKey] || '#64748b'

  return (
    <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px' }}>
      {/* Header */}
      <div style={{ background: '#f8fafc', borderBottom: '0.5px solid #e2e8f0', padding: '9px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FileText size={15} color="#2563eb" />
        <p style={{ fontSize: '12px', fontWeight: '500', color: '#1e293b', flex: 1 }}>
          Reference ID: <span style={{ fontFamily: 'monospace', color: '#1d4ed8' }}>{order.reference_id}</span>
        </p>
        <span style={bs}>{order.status}</span>
      </div>

      {/* Body */}
      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr 110px', gap: '0' }}>
        {/* Section */}
        <div style={{ padding: '14px 16px', borderRight: '0.5px solid #e2e8f0' }}>
          <p style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '3px' }}>Section</p>
          <p style={{ fontSize: '22px', fontWeight: '500', color: '#1e293b', lineHeight: '1.1' }}>{order.section}</p>
          <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Notice u/s</p>
        </div>

        {/* Doc Ref ID */}
        <div style={{ padding: '14px 16px', borderRight: '0.5px solid #e2e8f0' }}>
          <p style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '3px' }}>Document reference ID</p>
          <p style={{ fontSize: '11px', color: '#1d4ed8', fontFamily: 'monospace', marginTop: '2px', lineHeight: '1.5' }}>{order.document_reference_id}</p>
        </div>

        {/* Description + Dates */}
        <div style={{ padding: '14px 16px', borderRight: '0.5px solid #e2e8f0' }}>
          <p style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '3px' }}>Description</p>
          <p style={{ fontSize: '12px', color: '#1e293b', lineHeight: '1.6', marginTop: '2px' }}>{order.description}</p>
          <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
            <div>
              <p style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '3px' }}>Issued on</p>
              <p style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>{order.issued_on}</p>
            </div>
            <div>
              <p style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '3px' }}>
                {statusKey === 'completed' ? 'Closed on' : 'Response due'}
              </p>
              <p style={{ fontSize: '13px', fontWeight: '500', color: dateColor }}>{order.due_on || order.response_due || order.closed_on}</p>
            </div>
          </div>
        </div>

        {/* Action */}
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
          <button
            onClick={() => order.pdf_url && window.open(order.pdf_url, '_blank')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 13px', background: '#fff', color: '#1e293b', border: '0.5px solid #cbd5e1', borderRadius: '7px', fontSize: '11px', cursor: 'pointer', fontWeight: '500', justifyContent: 'center' }}
          >
            <FileType size={13} />View PDF
          </button>
        </div>
      </div>
    </div>
  )
}

const NoticeOrdersPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [proceeding, setProceeding] = useState(null)
  const [orders, setOrders] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [pagination, setPagination] = useState({
    current_page: 1,
    page_size: 10,
    total_pages: 0,
    total_count: 0,
  })

  const fetchAll = async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [procData, ordersData] = await Promise.all([
        noticeOrderService.getProceeding(id),
        noticeOrderService.getOrders(id, { search, page: 1, page_size: 10 }),
      ])
      const proceedingPayload = procData?.data || procData || null
      const ordersPayload = ordersData?.data || ordersData || {}
      setProceeding(proceedingPayload)
      setOrders(ordersPayload.items || [])
      setPagination({
        current_page: ordersPayload.current_page ?? 1,
        page_size: ordersPayload.page_size ?? 10,
        total_pages: ordersPayload.total_pages ?? 0,
        total_count: ordersPayload.total_count ?? 0,
      })
    } catch {
      setOrders([])
      setLoadError('Failed to load notice orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(fetchAll, 300)
    return () => clearTimeout(t)
  }, [id, search])

  return (
    <div style={{ padding: '18px 20px', fontFamily: 'sans-serif', fontSize: '13px' }}>
      {/* Page title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px', cursor: 'pointer' }}
            onClick={() => navigate('/staff/notices')}
          >
            <ArrowLeft size={13} color="#64748b" />
            <span style={{ fontSize: '12px', color: '#64748b' }}>Back to assignments</span>
          </div>
          <h2 style={{ fontSize: '19px', fontWeight: '500', color: '#1e293b' }}>Notice Orders</h2>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>View and manage notice proceedings and responses</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '0.5px solid #cbd5e1', borderRadius: '8px', padding: '7px 12px', background: '#fff' }}>
            <Search size={13} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search by DIN / Notice ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: '12px', color: '#1e293b', background: 'transparent', width: '180px' }}
            />
          </div>
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 12px', background: '#fff', color: '#64748b', border: '0.5px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
            <SlidersHorizontal size={13} />Filter
          </button>
        </div>
      </div>

      {/* Proceeding details */}
      {proceeding && (
        <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: '10px', padding: '14px 18px', marginBottom: '18px' }}>
          <p style={{ fontSize: '10px', fontWeight: '500', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '11px' }}>Proceeding details</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: '16px' }}>
            {[
              ['Proceeding name', proceeding.proceeding_name],
              ['PAN', proceeding.pan],
              ['Assessee name', proceeding.assessee_name],
              ['Assessment year', proceeding.assessment_year],
              ['Financial year', proceeding.financial_year],
              ['Applicable act', proceeding.applicable_act],
            ].map(([label, val]) => (
              <div key={label}>
                <p style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '3px' }}>{label}</p>
                <p style={{ fontSize: '12px', fontWeight: '500', color: '#1e293b', fontFamily: label === 'PAN' ? 'monospace' : 'inherit' }}>{val}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders list */}
      <p style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b', marginBottom: '11px' }}>
        Notice orders <span style={{ color: '#64748b', fontWeight: '400', fontSize: '12px' }}>· {orders.length} orders</span>
      </p>

      {loading ? (
        <LoadingSpinner />
      ) : loadError ? (
        <EmptyState message={loadError} onAction={fetchAll} actionLabel="Retry" />
      ) : orders.length === 0 ? (
        <EmptyState message="No orders found" onAction={fetchAll} actionLabel="Reload" />
      ) : (
        <>
          {orders.map((order) => <OrderCard key={resolveUuid(order.order_id, order.id) || order.reference_id} order={order} />)}
          <p style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', padding: '6px 0' }}>
            Showing {orders.length} of {orders.length} orders
          </p>
        </>
      )}

    </div>
  )
}

export default NoticeOrdersPage
