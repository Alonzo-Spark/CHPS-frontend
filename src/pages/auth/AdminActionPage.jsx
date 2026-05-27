import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { ShieldCheck, CheckCircle2, XCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { authService } from '../../services'

export default function AdminActionPage({ action }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const { token: pathToken } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const token = pathToken || searchParams.get('token') || ''

  useEffect(() => {
    if (!token) {
      setError('Administrative action token is missing.')
      setLoading(false)
      return
    }

    const processAction = async () => {
      try {
        setLoading(true)
        setError('')
        setMessage('')
        
        let res;
        if (action === 'approve') {
          res = await authService.approveRegistration(token)
        } else {
          res = await authService.rejectRegistration(token)
        }

        setMessage(res.data?.message || `Successfully processed registration ${action} request.`)
      } catch (err) {
        setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to process administrative action. The link might be expired or already utilized.')
      } finally {
        setLoading(false)
      }
    }

    processAction()
  }, [token, action])

  const cardStyle = {
    background: '#fff',
    borderRadius: 16,
    padding: '40px 36px',
    width: '100%',
    maxWidth: 480,
    boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
    border: '1px solid #e2e8f0',
    textAlign: 'center',
    transition: 'all 0.3s ease'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{
          width: 52,
          height: 52,
          background: '#1e3a8a',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 12px'
        }}>
          <ShieldCheck size={28} color="#fff" />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b' }}>Audit Portal Administrator</h1>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>System Registration Controller</p>
      </div>

      {/* Main Status Card */}
      <div style={cardStyle}>
        {loading ? (
          <div>
            <div style={{
              width: 48,
              height: 48,
              border: '3px solid #e2e8f0',
              borderTopColor: '#2563eb',
              borderRadius: '50%',
              margin: '0 auto 20px',
              animation: 'spin 1s linear infinite'
            }} />
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>
              Processing Action
            </h2>
            <p style={{ fontSize: 13, color: '#64748b' }}>
              Validating token and updating registration credentials...
            </p>
            
            {/* Embedded styles for animation spinner */}
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : error ? (
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, background: '#fef2f2', borderRadius: '50%', marginBottom: 20 }}>
              <XCircle size={36} color="#dc2626" />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>
              Action Failed
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>
              {error}
            </p>
            <button
              onClick={() => navigate('/login')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#f1f5f9',
                color: '#475569',
                border: 'none',
                borderRadius: 8,
                padding: '10px 20px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={16} /> Return to Login
            </button>
          </div>
        ) : (
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              background: action === 'approve' ? '#f0fdf4' : '#fff7ed',
              borderRadius: '50%',
              marginBottom: 20
            }}>
              {action === 'approve' ? (
                <CheckCircle2 size={36} color="#16a34a" />
              ) : (
                <AlertCircle size={36} color="#d97706" />
              )}
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
              {action === 'approve' ? 'Registration Approved' : 'Registration Rejected'}
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>
              {message}
            </p>
            <button
              onClick={() => navigate('/login')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '12px 24px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Go to Login Panel
            </button>
          </div>
        )}
      </div>

      <div style={{ marginTop: 24, fontSize: 11, color: '#94a3b8' }}>
        Secure Audit Authority Console • Action Logged
      </div>
    </div>
  )
}
