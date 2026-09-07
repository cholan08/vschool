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

  useEffect(() => {
    const load = async () => {
      try {
        const [todayRes, patientRes, statsRes] = await Promise.all([
          appointmentsApi.getToday(),
          patientsApi.getAll({ status: 'active' }),
          patientsApi.getStats(),
        ]);
        setTodayAppts(todayRes.data);
        setPatients(patientRes.data.slice(0, 5));
        setStats(statsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statusColors = { scheduled: 'var(--primary)', completed: 'var(--success)', cancelled: 'var(--error)', no_show: 'var(--warning)' };

  if (loading) return (
    <DashboardLayout>
      <div className="loading-screen">
        <div className="spinner spinner-lg"></div>
        <p>Loading reception dashboard...</p>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Reception & Operations</h1>
          <p className="page-subtitle">Manage daily schedules and patient flow for {user?.branch?.name}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/dashboard/patients" className="btn btn-secondary">Patient Registry</Link>
          <Link to="/dashboard/schedule" className="btn btn-primary">+ Schedule Session</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { icon: '📅', label: "Today's Sessions", value: todayAppts.length, color: 'var(--primary)' },
          { icon: '✅', label: 'Completed Today', value: todayAppts.filter(a => a.status === 'completed').length, color: 'var(--success)' },
          { icon: '👶', label: 'Active Patients', value: stats.active, color: 'var(--violet)' },
          { icon: '📊', label: 'Total Enrolled', value: stats.total, color: 'var(--warning)' },
        ].map((s) => (
          <div key={s.label} className="stat-card" style={{ '--stat-color': s.color }}>
            <div className="stat-card-top">
              <div className="stat-icon" style={{ background: `${s.color}22`, color: s.color }}>{s.icon}</div>
            </div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '3fr 2fr' }}>
        {/* Today's appointment list */}
        <div className="card">
          <div className="card-header">
            <h2 className="section-title">Today's Schedule</h2>
            <Link to="/dashboard/schedule" className="btn btn-ghost btn-sm">Full Schedule →</Link>
          </div>
          {todayAppts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <div className="empty-title">Clear Schedule</div>
              <div className="empty-desc">No sessions are scheduled for today.</div>
            </div>
          ) : (
            <div className="flex" style={{ flexDirection: 'column', gap: '0.75rem' }}>
              {todayAppts.map((a) => (
                <div key={a._id} className="list-item">
                  <div className="list-item-accent" style={{ background: getDeptColor(a.department) }} />
                  <div className="list-item-body">
                    <div className="list-item-title">{a.patient?.name}</div>
                    <div className="list-item-sub">
                      <strong>{a.timeSlot}</strong> • {getDeptLabel(a.department)} • Dr. {a.therapist?.name}
                    </div>
                  </div>
                  <span className="badge" style={{ 
                    background: `${statusColors[a.status]}15`, 
                    color: statusColors[a.status],
                    borderColor: `${statusColors[a.status]}40`
                  }}>
                    {APPOINTMENT_STATUSES[a.status]?.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent patients */}
        <div className="card">
          <div className="card-header">
            <h2 className="section-title">Recent Registrations</h2>
            <Link to="/dashboard/patients" className="btn btn-ghost btn-sm">View All →</Link>
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
                  <div className="user-avatar-lg" style={{ background: 'var(--surface-3)', color: 'var(--primary)', border: '1px solid var(--border)' }}>
                    {p.name[0]}
                  </div>
                  <div className="list-item-body">
                    <div className="list-item-title">{p.name}</div>
                    <div className="flex" style={{ flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.35rem' }}>
                      {p.enrolledDepartments?.slice(0, 2).map((d) => (
                        <span key={d} className="dept-chip" style={{ background: `${getDeptColor(d)}15`, color: getDeptColor(d) }}>
                          {getDeptLabel(d).split(' ')[0]}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="badge" style={{ 
                    background: `${PATIENT_STATUSES[p.status]?.color}15`, 
                    color: PATIENT_STATUSES[p.status]?.color 
                  }}>
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
