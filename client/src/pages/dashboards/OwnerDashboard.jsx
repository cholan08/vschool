import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { branchApi } from '../../api/branches';
import { patientsApi } from '../../api/patients';
import { appointmentsApi } from '../../api/appointments';
import { usersApi } from '../../api/users';
import { getDeptLabel, getDeptColor, APPOINTMENT_STATUSES } from '../../utils/constants';
import { Link } from 'react-router-dom';

const OwnerDashboard = () => {
  const [branches, setBranches] = useState([]);
  const [stats, setStats] = useState({ patients: 0, active: 0, therapists: 0, todayAppts: 0 });
  const [deptStats, setDeptStats] = useState([]);
  const [todayAppts, setTodayAppts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [branchRes, patientStatsRes, therapistsRes, todayRes] = await Promise.all([
          branchApi.getAll(),
          patientsApi.getStats(),
          usersApi.getAll({ role: 'therapist' }),
          appointmentsApi.getToday(),
        ]);
        setBranches(branchRes.data);
        setStats({
          patients: patientStatsRes.data.total,
          active: patientStatsRes.data.active,
          therapists: therapistsRes.data.length,
          todayAppts: todayRes.data.length,
        });
        setDeptStats(patientStatsRes.data.byDepartment || []);
        setTodayAppts(todayRes.data.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <DashboardLayout>
      <div className="loading-screen">
        <div className="spinner spinner-lg"></div>
        <p>Loading overview data...</p>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Clinic Overview</h1>
          <p className="page-subtitle">Monitor all branches and high-level metrics across your therapy network.</p>
        </div>
        <Link to="/dashboard/branches" className="btn btn-primary">
          + New Branch
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { icon: '🏢', label: 'Total Branches', value: branches.length, color: 'var(--primary)' },
          { icon: '👶', label: 'Active Patients', value: stats.active, color: 'var(--success)' },
          { icon: '💊', label: 'Therapists', value: stats.therapists, color: 'var(--violet)' },
          { icon: '📅', label: "Today's Sessions", value: stats.todayAppts, color: 'var(--warning)' },
        ].map((s) => (
          <div key={s.label} className="stat-card" style={{ '--stat-color': s.color }}>
            <div className="stat-card-top">
              <div className="stat-icon" style={{ background: `${s.color}22`, color: s.color }}>{s.icon}</div>
              <span className="stat-trend" style={{ background: `${s.color}15`, color: s.color }}>View →</span>
            </div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Branches table */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <h2 className="section-title">Branch Performance</h2>
            <Link to="/dashboard/branches" className="btn btn-secondary btn-sm">Manage Branches</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Branch Name</th>
                  <th>Location</th>
                  <th>Code</th>
                  <th>Capacity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {branches.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">
                        <div className="empty-icon">🏥</div>
                        <div className="empty-title">No branches registered</div>
                        <div className="empty-desc">Create your first branch to start managing operations.</div>
                      </div>
                    </td>
                  </tr>
                ) : branches.map((b) => (
                  <tr key={b._id}>
                    <td>
                      <div className="font-semibold text-primary">{b.name}</div>
                      <div className="text-xs text-muted mt-1">{b.email}</div>
                    </td>
                    <td>{b.city}</td>
                    <td><span className="badge" style={{ background: 'var(--surface-3)', color: 'var(--text-secondary)' }}>{b.code}</span></td>
                    <td>{b.departments?.length || 0} Departments</td>
                    <td>
                      <span className="badge" style={{ 
                        background: b.isActive ? 'var(--success-bg)' : 'var(--error-bg)', 
                        color: b.isActive ? 'var(--success)' : 'var(--error)',
                        borderColor: b.isActive ? '#bbf7d0' : '#fecaca'
                      }}>
                        {b.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dept distribution */}
        <div className="card">
          <div className="card-header">
            <h2 className="section-title">Department Utilization</h2>
          </div>
          {deptStats.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <div className="empty-title">No data available</div>
            </div>
          ) : (
            <div className="flex" style={{ flexDirection: 'column', gap: '1rem' }}>
              {deptStats.map((d) => {
                const max = deptStats[0]?.count || 1;
                const pct = Math.round((d.count / max) * 100);
                return (
                  <div key={d._id}>
                    <div className="flex justify-between items-center mb-1 text-sm">
                      <span className="font-semibold text-secondary">{getDeptLabel(d._id)}</span>
                      <span className="font-bold" style={{ color: getDeptColor(d._id) }}>{d.count} Patients</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: getDeptColor(d._id) }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Today's appointments */}
        <div className="card">
          <div className="card-header">
            <h2 className="section-title">Live Session Feed (All Branches)</h2>
          </div>
          {todayAppts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <div className="empty-title">No sessions today</div>
            </div>
          ) : (
            <div className="timeline" style={{ paddingLeft: '0.5rem' }}>
              {todayAppts.map((a) => (
                <div key={a._id} className="timeline-item">
                  <div className="timeline-dot" style={{ borderColor: getDeptColor(a.department) }} />
                  <div className="flex-1" style={{ marginTop: '-4px' }}>
                    <div className="flex justify-between items-center">
                      <div className="font-semibold text-primary">{a.patient?.name}</div>
                      <span className="badge" style={{ background: `${APPOINTMENT_STATUSES[a.status]?.color}15`, color: APPOINTMENT_STATUSES[a.status]?.color }}>
                        {APPOINTMENT_STATUSES[a.status]?.label}
                      </span>
                    </div>
                    <div className="text-sm text-secondary mt-1">
                      {a.timeSlot} • Dr. {a.therapist?.name}
                    </div>
                    <div className="text-xs text-muted mt-1">
                      {getDeptLabel(a.department)} • {a.branch?.code}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OwnerDashboard;
