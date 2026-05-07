import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import './Auth.css';

export default function SignupPage() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: '', role: 'staff', panNumber: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [formError, setFormError]   = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [loading, setLoading]       = useState(false);
  const [submitted, setSubmitted]   = useState(false);

  const { signup } = useAuth();
  const navigate   = useNavigate();

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Client-side validation
    if (form.password !== form.confirm) {
      setFormError('Passwords do not match.'); return;
    }
    if (form.password.length < 6) {
      setFormError('Password must be at least 6 characters.'); return;
    }

    setLoading(true);
    try {
      const result = await signup({
        name: form.name,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirm,
        role: form.role,
        ...(form.panNumber ? { panNumber: form.panNumber } : {}),
      });

      if (result.success) {
        setSubmitted(true);
        setFormSuccess('Registration successful. Please check your email to verify your account.');
        // Don't auto-navigate — user must verify email first
      } else {
        setFormError(result.error || 'Registration failed. Please try again.');
      }
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell signup-shell">
      <main className="auth-main">
        <div className="signup-card fade-up">

          {/* ── Dark Header ── */}
          <div className="signup-hdr">
            <div className="signup-shield"><ShieldCheck size={26} /></div>
            <h1>Audit Portal</h1>
            <p className="signup-sub">INTERNAL MANAGEMENT SYSTEM</p>
          </div>

          {/* ── Form Body ── */}
          <div className="signup-body">
            <h2>Create Your Account</h2>
            <p className="signup-desc">Register to manage notification compliance</p>

            {formSuccess ? (
              <div style={{ textAlign: 'center', padding: '24px 16px' }}>
                <CheckCircle size={48} color="#16a34a" style={{ marginBottom: 16 }} />
                <p style={{ fontSize: 15, color: '#166534', fontWeight: 600, marginBottom: 8 }}>
                  {formSuccess}
                </p>
                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
                  Once verified, you can log in to your account.
                </p>
                <Link to="/login" className="btn btn-primary" style={{ display: 'inline-flex' }}>
                  Go to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={submit} className="auth-form">

                {/* Full Name */}
                <div className="form-group">
                  <label>FULL NAME</label>
                  <input
                    id="signup-name"
                    className="form-input"
                    placeholder="e.g. Puja Midde"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    required
                  />
                </div>

                {/* Email */}
                <div className="form-group">
                  <label>EMAIL ADDRESS</label>
                  <input
                    id="signup-email"
                    className="form-input"
                    type="email"
                    placeholder="puja@gmail.com"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    required
                  />
                </div>

                {/* Role */}
                <div className="form-group">
                  <label>ROLE</label>
                  <select
                    id="signup-role"
                    className="form-input"
                    value={form.role}
                    onChange={(e) => set('role', e.target.value)}
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {/* PAN Number (optional) */}
                <div className="form-group">
                  <label>PAN NUMBER <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></label>
                  <input
                    id="signup-pan"
                    className="form-input"
                    placeholder="e.g. AHMPV4480E"
                    value={form.panNumber}
                    onChange={(e) => set('panNumber', e.target.value.toUpperCase())}
                    maxLength={10}
                  />
                </div>

                {/* Passwords */}
                <div className="two-col">
                  <div className="form-group">
                    <label>SET PASSWORD</label>
                    <div className="input-icon-wrap">
                      <input
                        id="signup-password"
                        className="form-input"
                        type={showPass ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={form.password}
                        onChange={(e) => set('password', e.target.value)}
                        required
                      />
                      <button type="button" className="input-end-btn" onClick={() => setShowPass((p) => !p)}>
                        {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>CONFIRM PASSWORD</label>
                    <div className="input-icon-wrap">
                      <input
                        id="signup-confirm"
                        className="form-input"
                        type={showConf ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={form.confirm}
                        onChange={(e) => set('confirm', e.target.value)}
                        required
                      />
                      <button type="button" className="input-end-btn" onClick={() => setShowConf((p) => !p)}>
                        {showConf ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Error */}
                {formError && (
                  <div style={{
                    display: 'flex', gap: 8, alignItems: 'center',
                    background: '#fef2f2', border: '1px solid #fecaca',
                    borderRadius: 8, padding: '8px 12px', marginBottom: 4, fontSize: 13, color: '#dc2626',
                  }}>
                    <AlertCircle size={14} /> {formError}
                  </div>
                )}

                {/* Submit */}
                <button
                  id="signup-submit"
                  type="submit"
                  className="reg-submit-btn reg-submit-active"
                  disabled={loading || submitted}
                >
                  {loading
                    ? <><Loader2 size={14} className="spin-icon" /> Creating account…</>
                    : 'Complete Registration →'
                  }
                </button>
              </form>
            )}

            <p className="signup-terms">
              By Signing Up, you agree to our{' '}
              <a href="#">Terms of Services</a> and <a href="#">Privacy Policy</a>
            </p>
            <p className="auth-switch">
              Already have an account?&nbsp;
              <Link to="/login" className="link-blue">Log In</Link>
            </p>
          </div>
        </div>

        {/* Secure node badge */}
        <div className="sn-badge">
          <div className="sn-thumb">
            <div className="sn-lines"><span /><span /><span /></div>
          </div>
          <div>
            <strong>SECURE ACCESS NODE</strong>
            <p>v4.2.1 Stable Production</p>
          </div>
        </div>
      </main>
    </div>
  );
}
