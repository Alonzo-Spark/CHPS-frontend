import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Globe, Accessibility, Eye, EyeOff, Info, Loader2 } from 'lucide-react';
import './Auth.css';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const successMsg = location.state?.message || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Email and password are required.'); return; }
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        navigate(result.role === 'admin' ? '/admin/dashboard' : '/staff/dashboard', { replace: true });
      } else {
        setError(result.error || 'Invalid email or password.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      {/* ── Top Bar ── */}
      <header className="auth-topbar">
        <div className="auth-logo">
          <Building2 size={18} />
          <span>Audit Notification Manager</span>
        </div>
        <div className="auth-tb-right">
          <button className="auth-tb-btn"><Globe size={15} />&nbsp;English</button>
          <button className="auth-tb-btn"><Accessibility size={15} /></button>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="auth-main">
        <div className="auth-card fade-up">
          <h1 className="auth-title">Login</h1>

          {successMsg && (
            <div style={{
              background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:8,
              padding:'10px 14px',fontSize:13,color:'#166534',
              display:'flex',alignItems:'center',gap:6,marginBottom:8,
            }}>
              ✓ {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email:</label>
              <input
                id="login-email"
                className="form-input"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label>Password:</label>
              <div className="input-icon-wrap">
                <input
                  id="login-password"
                  className="form-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button type="button" className="input-end-btn" onClick={() => setShowPass((p) => !p)}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary auth-submit"
              disabled={loading}
            >
              {loading ? <><Loader2 size={14} className="spin-icon" /> Signing in…</> : 'Sign In'}
            </button>
          </form>

          <div className="auth-links">
            <Link to="/forgot-password">Forgot password?</Link>
            <p>Don't have an account?&nbsp;
              <Link to="/signup" className="link-blue">Sign up</Link>
            </p>
          </div>
        </div>

        {/* Info box */}
        <div className="auth-info-box fade-up">
          <Info size={16} className="aib-icon" />
          <div>
            <strong className="aib-title">Know about your User ID</strong>
            <p className="aib-body">Your User ID is your registered email address for secure access to the Audit Notification Manager.</p>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="auth-footer">
        <div>
          <div>© 2024 Audit Notification Manager. All rights reserved.</div>
          <div className="auth-footer-sub">Secure Institutional Portal | Version 4.2.1-stable</div>
        </div>
        <nav>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Accessibility</a>
          <a href="#">Support</a>
        </nav>
      </footer>
    </div>
  );
}
