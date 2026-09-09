import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { patientsApi } from '../../api/patients';
import { appointmentsApi } from '../../api/appointments';
import { getDeptLabel, getDeptColor, APPOINTMENT_STATUSES, PATIENT_STATUSES } from '../../utils/constants';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [todayAppts, setTodayAppts] = useState([]);
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, discharged: 0 });
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState('');

  const loadDashboardData = async () => {
    try {
      const [todayRes, patientRes, statsRes] = await Promise.all([
        appointmentsApi.getToday(),
        patientsApi.getAll({ status: 'active' }),
        patientsApi.getStats(),
      ]);
      setTodayAppts(todayRes.data);
      setPatients(patientRes.data.slice(0, 6));
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to load reception dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleUpdateStatus = async (apptId, newStatus) => {
    try {
      await appointmentsApi.update(apptId, { status: newStatus });
      setActionSuccess(`Session marked as ${APPOINTMENT_STATUSES[newStatus]?.label || newStatus}`);
      setTimeout(() => setActionSuccess(''), 3000);
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to update session status', err);
    }
  };

  const statusColors = {
    scheduled: 'var(--primary)',
    completed: 'var(--success)',
    cancelled: 'var(--error)',
    no_show: 'var(--warning)',
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="loading-screen">
          <div className="spinner spinner-lg"></div>
          <p>Loading operations dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  const completedCount = todayAppts.filter((a) => a.status === 'completed').length;
  const pendingCount = todayAppts.filter((a) => a.status === 'scheduled').length;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Operations &amp; Today's Control Center</h1>
          <p className="page-subtitle">
            Live schedule monitoring, patient flow, and administrative commands for {user?.branch?.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/dashboard/patients" className="btn btn-secondary">
            👶 Patients Details
          </Link>
          <Link to="/dashboard/schedule" className="btn btn-primary">
            + Schedule Session
          </Link>
        </div>
      </div>

      {actionSuccess && (
        <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
          <span>✅</span>
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card" style={{ '--stat-color': 'var(--primary)' }}>
          <div className="stat-card-top">
            <div className="stat-icon" style={{ background: 'rgba(37,99,235,0.15)', color: 'var(--primary)' }}>
              📅
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>Today</span>
          </div>
          <div>
            <div className="stat-value">{todayAppts.length}</div>
            <div className="stat-label">Total Sessions Today</div>
          </div>
        </div>

        <div className="stat-card" style={{ '--stat-color': 'var(--emerald)' }}>
          <div className="stat-card-top">
            <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--emerald)' }}>
              ✅
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--emerald)', fontWeight: 700 }}>
              {todayAppts.length > 0 ? Math.round((completedCount / todayAppts.length) * 100) : 0}% Complete
            </span>
          </div>
          <div>
            <div className="stat-value">{completedCount}</div>
            <div className="stat-label">Completed Sessions</div>
          </div>
        </div>

        <div className="stat-card" style={{ '--stat-color': 'var(--amber)' }}>
          <div className="stat-card-top">
            <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--amber)' }}>
              ⏳
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--amber)', fontWeight: 700 }}>In Queue</span>
          </div>
          <div>
            <div className="stat-value">{pendingCount}</div>
            <div className="stat-label">Remaining Scheduled</div>
          </div>
        </div>

        <div className="stat-card" style={{ '--stat-color': 'var(--violet)' }}>
          <div className="stat-card-top">
            <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--violet)' }}>
              👶
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Enrolled</span>
          </div>
          <div>
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">Active Enrolled Patients</div>
          </div>
        </div>
      </div>

      {/* Quick Access Operational Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <Link
          to="/dashboard/patients"
          className="card"
          style={{
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            textDecoration: 'none',
            borderLeft: '4px solid var(--primary)',
            transition: 'transform 0.2s',
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>👶</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Patients Details</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registry &amp; profiles</div>
          </div>
        </Link>

        <Link
          to="/dashboard/schedule"
          className="card"
          style={{
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            textDecoration: 'none',
            borderLeft: '4px solid var(--accent)',
            transition: 'transform 0.2s',
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>🗓️</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Scheduling &amp; Monitoring</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Room &amp; slot tracking</div>
          </div>
        </Link>

        <Link
          to="/dashboard/staff"
          className="card"
          style={{
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            textDecoration: 'none',
            borderLeft: '4px solid var(--emerald)',
            transition: 'transform 0.2s',
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>👥</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Staffs</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Specialists &amp; therapists</div>
          </div>
        </Link>

        <Link
          to="/dashboard/reports"
          className="card"
          style={{
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            textDecoration: 'none',
            borderLeft: '4px solid var(--violet)',
            transition: 'transform 0.2s',
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>📊</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Reports</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dashboards &amp; analytics</div>
          </div>
        </Link>

        <Link
          to="/dashboard/billing"
          className="card"
          style={{
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            textDecoration: 'none',
            borderLeft: '4px solid var(--amber)',
            transition: 'transform 0.2s',
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>💳</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Fee Payments &amp; Salary</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Invoicing &amp; payouts</div>
          </div>
        </Link>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '3fr 2fr' }}>
        {/* Today's Schedule with Live Admin Controls */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="section-title">Today's Live Sessions</h2>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', margin: 0 }}>
                Instant status updates and attendance management
              </p>
            </div>
            <Link to="/dashboard/schedule" className="btn btn-ghost btn-sm">
              Full Schedule →
            </Link>
          </div>

          {todayAppts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <div className="empty-title">Clear Schedule Today</div>
              <div className="empty-desc">No therapy sessions are scheduled for today yet.</div>
            </div>
          ) : (
            <div className="flex" style={{ flexDirection: 'column', gap: '0.85rem' }}>
              {todayAppts.map((a) => (
                <div
                  key={a._id}
                  className="list-item"
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    padding: '0.85rem 1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
                    <div
                      className="list-item-accent"
                      style={{
                        background: getDeptColor(a.department),
                        width: '4px',
                        height: '36px',
                        borderRadius: '2px',
                      }}
                    />
                    <div className="list-item-body">
                      <div className="list-item-title" style={{ fontWeight: 700 }}>
                        {a.patient?.name}
                      </div>
                      <div className="list-item-sub" style={{ fontSize: '0.775rem' }}>
                        <strong>{a.timeSlot}</strong> • {getDeptLabel(a.department)} • Specialist:{' '}
                        <strong>{a.therapist?.name}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      className="badge"
                      style={{
                        background: `${statusColors[a.status]}15`,
                        color: statusColors[a.status],
                        borderColor: `${statusColors[a.status]}40`,
                        fontWeight: 700,
                      }}
                    >
                      {APPOINTMENT_STATUSES[a.status]?.label}
                    </span>

                    {/* Quick Admin Action Controls */}
                    {a.status === 'scheduled' && (
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button
                          className="btn btn-sm"
                          style={{
                            background: 'var(--success-bg)',
                            color: 'var(--success)',
                            border: '1px solid var(--success)',
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.725rem',
                          }}
                          title="Mark Session Completed"
                          onClick={() => handleUpdateStatus(a._id, 'completed')}
                        >
                          ✓ Done
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{
                            background: 'var(--warning-bg)',
                            color: 'var(--warning)',
                            border: '1px solid var(--warning)',
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.725rem',
                          }}
                          title="Mark No Show"
                          onClick={() => handleUpdateStatus(a._id, 'no_show')}
                        >
                          No Show
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Registered Patients */}
        <div className="card">
          <div className="card-header">
            <h2 className="section-title">Enrolled Patients</h2>
            <Link to="/dashboard/patients" className="btn btn-ghost btn-sm">
              All Patients ({stats.total}) →
            </Link>
          </div>
          {patients.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👶</div>
              <div className="empty-title">No Patients Found</div>
            </div>
          ) : (
            <div className="flex" style={{ flexDirection: 'column', gap: '0.75rem' }}>
              {patients.map((p) => (
                <div key={p._id} className="list-item" style={{ padding: '0.75rem' }}>
                  <div
                    className="user-avatar-lg"
                    style={{
                      background: 'var(--surface-3)',
                      color: 'var(--primary)',
                      border: '1px solid var(--border)',
                      width: '36px',
                      height: '36px',
                      fontSize: '0.85rem',
                    }}
                  >
                    {p.name[0]}
                  </div>
                  <div className="list-item-body">
                    <div className="list-item-title" style={{ fontWeight: 600 }}>{p.name}</div>
                    <div className="flex" style={{ flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                      {p.enrolledDepartments?.slice(0, 2).map((d) => (
                        <span
                          key={d}
                          className="dept-chip"
                          style={{ background: `${getDeptColor(d)}15`, color: getDeptColor(d), fontSize: '0.7rem' }}
                        >
                          {getDeptLabel(d).split(' ')[0]}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span
                    className="badge"
                    style={{
                      background: `${PATIENT_STATUSES[p.status]?.color}15`,
                      color: PATIENT_STATUSES[p.status]?.color,
                      fontSize: '0.725rem',
                    }}
                  >
                    {PATIENT_STATUSES[p.status]?.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
