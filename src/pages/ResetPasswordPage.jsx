import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { auth } from '../services/api';
import { Building2, Eye, EyeOff, Loader2, KeyRound } from 'lucide-react';
import './Auth.css';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [form, setForm]       = useState({ newPassword: '', confirmPassword: '' });
  const [showNew, setShowNew] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const navigate = useNavigate();

  if (!token) {
    return (
      <div className="auth-shell">
        <main className="auth-main">
          <div className="auth-card fade-up" style={{ textAlign: 'center' }}>
            <p className="auth-error">Invalid reset link. Please request a new one.</p>
            <Link to="/forgot-password" className="btn btn-primary" style={{ display: 'inline-flex', marginTop: 12 }}>
              Request New Link
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match.'); return;
    }
    if (form.newPassword.length < 6) {
      setError('Password must be at least 6 characters.'); return;
    }
    setLoading(true);
    try {
      const data = await auth.resetPassword(token, form.newPassword, form.confirmPassword);
      if (data.success) {
        navigate('/login', {
          replace: true,
          state: { message: 'Password reset successful. Please log in.' },
        });
      } else {
        setError(data.message || 'Invalid or expired reset token. Please request a new link.');
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: '#eff6ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <KeyRound size={20} color="#2563eb" />
            </div>
            <h1 className="auth-title" style={{ marginBottom: 0 }}>Reset Password</h1>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
            Enter your new password below.
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>New Password:</label>
              <div className="input-icon-wrap">
                <input
                  id="reset-new-password"
                  className="form-input"
                  type={showNew ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={form.newPassword}
                  onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
                  required
                />
                <button type="button" className="input-end-btn" onClick={() => setShowNew((p) => !p)}>
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Confirm New Password:</label>
              <div className="input-icon-wrap">
                <input
                  id="reset-confirm-password"
                  className="form-input"
                  type={showConf ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  required
                />
                <button type="button" className="input-end-btn" onClick={() => setShowConf((p) => !p)}>
                  {showConf ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button
              id="reset-submit"
              type="submit"
              className="btn btn-primary auth-submit"
              disabled={loading}
            >
              {loading
                ? <><Loader2 size={14} className="spin-icon" /> Resetting…</>
                : 'Reset Password'
              }
            </button>
          </form>

          <div className="auth-links" style={{ marginTop: 16 }}>
            <Link to="/login" style={{ fontSize: 13 }}>Back to Login</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
