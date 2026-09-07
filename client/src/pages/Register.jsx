import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      {/* ─── LEFT PANEL (Branding) ────────────────────────────────────────── */}
      <div className="auth-panel-left">
        <div className="auth-brand">
          <div className="auth-brand-icon">🌟</div>
          <div className="auth-brand-name">
            <h1>Absolute Special School</h1>
            <p>&amp; Therapy Care</p>
          </div>
        </div>

        <div className="auth-hero">
          <h2>Streamlined Care,<br/>Better Outcomes.</h2>
          <p>
            A comprehensive management platform designed for modern pediatric therapy centers. 
            Coordinate across departments, track patient progress, and engage parents—all in one place.
          </p>
        </div>
      </div>

      {/* ─── RIGHT PANEL (Form) ───────────────────────────────────────────── */}
      <div className="auth-panel-right">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2>Create Account</h2>
            <p>Join the Absolute Therapy platform today.</p>
          </div>

          {error && (
            <div className="mb-3" style={{ background: 'var(--error-bg)', border: '1px solid #fecaca', borderRadius: 'var(--r-md)', padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--error)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                className="input"
                placeholder="John Doe"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

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
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                className="input"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={handleChange}
                minLength={6}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg mt-auto" disabled={loading}>
              {loading ? <><span className="spinner spinner-sm" style={{ display: 'inline-block', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Creating account...</> : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
