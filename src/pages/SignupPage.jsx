import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Eye, EyeOff, AlertCircle, Send } from 'lucide-react';
import './Auth.css';

export default function SignupPage() {
  const [form, setForm]         = useState({ username: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError]     = useState('');
  const [formError, setFormError]         = useState('');
  const [loading, setLoading]   = useState(false);

  const { signup } = useAuth();
  const navigate   = useNavigate();

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Simulate sending verification email
  const handleVerifyEmail = async () => {
    if (!form.email) { setVerifyError('Please enter your email address first.'); return; }
    setVerifyError('');
    setVerifyLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    // Simulate network error for demo (matching screenshot)
    // In real app: call your backend API here
    const success = form.email.includes('@') && !form.email.includes('error');
    setVerifyLoading(false);
    if (success) {
      setEmailVerified(true);
    } else {
      setVerifyError('Network error while sending verification email.');
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!emailVerified) { setFormError('Please verify your email address first.'); return; }
    if (form.password !== form.confirm) { setFormError('Passwords do not match.'); return; }
    if (form.password.length < 6)       { setFormError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    signup(form.username, form.email, form.password);
    setLoading(false);
    navigate('/dashboard');
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

            <form onSubmit={submit} className="auth-form">

              {/* Username */}
              <div className="form-group">
                <label>USERNAME</label>
                <input
                  className="form-input"
                  placeholder="jaganyyyy"
                  value={form.username}
                  onChange={e => set('username', e.target.value)}
                  required
                />
              </div>

              {/* Email */}
              <div className="form-group">
                <label>EMAIL ADDRESS</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="160623740016@stanley.edu.in"
                  value={form.email}
                  onChange={e => { set('email', e.target.value); setEmailVerified(false); setVerifyError(''); }}
                  required
                />
              </div>

              {/* ── Email Verification Box ── */}
              <div className="form-group">
                <label>Email verification</label>
                <div className={`ev-box ${emailVerified ? 'ev-verified' : 'ev-unverified'}`}>
                  <div className="ev-left">
                    {emailVerified ? (
                      <div className="ev-ok-icon">✓</div>
                    ) : (
                      <AlertCircle size={22} className="ev-alert-icon" />
                    )}
                    <span className={`ev-status-text ${emailVerified ? 'ev-text-ok' : 'ev-text-bad'}`}>
                      {emailVerified ? 'Email Verified' : 'Email Not Verified'}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="ev-verify-btn"
                    onClick={handleVerifyEmail}
                    disabled={verifyLoading || emailVerified}
                  >
                    <Send size={14} />
                    {verifyLoading ? 'Sending…' : emailVerified ? 'Verified ✓' : 'Verify Email Address'}
                  </button>
                </div>

                {/* Network / verify error */}
                {verifyError && (
                  <div className="ev-error-bar">{verifyError}</div>
                )}
              </div>

              {/* Passwords */}
              <div className="two-col">
                <div className="form-group">
                  <label>SET PASSWORD</label>
                  <div className="input-icon-wrap">
                    <input
                      className="form-input"
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => set('password', e.target.value)}
                      required
                    />
                    <button type="button" className="input-end-btn" onClick={() => setShowPass(p => !p)}>
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>CONFIRM PASSWORD</label>
                  <div className="input-icon-wrap">
                    <input
                      className="form-input"
                      type={showConf ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={form.confirm}
                      onChange={e => set('confirm', e.target.value)}
                      required
                    />
                    <button type="button" className="input-end-btn" onClick={() => setShowConf(p => !p)}>
                      {showConf ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Form-level error */}
              {formError && <p className="auth-error">{formError}</p>}

              {/* Submit */}
              <button
                type="submit"
                className={`reg-submit-btn ${!emailVerified ? 'reg-submit-disabled' : 'reg-submit-active'}`}
                disabled={loading}
              >
                {loading ? 'Creating account…' : 'Complete Registration →'}
              </button>
            </form>

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
