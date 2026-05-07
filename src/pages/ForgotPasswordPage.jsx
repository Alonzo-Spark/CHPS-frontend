import { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../services/api';
import { Building2, Mail, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import './Auth.css';

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('Please enter your email address.'); return; }
    setLoading(true);
    try {
      const data = await auth.forgotPassword(email);
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.message || 'User not found. Please check your email address.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <header className="auth-topbar">
        <div className="auth-logo">
          <Building2 size={18} />
          <span>Audit Notification Manager</span>
        </div>
      </header>

      <main className="auth-main">
        <div className="auth-card fade-up">
          {success ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <CheckCircle size={52} color="#16a34a" style={{ marginBottom: 16 }} />
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#166534', marginBottom: 10 }}>
                Check your inbox
              </h2>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
                Password reset link sent to <strong>{email}</strong>.
                Check your email and follow the link to reset your password.
              </p>
              <Link to="/login" className="btn btn-primary" style={{ display: 'inline-flex' }}>
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: '#eff6ff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Mail size={20} color="#2563eb" />
                </div>
                <h1 className="auth-title" style={{ marginBottom: 0 }}>Forgot Password</h1>
              </div>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
                Enter your email and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <label>Email Address:</label>
                  <input
                    id="forgot-email"
                    className="form-input"
                    type="email"
                    placeholder="puja@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                {error && <p className="auth-error">{error}</p>}

                <button
                  id="forgot-submit"
                  type="submit"
                  className="btn btn-primary auth-submit"
                  disabled={loading}
                >
                  {loading
                    ? <><Loader2 size={14} className="spin-icon" /> Sending…</>
                    : 'Send Reset Link'
                  }
                </button>
              </form>

              <div className="auth-links" style={{ marginTop: 16 }}>
                <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                  <ArrowLeft size={13} /> Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
