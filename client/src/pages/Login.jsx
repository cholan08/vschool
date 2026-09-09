import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Quick-fill for dev testing
  const devLogins = [
    { label: '👑 Owner', email: 'owner@pediatrictherapy.com' },
    { label: '🛡️ Admin', email: 'admin.main@pediatrictherapy.com' },
    { label: '💊 Therapist', email: 'speech@pediatrictherapy.com' },
    { label: '👩‍🏫 Teacher', email: 'teacher@pediatrictherapy.com' },
    { label: '👨‍👩‍👧 Parent', email: 'parent1@example.com' },
  ];

  return (
    <div className="auth-shell">
      {/* ─── LEFT PANEL (Branding) ────────────────────────────────────────── */}
      <div className="auth-panel-left">
        <div className="auth-brand">
          <div className="auth-brand-icon">🌟</div>
          <div className="auth-brand-name">
            <h1>Absolute</h1>
            <p>Special School &amp; Therapy Care</p>
          </div>
        </div>

        <div className="auth-hero">
          <h2>Streamlined Care,<br/>Better Outcomes.</h2>
          <p>
            A comprehensive management platform designed for modern pediatric therapy centers. 
            Coordinate across departments, track patient progress, and engage parents—all in one place.
          </p>
          
          <div className="auth-features">
            <div className="auth-feature">
              <div className="auth-feature-icon">✓</div>
              Multi-Branch Administration
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">✓</div>
              Cross-Department Scheduling
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">✓</div>
              Parent Progress Tracking
            </div>
          </div>
        </div>
      </div>

      {/* ─── RIGHT PANEL (Form) ───────────────────────────────────────────── */}
      <div className="auth-panel-right">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2>Welcome back</h2>
            <p>Please enter your credentials to sign in.</p>
          </div>

          {error && (
            <div className="mb-3" style={{ background: 'var(--error-bg)', border: '1px solid #fecaca', borderRadius: 'var(--r-md)', padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--error)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                className="input"
                placeholder="name@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <div className="flex justify-between items-center">
                <label className="form-label" htmlFor="password">Password</label>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg mt-auto" disabled={loading}>
              {loading ? <><span className="spinner spinner-sm" style={{ display: 'inline-block', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Signing in...</> : 'Sign in to account'}
            </button>
          </form>

          {/* Dev Quick Login */}
          {import.meta.env.DEV && (
            <div className="mt-auto" style={{ paddingTop: '3rem' }}>
              <div className="auth-divider">
                <div className="auth-divider-line" />
                <div className="auth-divider-text">Development Mode</div>
                <div className="auth-divider-line" />
              </div>
              
              <div className="dev-logins">
                {devLogins.map((d) => (
                  <div
                    key={d.email}
                    className="dev-login-item"
                    onClick={() => setForm({ email: d.email, password: 'password123' })}
                  >
                    <span className="dev-login-role" style={{ background: 'var(--primary)' }}>{d.label.split(' ')[1]}</span>
                    <span className="dev-login-email">{d.email}</span>
                    <span className="dev-login-action">Select</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
