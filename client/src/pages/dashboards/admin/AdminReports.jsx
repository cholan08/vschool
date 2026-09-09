import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { useAuth } from '../../../context/AuthContext';
import { appointmentsApi } from '../../../api/appointments';
import { patientsApi } from '../../../api/patients';
import { usersApi } from '../../../api/users';
import { getDeptLabel, getDeptColor } from '../../../utils/constants';

const AdminReports = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all'); // all | month | week

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [apptsRes, patientsRes, usersRes] = await Promise.all([
          appointmentsApi.getAll({ branch: user?.branch?._id }),
          patientsApi.getAll({ branch: user?.branch?._id }),
          usersApi.getAll({ branch: user?.branch?._id }),
        ]);
        setAppointments(apptsRes.data);
        setPatients(patientsRes.data);
        setStaff(usersRes.data);
      } catch (err) {
        console.error('Failed to load analytics data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.branch?._id]);

  // Filter appointments by selected date range
  const filteredAppts = appointments.filter((a) => {
    if (dateFilter === 'all') return true;
    const d = new Date(a.date);
    const now = new Date();
    if (dateFilter === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return d >= oneWeekAgo && d <= now;
    }
    if (dateFilter === 'month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(now.getMonth() - 1);
      return d >= oneMonthAgo && d <= now;
    }
    return true;
  });

  // Calculate Metrics
  const totalSessions = filteredAppts.length;
  const completedSessions = filteredAppts.filter((a) => a.status === 'completed').length;
  const cancelledSessions = filteredAppts.filter((a) => a.status === 'cancelled').length;
  const noShowSessions = filteredAppts.filter((a) => a.status === 'no_show').length;
  const scheduledSessions = filteredAppts.filter((a) => a.status === 'scheduled').length;

  const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
  const attendanceRate = totalSessions > 0 ? Math.round(((completedSessions + scheduledSessions) / totalSessions) * 100) : 100;
  const activePatients = patients.filter((p) => p.status === 'active').length;

  // Department distribution
  const deptCounts = {};
  patients.forEach((p) => {
    (p.enrolledDepartments || []).forEach((dept) => {
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });
  });

  const deptList = Object.entries(deptCounts)
    .map(([key, count]) => ({
      key,
      label: getDeptLabel(key),
      color: getDeptColor(key),
      count,
      percent: patients.length > 0 ? Math.round((count / patients.length) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Age Demographics
  const ageGroups = {
    '0 - 3 Years (Toddler)': 0,
    '4 - 6 Years (Early Child)': 0,
    '7 - 10 Years (School Age)': 0,
    '11+ Years (Adolescent)': 0,
  };

  patients.forEach((p) => {
    if (!p.dateOfBirth) return;
    const age = new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear();
    if (age <= 3) ageGroups['0 - 3 Years (Toddler)']++;
    else if (age <= 6) ageGroups['4 - 6 Years (Early Child)']++;
    else if (age <= 10) ageGroups['7 - 10 Years (School Age)']++;
    else ageGroups['11+ Years (Adolescent)']++;
  });

  // Therapist Productivity
  const therapists = staff.filter((s) => s.role === 'therapist');
  const therapistStats = therapists.map((t) => {
    const tAppts = filteredAppts.filter((a) => (a.therapist?._id || a.therapist)?.toString() === t._id.toString());
    const tCompleted = tAppts.filter((a) => a.status === 'completed').length;
    const tPatients = patients.filter((p) =>
      p.assignedTherapists?.some((at) => (at._id || at).toString() === t._id.toString())
    ).length;
    const rate = tAppts.length > 0 ? Math.round((tCompleted / tAppts.length) * 100) : 100;
    return {
      ...t,
      totalSessions: tAppts.length,
      completedSessions: tCompleted,
      assignedPatients: tPatients,
      rate,
    };
  });

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="loading-screen">
          <div className="spinner spinner-lg"></div>
          <p>Generating reports & analytics...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboards & Analytics</h1>
          <p className="page-subtitle">
            Operational reports, clinical performance metrics, and patient insights for {user?.branch?.name}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            className="form-control"
            style={{ width: 'auto', fontWeight: 600 }}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All Time History</option>
            <option value="month">Past 30 Days</option>
            <option value="week">Past 7 Days</option>
          </select>

          <button className="btn btn-secondary" onClick={handlePrint}>
            <span>🖨️ Print / Export</span>
          </button>
        </div>
      </div>

      {/* Core KPI Metrics */}
      <div className="stats-grid" style={{ marginBottom: '1.75rem' }}>
        <div className="stat-card" style={{ '--stat-color': 'var(--primary)' }}>
          <div className="stat-card-top">
            <div className="stat-icon" style={{ background: 'rgba(37,99,235,0.15)', color: 'var(--primary)' }}>
              📊
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sessions</span>
          </div>
          <div>
            <div className="stat-value">{totalSessions}</div>
            <div className="stat-label">Total Conducted / Booked</div>
          </div>
        </div>

        <div className="stat-card" style={{ '--stat-color': 'var(--emerald)' }}>
          <div className="stat-card-top">
            <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--emerald)' }}>
              🎯
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--emerald)', fontWeight: 700 }}>
              {completedSessions} Done
            </span>
          </div>
          <div>
            <div className="stat-value">{completionRate}%</div>
            <div className="stat-label">Session Completion Rate</div>
          </div>
        </div>

        <div className="stat-card" style={{ '--stat-color': 'var(--violet)' }}>
          <div className="stat-card-top">
            <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--violet)' }}>
              👶
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{patients.length} Total</span>
          </div>
          <div>
            <div className="stat-value">{activePatients}</div>
            <div className="stat-label">Active Enrolled Patients</div>
          </div>
        </div>

        <div className="stat-card" style={{ '--stat-color': 'var(--amber)' }}>
          <div className="stat-card-top">
            <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--amber)' }}>
              📈
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--amber)', fontWeight: 700 }}>High Reliability</span>
          </div>
          <div>
            <div className="stat-value">{attendanceRate}%</div>
            <div className="stat-label">Patient Attendance Rate</div>
          </div>
        </div>
      </div>

      {/* Analytics Grid: Session Status & Department Distribution */}
      <div className="grid-2" style={{ marginBottom: '1.75rem' }}>
        {/* Session Status Distribution */}
        <div className="card">
          <div className="card-header">
            <h2 className="section-title">Session Outcome Breakdown</h2>
            <span className="badge" style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
              {totalSessions} Total Sessions
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.5rem' }}>
            {/* Visual Multi-segment bar */}
            {totalSessions > 0 ? (
              <div
                style={{
                  height: '14px',
                  borderRadius: 'var(--r-full)',
                  overflow: 'hidden',
                  display: 'flex',
                  background: 'var(--surface-3)',
                }}
              >
                <div
                  title={`Completed: ${completedSessions}`}
                  style={{
                    width: `${(completedSessions / totalSessions) * 100}%`,
                    background: 'var(--emerald)',
                    transition: 'width 0.4s ease',
                  }}
                />
                <div
                  title={`Scheduled: ${scheduledSessions}`}
                  style={{
                    width: `${(scheduledSessions / totalSessions) * 100}%`,
                    background: 'var(--primary)',
                    transition: 'width 0.4s ease',
                  }}
                />
                <div
                  title={`No Show: ${noShowSessions}`}
                  style={{
                    width: `${(noShowSessions / totalSessions) * 100}%`,
                    background: 'var(--amber)',
                    transition: 'width 0.4s ease',
                  }}
                />
                <div
                  title={`Cancelled: ${cancelledSessions}`}
                  style={{
                    width: `${(cancelledSessions / totalSessions) * 100}%`,
                    background: 'var(--rose)',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            ) : null}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div
                style={{
                  padding: '0.85rem 1rem',
                  background: 'var(--surface-2)',
                  borderRadius: 'var(--r-md)',
                  borderLeft: '4px solid var(--emerald)',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Completed Sessions</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {completedSessions}{' '}
                  <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--emerald)' }}>
                    ({totalSessions ? Math.round((completedSessions / totalSessions) * 100) : 0}%)
                  </span>
                </div>
              </div>

              <div
                style={{
                  padding: '0.85rem 1rem',
                  background: 'var(--surface-2)',
                  borderRadius: 'var(--r-md)',
                  borderLeft: '4px solid var(--primary)',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Upcoming / Scheduled</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {scheduledSessions}{' '}
                  <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--primary)' }}>
                    ({totalSessions ? Math.round((scheduledSessions / totalSessions) * 100) : 0}%)
                  </span>
                </div>
              </div>

              <div
                style={{
                  padding: '0.85rem 1rem',
                  background: 'var(--surface-2)',
                  borderRadius: 'var(--r-md)',
                  borderLeft: '4px solid var(--amber)',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No Show / Absent</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {noShowSessions}{' '}
                  <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--amber)' }}>
                    ({totalSessions ? Math.round((noShowSessions / totalSessions) * 100) : 0}%)
                  </span>
                </div>
              </div>

              <div
                style={{
                  padding: '0.85rem 1rem',
                  background: 'var(--surface-2)',
                  borderRadius: 'var(--r-md)',
                  borderLeft: '4px solid var(--rose)',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cancelled</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {cancelledSessions}{' '}
                  <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--rose)' }}>
                    ({totalSessions ? Math.round((cancelledSessions / totalSessions) * 100) : 0}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Department Distribution */}
        <div className="card">
          <div className="card-header">
            <h2 className="section-title">Department Enrollment Share</h2>
            <span className="badge" style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
              {deptList.length} Departments
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              maxHeight: '260px',
              overflowY: 'auto',
              paddingRight: '0.5rem',
            }}
          >
            {deptList.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No department data available.</p>
            ) : (
              deptList.map((d) => (
                <div key={d.key}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.825rem',
                      marginBottom: '0.25rem',
                    }}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.label}</span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      <strong>{d.count}</strong> patients ({d.percent}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      background: 'var(--surface-3)',
                      borderRadius: 'var(--r-full)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${d.percent}%`,
                        background: d.color,
                        borderRadius: 'var(--r-full)',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Therapist Productivity Table & Age Demographics */}
      <div className="grid-2" style={{ gridTemplateColumns: '3fr 2fr', marginBottom: '1.75rem' }}>
        {/* Therapist Productivity */}
        <div className="card">
          <div className="card-header">
            <h2 className="section-title">Therapist Workload & Productivity</h2>
            <span className="badge" style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--primary)' }}>
              {therapists.length} Specialists
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>Therapist</th>
                  <th>Assigned Children</th>
                  <th>Completed Sessions</th>
                  <th>Efficiency Rate</th>
                </tr>
              </thead>
              <tbody>
                {therapistStats.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No therapists registered in this branch yet.
                    </td>
                  </tr>
                ) : (
                  therapistStats.map((t) => (
                    <tr key={t._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div
                            className="user-avatar"
                            style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}
                          >
                            {t.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: 'var(--surface-2)', fontWeight: 700 }}>
                          {t.assignedPatients} Patients
                        </span>
                      </td>
                      <td>
                        <strong>{t.completedSessions}</strong> / {t.totalSessions}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div
                            style={{
                              flex: 1,
                              height: '6px',
                              background: 'var(--surface-3)',
                              borderRadius: 'var(--r-full)',
                              overflow: 'hidden',
                              minWidth: '50px',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${t.rate}%`,
                                background: t.rate >= 80 ? 'var(--emerald)' : 'var(--amber)',
                              }}
                            />
                          </div>
                          <span style={{ fontWeight: 700, fontSize: '0.75rem' }}>{t.rate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Age Demographics */}
        <div className="card">
          <div className="card-header">
            <h2 className="section-title">Patient Age Demographics</h2>
            <span className="badge" style={{ background: 'var(--surface-2)' }}>Pediatric Distribution</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            {Object.entries(ageGroups).map(([group, count]) => {
              const pct = patients.length > 0 ? Math.round((count / patients.length) * 100) : 0;
              return (
                <div
                  key={group}
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'var(--surface-2)',
                    borderRadius: 'var(--r-md)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.825rem',
                      marginBottom: '0.35rem',
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{group}</span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      <strong>{count}</strong> ({pct}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: '6px',
                      background: 'var(--surface-3)',
                      borderRadius: 'var(--r-full)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: 'var(--violet)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminReports;
