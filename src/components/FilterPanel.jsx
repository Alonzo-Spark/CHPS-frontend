import { useState } from 'react'
import { Search, Filter, Calendar, X } from 'lucide-react'

export default function FilterPanel({ isOpen, onClose, onApply, onReset }) {
  const [filters, setFilters] = useState({
    proceedingStatus: '',
    displayOnly: false,
    applicableAct: '',
    procCreatedFrom: '',
    procCreatedTo: '',
    procClosureFrom: '',
    procClosureTo: '',
    procLimitationFrom: '',
    procLimitationTo: '',
    noticeIssuedFrom: '',
    noticeIssuedTo: ''
  })

  const handleChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const handleApply = () => {
    onApply(filters)
    onClose()
  }

  const handleReset = () => {
    setFilters({
      proceedingStatus: '',
      displayOnly: false,
      applicableAct: '',
      procCreatedFrom: '',
      procCreatedTo: '',
      procClosureFrom: '',
      procClosureTo: '',
      procLimitationFrom: '',
      procLimitationTo: '',
      noticeIssuedFrom: '',
      noticeIssuedTo: ''
    })
    onReset()
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 12,
        width: '90%',
        maxWidth: 800,
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1e293b' }}>Filters</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Proceeding Status */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 12 }}>Proceeding Status</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {[
                'Open/Pending',
                'Closed',
                'Submitted',
                'e-Submission re-enabled by AO',
                'e-Submission closed by officer'
              ].map(status => (
                <label key={status} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="proceedingStatus"
                    value={status}
                    checked={filters.proceedingStatus === status}
                    onChange={e => handleChange('proceedingStatus', e.target.value)}
                    style={{ width: 16, height: 16 }}
                  />
                  <span style={{ fontSize: 13, color: '#374151' }}>{status}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Display Only */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 12 }}>Display Only</h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filters.displayOnly}
                onChange={e => handleChange('displayOnly', e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              <span style={{ fontSize: 13, color: '#374151' }}>New e-Proceedings</span>
            </label>
          </div>

          {/* Applicable Act */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 12 }}>Applicable Act :</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Income Tax Act 1961',
                'Income Tax Act 2025'
              ].map(act => (
                <label key={act} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="applicableAct"
                    value={act}
                    checked={filters.applicableAct === act}
                    onChange={e => handleChange('applicableAct', e.target.value)}
                    style={{ width: 16, height: 16 }}
                  />
                  <span style={{ fontSize: 13, color: '#374151' }}>{act}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date Filters */}
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 16 }}>Date Filters</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
              {/* Proc Created Date */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 8 }}>Proc Created Date</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="date"
                      placeholder="Choose Date"
                      value={filters.procCreatedFrom}
                      onChange={e => handleChange('procCreatedFrom', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        fontSize: 13,
                        outline: 'none'
                      }}
                    />
                    <Calendar size={16} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="date"
                      placeholder="Choose Date"
                      value={filters.procCreatedTo}
                      onChange={e => handleChange('procCreatedTo', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        fontSize: 13,
                        outline: 'none'
                      }}
                    />
                    <Calendar size={16} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  </div>
                </div>
              </div>

              {/* Proc closure Date */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 8 }}>Proc closure Date</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="date"
                      placeholder="Choose Date"
                      value={filters.procClosureFrom}
                      onChange={e => handleChange('procClosureFrom', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        fontSize: 13,
                        outline: 'none'
                      }}
                    />
                    <Calendar size={16} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="date"
                      placeholder="Choose Date"
                      value={filters.procClosureTo}
                      onChange={e => handleChange('procClosureTo', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        fontSize: 13,
                        outline: 'none'
                      }}
                    />
                    <Calendar size={16} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  </div>
                </div>
              </div>

              {/* Proc Limitation Date */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 8 }}>Proc Limitation Date</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="date"
                      placeholder="Choose Date"
                      value={filters.procLimitationFrom}
                      onChange={e => handleChange('procLimitationFrom', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        fontSize: 13,
                        outline: 'none'
                      }}
                    />
                    <Calendar size={16} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="date"
                      placeholder="Choose Date"
                      value={filters.procLimitationTo}
                      onChange={e => handleChange('procLimitationTo', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        fontSize: 13,
                        outline: 'none'
                      }}
                    />
                    <Calendar size={16} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  </div>
                </div>
              </div>

              {/* Notice Issued Date */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 8 }}>Notice Issued Date</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="date"
                      placeholder="Choose Date"
                      value={filters.noticeIssuedFrom}
                      onChange={e => handleChange('noticeIssuedFrom', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        fontSize: 13,
                        outline: 'none'
                      }}
                    />
                    <Calendar size={16} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="date"
                      placeholder="Choose Date"
                      value={filters.noticeIssuedTo}
                      onChange={e => handleChange('noticeIssuedTo', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        fontSize: 13,
                        outline: 'none'
                      }}
                    />
                    <Calendar size={16} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 24px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12
        }}>
          <button
            onClick={handleReset}
            style={{
              padding: '8px 16px',
              border: '1px solid #d1d5db',
              background: '#fff',
              color: '#374151',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Reset
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              border: '1px solid #d1d5db',
              background: '#fff',
              color: '#374151',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            style={{
              padding: '8px 16px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}