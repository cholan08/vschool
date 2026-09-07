import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NAV_ITEMS, ROLES } from '../utils/constants';

// Icon map (inline SVG components for clean look)
const Icons = {
  overview:   '▦',
  branches:   '◫',
  staff:      '◈',
  today:      '◷',
  patients:   '◉',
  schedule:   '◱',
  sessions:   '◈',
  home:       '⌂',
  progress:   '◈',
  logout:     '→',
};

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = NAV_ITEMS[user?.role] || [];
  const roleInfo = ROLES[user?.role];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Page title from current route
  const currentNav = navItems.find(n =>
    n.path === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(n.path)
  );
  const pageTitle = currentNav?.label || 'Dashboard';

  return (
    <div className="dashboard-shell">
      {/* ─── SIDEBAR ─────────────────────────────────────────────────────── */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🌟</div>
          <div className="sidebar-logo-text">
            <h1>Absolute</h1>
            <p>Special School &amp; Therapy Care</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-group-label">Main Menu</div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-item-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User Panel */}
        <div className="sidebar-user">
          {/* Branch / context info */}
          {user?.branch && (
            <div style={{
              padding: '0.5rem 0.75rem',
              marginBottom: '0.5rem',
              background: 'rgba(37,99,235,0.15)',
              borderRadius: 'var(--r-md)',
              border: '1px solid rgba(37,99,235,0.2)',
            }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(147,197,253,0.8)', marginBottom: '0.1rem' }}>
                Branch
              </div>
              <div style={{ fontSize: '0.775rem', fontWeight: 600, color: '#bfdbfe', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.branch.name || user.branch.code}
              </div>
            </div>
          )}
          {/* User card */}
          <div className="sidebar-user-card" style={{ cursor: 'default' }}>
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-role">{roleInfo?.label}</div>
            </div>
          </div>
          
          <button
            className="btn"
            onClick={handleLogout}
            style={{ 
              width: '100%', 
              marginTop: '0.5rem', 
              background: 'rgba(255,255,255,0.05)', 
              color: '#94a3b8', 
              justifyContent: 'flex-start',
              padding: '0.6rem 0.75rem',
              fontSize: '0.825rem'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.15)'; e.currentTarget.style.color = '#f43f5e'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            <span style={{ marginRight: '0.5rem' }}>⎋</span> Sign Out
          </button>
        </div>
      </aside>

      {/* ─── MAIN AREA ───────────────────────────────────────────────────── */}
      <div className="main-area">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <div className="topbar-breadcrumb">
              <span>Absolute - Special School &amp; Therapy Care</span>
              <span style={{ color: 'var(--border-strong)' }}>›</span>
              <strong>{pageTitle}</strong>
            </div>
          </div>
          <div className="topbar-right">
            <div className="topbar-date">
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </div>
            {/* Role badge */}
            <span
              className="badge"
              style={{
                background: `${roleInfo?.color}18`,
                color: roleInfo?.color,
                border: `1px solid ${roleInfo?.color}33`,
                fontWeight: 700,
              }}
            >
              {roleInfo?.icon} {roleInfo?.label}
            </span>
            {/* User pill */}
            <div className="topbar-user">
              <div className="user-avatar-lg"
                style={{ width: 30, height: 30, fontSize: '0.75rem' }}
              >
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="topbar-user-text">
                <div className="topbar-user-name">{user?.name}</div>
                {user?.branch && (
                  <div className="topbar-user-branch">🏢 {user.branch.code}</div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
