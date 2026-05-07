import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Globe, Accessibility, Eye, EyeOff, Info } from 'lucide-react';
import './Auth.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const result = login(username, password);
    setLoading(false);
    if (result.success) {
      // Admin → Admin Dashboard  |  Staff → Staff Dashboard
      navigate('/dashboard');
    } else {
      setError(result.error);
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

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Username / Email:</label>
              <input
                className="form-input"
                placeholder="Enter username or email"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password:</label>
              <div className="input-icon-wrap">
                <input
                  className="form-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="input-end-btn" onClick={() => setShowPass(p => !p)}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <label className="checkbox-row">
              <input type="checkbox" checked={showPass} onChange={() => setShowPass(p => !p)} />
              <span>show password</span>
            </label>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="auth-links">
            <a href="#">Forgot username/password?</a>
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
            <p className="aib-body">Your User ID is the unique identifier associated with your account for secure access to the Audit Notification Manager.</p>
          </div>
        </div>

        {/* Demo credentials */}
        <p className="demo-hint">
          Demo → admin / admin123 (Admin)&nbsp;&nbsp;|&nbsp;&nbsp;staff / staff123 (Staff)
        </p>
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
