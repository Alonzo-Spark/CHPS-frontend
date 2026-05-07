import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { auth } from '../services/api';
import { CheckCircle, XCircle, Loader2, Building2 } from 'lucide-react';
import './Auth.css';

export default function VerifyEmailPage() {
  const [searchParams]    = useSearchParams();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No verification token found. Please check your email link.');
      return;
    }

    auth.verifyEmail(token)
      .then((data) => {
        if (data.success) {
          setStatus('success');
          setMessage('Email verified! Redirecting to login…');
          setTimeout(() => navigate('/login', { replace: true }), 2000);
        } else {
          setStatus('error');
          setMessage('This link is expired or invalid. Please register again.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Network error. Please try again.');
      });
  }, [searchParams, navigate]);

  return (
    <div className="auth-shell">
      <header className="auth-topbar">
        <div className="auth-logo">
          <Building2 size={18} />
          <span>Audit Notification Manager</span>
        </div>
      </header>

      <main className="auth-main">
        <div className="auth-card fade-up" style={{ textAlign: 'center', padding: '48px 32px' }}>
          {status === 'loading' && (
            <>
              <Loader2 size={48} color="#2563eb" className="spin-icon" style={{ marginBottom: 20 }} />
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
                Verifying your email…
              </h2>
              <p style={{ fontSize: 13, color: '#64748b' }}>Please wait a moment.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle size={56} color="#16a34a" style={{ marginBottom: 20 }} />
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#166534', marginBottom: 8 }}>
                Email Verified!
              </h2>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>{message}</p>
              <div style={{
                width: 160, height: 4, borderRadius: 99, background: '#dcfce7',
                margin: '0 auto', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', background: '#16a34a', borderRadius: 99,
                  animation: 'fill-bar 2s linear forwards',
                }} />
              </div>
              <style>{`@keyframes fill-bar { from { width: 0; } to { width: 100%; } }`}</style>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle size={56} color="#dc2626" style={{ marginBottom: 20 }} />
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#991b1b', marginBottom: 8 }}>
                Verification Failed
              </h2>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>{message}</p>
              <Link to="/signup" className="btn btn-primary" style={{ display: 'inline-flex', marginRight: 8 }}>
                Register Again
              </Link>
              <Link to="/login" className="btn btn-outline" style={{ display: 'inline-flex' }}>
                Back to Login
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
