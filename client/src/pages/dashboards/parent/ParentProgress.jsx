import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { patientsApi } from '../../../api/patients';
import { appointmentsApi } from '../../../api/appointments';
import { getDeptLabel, getDeptColor } from '../../../utils/constants';

const ParentProgress = () => {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Home practice tracker state (persisted per child in localStorage)
  const [completedPractices, setCompletedPractices] = useState({});

  useEffect(() => {
    const loadParentData = async () => {
      try {
        const [patientsRes, apptsRes] = await Promise.all([
          patientsApi.getAll(),
          appointmentsApi.getAll({ status: 'completed' }),
        ]);
        const kids = patientsRes.data;
        setChildren(kids);
        if (kids.length > 0) {
          setSelectedChild(kids[0]);
        }
        // Only parent-visible appointments
        setAppointments(apptsRes.data.filter(a => a.parentVisible));

        // Load practice checklist from localStorage
        const saved = localStorage.getItem('vschool_home_practices');
        if (saved) {
          try {
            setCompletedPractices(JSON.parse(saved));
          } catch (e) {
            console.error(e);
          }
        }
      } catch (err) {
        console.error('Failed to load parent progress data', err);
      } finally {
        setLoading(false);
      }
    };
    loadParentData();
  }, []);

  const childAppts = selectedChild
    ? appointments.filter(a => a.patient?._id === selectedChild._id)
    : [];

  // Extract all unique milestones from this child's appointments
  const allMilestones = [];
  const seenGoals = new Set();
  childAppts.forEach(a => {
    if (a.milestones && a.milestones.length > 0) {
      a.milestones.forEach(m => {
        if (!seenGoals.has(m.goal)) {
          seenGoals.add(m.goal);
          allMilestones.push({ ...m, department: a.department, date: a.date });
        }
      });
    }
  });

  // Extract home activities assigned in sessions
  const homeActivitiesList = childAppts
    .filter(a => a.homeActivities && a.homeActivities.trim().length > 0)
    .map(a => ({
      id: a._id,
      text: a.homeActivities,
      department: a.department,
      therapist: a.therapist?.name,
      date: a.date,
    }));

  const handleTogglePractice = (practiceId) => {
    setCompletedPractices(prev => {
      const today = new Date().toISOString().split('T')[0];
      const childKey = `${selectedChild?._id}_${practiceId}_${today}`;
      const next = { ...prev, [childKey]: !prev[childKey] };
      localStorage.setItem('vschool_home_practices', JSON.stringify(next));
      return next;
    });
  };

  const achievedCount = allMilestones.filter(m => m.status === 'achieved').length;
  const inProgressCount = allMilestones.filter(m => m.status === 'in_progress').length;
  const progressPct = allMilestones.length > 0
    ? Math.round((achievedCount / allMilestones.length) * 100)
    : 0;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="loading-screen">
          <div className="spinner spinner-lg"></div>
          <p className="mt-3">Loading developmental milestones &amp; home program...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Child Progress &amp; Developmental Milestones</h1>
          <p className="page-subtitle">
            Longitudinal skill mastery, therapist feedback, and home practice exercises.
          </p>
        </div>
      </div>

      {children.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">👶</div>
            <div className="empty-title">No Children Registered</div>
            <div className="empty-desc">Please contact reception to connect your child to this account.</div>
          </div>
        </div>
      ) : (
        <>
          {/* Child Selector Tabs (if multiple children) */}
          {children.length > 1 && (
            <div className="flex gap-2 mb-4">
              {children.map(c => (
                <button
                  key={c._id}
                  className={`btn ${selectedChild?._id === c._id ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSelectedChild(c)}
                >
                  {c.gender === 'female' ? '👧' : '👦'} {c.name}
                </button>
              ))}
            </div>
          )}

          {selectedChild && (
            <>
              {/* Child Overview Hero */}
              <div
                className="card mb-4"
                style={{
                  background: 'linear-gradient(135deg, var(--surface) 0%, var(--primary-light) 100%)',
                  border: '1px solid rgba(37,99,235,0.2)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div className="flex gap-4 items-center flex-wrap">
                  <div
                    className="user-avatar-lg"
                    style={{ width: 68, height: 68, fontSize: '2rem', background: '#fff', boxShadow: 'var(--shadow-sm)' }}
                  >
                    {selectedChild.gender === 'female' ? '👧' : '👦'}
                  </div>
                  <div className="flex-1" style={{ minWidth: 220 }}>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-primary">{selectedChild.name}</h2>
                      <span className="badge" style={{ background: 'var(--surface)', color: 'var(--text-secondary)' }}>
                        Age {selectedChild.age} • {selectedChild.gender}
                      </span>
                    </div>
                    {selectedChild.diagnosis && (
                      <div className="text-xs font-semibold text-secondary mt-1">
                        Diagnosis: <strong>{selectedChild.diagnosis}</strong>
                      </div>
                    )}
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {selectedChild.enrolledDepartments?.map(d => (
                        <span
                          key={d}
                          className="dept-chip"
                          style={{ background: `${getDeptColor(d)}18`, color: getDeptColor(d) }}
                        >
                          {getDeptLabel(d)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Overall Milestone Score */}
                  <div
                    className="card-compact"
                    style={{
                      background: 'var(--surface)',
                      padding: '1rem 1.25rem',
                      borderRadius: 'var(--r-lg)',
                      boxShadow: 'var(--shadow-xs)',
                      textAlign: 'center',
                      minWidth: 160,
                    }}
                  >
                    <div className="text-xs font-bold text-muted uppercase">Milestones Mastered</div>
                    <div className="text-3xl font-extrabold text-primary mt-1">
                      {achievedCount} <span className="text-base text-muted font-normal">/ {allMilestones.length || 0}</span>
                    </div>
                    <div className="progress-bar mt-2" style={{ height: 6 }}>
                      <div
                        className="progress-fill"
                        style={{ width: `${progressPct}%`, background: 'var(--emerald)' }}
                      />
                    </div>
                    <div className="text-xs text-emerald-600 font-semibold mt-1">
                      {progressPct}% Skill Progression
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid-2" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
                {/* Left Column: Targeted Milestones & Clinical Feed */}
                <div className="flex" style={{ flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Milestones Card */}
                  <div className="card">
                    <div className="card-header flex justify-between items-center">
                      <div>
                        <h3 className="section-title">Longitudinal Skill Goals</h3>
                        <div className="text-xs text-muted mt-1">
                          Evaluated by therapists during clinical sessions
                        </div>
                      </div>
                      <span className="badge" style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
                        {achievedCount} Achieved • {inProgressCount} In Progress
                      </span>
                    </div>

                    {allMilestones.length === 0 ? (
                      <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                        <div className="empty-icon">🎯</div>
                        <div className="empty-title">Goals Being Formulated</div>
                        <div className="empty-desc">
                          Therapists will record and track specific developmental targets during upcoming sessions.
                        </div>
                      </div>
                    ) : (
                      <div className="flex" style={{ flexDirection: 'column', gap: '0.65rem' }}>
                        {allMilestones.map((m, idx) => {
                          const deptColor = getDeptColor(m.department);
                          const isAchieved = m.status === 'achieved';
                          return (
                            <div
                              key={idx}
                              className="milestone-row"
                              style={{
                                background: isAchieved ? 'var(--success-bg)' : 'var(--surface)',
                                borderColor: isAchieved ? '#bbf7d0' : 'var(--border)',
                              }}
                            >
                              <div className="flex items-center gap-2 flex-1">
                                <span style={{ fontSize: '1rem' }}>
                                  {isAchieved ? '✅' : '🔄'}
                                </span>
                                <div>
                                  <div className="text-sm font-semibold text-primary">{m.goal}</div>
                                  <div className="text-xs text-muted mt-0.5">
                                    <span style={{ color: deptColor, fontWeight: 600 }}>
                                      {getDeptLabel(m.department)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <span
                                className="badge"
                                style={{
                                  fontSize: '0.725rem',
                                  background: isAchieved ? '#dcfce7' : 'var(--surface-3)',
                                  color: isAchieved ? '#16a34a' : 'var(--text-secondary)',
                                  border: isAchieved ? '1px solid #86efac' : '1px solid var(--border)',
                                }}
                              >
                                {isAchieved ? 'Goal Mastered' : 'In Progress'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Shared Session Notes Feed */}
                  <div className="card">
                    <div className="card-header">
                      <h3 className="section-title">Therapist Notes &amp; Session Highlights</h3>
                      <p className="text-xs text-muted mt-1">Observations shared by the clinical care team</p>
                    </div>

                    {childAppts.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-icon">📝</div>
                        <div className="empty-title">No Notes Published Yet</div>
                        <div className="empty-desc">Notes will appear here after sessions are completed.</div>
                      </div>
                    ) : (
                      <div className="flex" style={{ flexDirection: 'column', gap: '1rem' }}>
                        {childAppts.map(a => {
                          const deptColor = getDeptColor(a.department);
                          return (
                            <div
                              key={a._id}
                              className="card-compact"
                              style={{
                                borderLeft: `4px solid ${deptColor}`,
                                background: 'var(--surface)',
                                boxShadow: 'var(--shadow-xs)',
                              }}
                            >
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="dept-chip"
                                    style={{ background: `${deptColor}15`, color: deptColor }}
                                  >
                                    {getDeptLabel(a.department)}
                                  </span>
                                  <span className="text-xs font-semibold text-secondary">
                                    Dr. {a.therapist?.name}
                                  </span>
                                </div>
                                <span className="text-xs text-muted">
                                  {new Date(a.date).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </span>
                              </div>

                              <div className="text-sm text-secondary mb-2" style={{ lineHeight: 1.6 }}>
                                {a.soapNotes?.assessment ? (
                                  <div>
                                    <strong>Session Summary: </strong>
                                    {a.soapNotes.assessment}
                                    {a.soapNotes.plan && (
                                      <div className="mt-1 text-xs text-muted">
                                        <strong>Next Focus: </strong> {a.soapNotes.plan}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  a.sessionNotes
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Home Practice & Care Team */}
                <div className="flex" style={{ flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Home Exercise & Practice Checklist */}
                  <div className="card">
                    <div className="card-header">
                      <h3 className="section-title">🏡 Daily Home Program</h3>
                      <div className="text-xs text-muted mt-1">Recommended daily exercises for home practice</div>
                    </div>

                    {homeActivitiesList.length === 0 ? (
                      <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                        <div className="empty-icon">🧸</div>
                        <div className="empty-title">All Caught Up!</div>
                        <div className="empty-desc">Your therapist will prescribe home activities during sessions.</div>
                      </div>
                    ) : (
                      <div className="flex" style={{ flexDirection: 'column', gap: '0.75rem' }}>
                        <div className="card-compact" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '0.75rem' }}>
                          💡 <strong>Tip:</strong> 10-15 minutes of structured play each day dramatically accelerates child skill retention!
                        </div>

                        {homeActivitiesList.map(item => {
                          const today = new Date().toISOString().split('T')[0];
                          const practiceKey = `${selectedChild?._id}_${item.id}_${today}`;
                          const isDoneToday = Boolean(completedPractices[practiceKey]);

                          return (
                            <div
                              key={item.id}
                              className="card-compact"
                              style={{
                                background: isDoneToday ? 'var(--success-bg)' : 'var(--surface-2)',
                                border: isDoneToday ? '1px solid #86efac' : '1px solid var(--border)',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span
                                  className="dept-chip"
                                  style={{
                                    background: `${getDeptColor(item.department)}15`,
                                    color: getDeptColor(item.department),
                                    fontSize: '0.675rem',
                                  }}
                                >
                                  {getDeptLabel(item.department).split(' ')[0]} • Dr. {item.therapist}
                                </span>

                                <label
                                  className="flex items-center gap-1.5"
                                  style={{ cursor: 'pointer' }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isDoneToday}
                                    onChange={() => handleTogglePractice(item.id)}
                                    style={{ accentColor: 'var(--success)', width: 16, height: 16 }}
                                  />
                                  <span
                                    className="text-xs font-bold"
                                    style={{ color: isDoneToday ? 'var(--success)' : 'var(--text-muted)' }}
                                  >
                                    {isDoneToday ? 'Done Today! 🎉' : 'Mark Done'}
                                  </span>
                                </label>
                              </div>

                              <p className="text-xs text-primary font-medium" style={{ whiteSpace: 'pre-line' }}>
                                {item.text}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Care Team Quick Contacts */}
                  <div className="card">
                    <div className="card-header">
                      <h3 className="section-title">🩺 Care Team Specialists</h3>
                    </div>

                    {selectedChild.assignedTherapists?.length === 0 ? (
                      <div className="text-xs text-muted">No therapists assigned yet.</div>
                    ) : (
                      <div className="flex" style={{ flexDirection: 'column', gap: '0.6rem' }}>
                        {selectedChild.assignedTherapists.map(t => (
                          <div key={t._id} className="card-compact flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="user-avatar" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                                {t.name?.[0]}
                              </div>
                              <div>
                                <div className="font-semibold text-xs text-primary">{t.name}</div>
                                <div className="text-xs text-muted">
                                  {t.departments?.map(d => getDeptLabel(d).split(' ')[0]).join(', ')}
                                </div>
                              </div>
                            </div>
                            {t.phone && (
                              <a
                                href={`tel:${t.phone}`}
                                className="btn btn-ghost btn-sm"
                                style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem' }}
                              >
                                📞 Call
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </DashboardLayout>
  );
};

export default ParentProgress;
