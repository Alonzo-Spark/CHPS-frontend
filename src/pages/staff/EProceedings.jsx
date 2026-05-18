import { useState } from 'react'
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'

export default function EProceedings() {
  const [proceedings, setProceedings] = useState([])
  const [activeTab, setActiveTab] = useState('recent') // 'recent' or 'previous'

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Dashboard', path: '/staff/dashboard' }, { label: 'E-Proceedings' }]}>
      <div style={{ padding: '16px 20px' }}>
        <div style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: 19, fontWeight: 500, color: '#1e293b' }}>E-Proceedings</h2>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Manage all e-proceedings records</p>
        </div>

        {/* Search + Filter */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '0.5px solid #cbd5e1', borderRadius: 8, padding: '7px 12px', background: '#fff' }}>
            <Search size={13} color="#94a3b8" />
            <input placeholder="Search proceedings..." style={{ border: 'none', outline: 'none', fontSize: 12, color: '#1e293b', background: 'transparent', width: 220 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: '#fff', color: '#64748b', border: '0.5px solid #e2e8f0', borderRadius: 8, fontSize: 12, cursor: 'pointer', outline: 'none' }}
            >
              <option value="recent">Recent</option>
              <option value="previous">Previous</option>
            </select>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: '#fff', color: '#64748b', border: '0.5px solid #e2e8f0', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
              <Filter size={13} /> Filter
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '0.5px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 500, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em' }}>User</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 500, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em' }}>Proceeding Name</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 500, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em' }}>Reference ID</th>
              </tr>
            </thead>
            <tbody>
              {proceedings.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '48px 16px', color: '#94a3b8', fontSize: 13 }}>
                    No proceedings found.
                  </td>
                </tr>
              ) : (
                proceedings.map((p, idx) => (
                  <tr key={idx} style={{ borderBottom: '0.5px solid #e2e8f0' }}>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#1e293b' }}>{p.user}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#1e293b' }}>{p.proceedingName}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#1e293b', fontFamily: 'monospace' }}>{p.referenceId}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {/* Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '0.5px solid #e2e8f0', background: '#f8fafc' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>Showing 0 to 0 of 0 entries</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button disabled style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: '0.5px solid #cbd5e1', background: '#fff', color: '#94a3b8', cursor: 'not-allowed' }}>
                <ChevronLeft size={14} />
              </button>
              <button disabled style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: '0.5px solid #cbd5e1', background: '#fff', color: '#94a3b8', cursor: 'not-allowed' }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
