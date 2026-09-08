import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { patientsApi } from '../../api/patients';
import { appointmentsApi } from '../../api/appointments';
import { getDeptLabel, getDeptColor } from '../../utils/constants';
import { Link } from 'react-router-dom';

const ParentDashboard = () => {
  const [children, setChildren] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [progressNotes, setProgressNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [patientRes, apptRes] = await Promise.all([
          patientsApi.getAll(),
          appointmentsApi.getAll({ status: 'scheduled' }),
        ]);
        const kids = patientRes.data;
        setChildren(kids);
        if (kids.length > 0) setSelectedChild(kids[0]);
        setAppointments(apptRes.data);

        // Fetch completed + parent-visible appointments for progress notes
        const notesRes = await appointmentsApi.getAll({ status: 'completed' });
        setProgressNotes(notesRes.data.filter(a => a.parentVisible && a.sessionNotes));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const childAppts = selectedChild
    ? appointments.filter(a => a.patient?._id === selectedChild._id)
    : [];
  const childNotes = selectedChild
    ? progressNotes.filter(a => a.patient?._id === selectedChild._id)
    : [];

  if (loading) return (
    <DashboardLayout>
      <div className="loading-screen">
        <div className="spinner spinner-lg"></div>
        <p>Loading Parent Portal...</p>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Parent Portal</h1>
          <p className="page-subtitle">Track your child's therapy progress, schedules, and clinical notes.</p>
        </div>
        <Link to="/dashboard/progress" className="btn btn-primary">
          📈 View Skill Milestones &amp; Home Plan
        </Link>
      </div>

      {children.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">👶</div>
            <div className="empty-title">No Children Registered</div>
            <div className="empty-desc">Please contact the clinic reception to link your child's profile to this account.</div>
          </div>
        </div>
      ) : (
        <>
          {/* Child selector */}
          {children.length > 1 && (
            <div className="flex gap-2 mb-3" style={{ flexWrap: 'wrap' }}>
              {children.map((child) => (
                <button
                  key={child._id}
                  className={`btn ${selectedChild?._id === child._id ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSelectedChild(child)}
                >
                  {child.name}
                </button>
              ))}
            </div>
          )}

          {selectedChild && (
            <>
              {/* Child info card */}
              <div className="card mb-3" style={{ background: 'var(--primary-light)', border: '1px solid rgba(37,99,235,0.15)' }}>
                <div className="flex gap-3 items-center">
                  <div className="user-avatar-lg" style={{ width: 64, height: 64, fontSize: '1.75rem' }}>
                    {selectedChild.gender === 'female' ? '👧' : '👦'}
                  </div>
                  <div className="flex-1">
                    <div className="page-title mb-1">{selectedChild.name}</div>
                    <div className="text-secondary text-sm mb-2">
                      Age {selectedChild.age} • {selectedChild.gender} • Branch: <strong>{selectedChild.branch?.name}</strong>
                    </div>
                    {selectedChild.diagnosis && (
                      <div className="badge" style={{ background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>
                        📋 Diagnosis: {selectedChild.diagnosis}
                      </div>
                    )}
                    <div className="flex gap-1 mt-2" style={{ flexWrap: 'wrap' }}>
                      {selectedChild.enrolledDepartments?.map((d) => (
                        <span key={d} className="dept-chip" style={{ background: `${getDeptColor(d)}15`, color: getDeptColor(d), border: `1px solid ${getDeptColor(d)}30` }}>
                          {getDeptLabel(d)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Therapists */}
              {selectedChild.assignedTherapists?.length > 0 && (
                <div className="mb-3">
                  <h2 className="section-label">Care Team</h2>
                  <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                    {selectedChild.assignedTherapists.map((t) => (
                      <div key={t._id} className="card-compact flex items-center gap-2">
                        <div className="user-avatar" style={{ background: 'var(--surface-3)', color: 'var(--primary)' }}>
                          {t.name?.[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{t.name}</div>
                          <div className="text-xs text-muted">
                            {t.departments?.map(d => getDeptLabel(d).split(' ')[0]).join(', ')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid-2">
                {/* Upcoming appointments */}
                <div className="card">
                  <div className="card-header">
                    <h2 className="section-title">Upcoming Sessions</h2>
                  </div>
                  {childAppts.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">📅</div>
                      <div className="empty-title">No upcoming sessions</div>
                    </div>
                  ) : (
                    <div className="timeline" style={{ paddingLeft: '0.5rem' }}>
                      {childAppts.map((a) => (
                        <div key={a._id} className="timeline-item">
                          <div className="timeline-dot" style={{ borderColor: getDeptColor(a.department) }} />
                          <div className="flex-1" style={{ marginTop: '-4px' }}>
                            <div className="font-semibold text-primary">{getDeptLabel(a.department)}</div>
                            <div className="text-sm text-secondary mt-1">
                              <strong>{new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</strong> • {a.timeSlot}
                            </div>
                            <div className="text-xs text-muted mt-1">
                              Dr. {a.therapist?.name}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Progress notes */}
                <div className="card">
                  <div className="card-header">
                    <h2 className="section-title">Therapy Progress Notes</h2>
                  </div>
                  {childNotes.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">📝</div>
                      <div className="empty-title">No notes shared yet</div>
                      <div className="empty-desc">Clinical notes will appear here when therapists share them.</div>
                    </div>
                  ) : (
                    <div className="flex" style={{ flexDirection: 'column', gap: '1rem' }}>
                      {childNotes.map((a) => (
                        <div key={a._id} className="card-compact" style={{ borderLeft: `4px solid ${getDeptColor(a.department)}` }}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-sm" style={{ color: getDeptColor(a.department) }}>
                              {getDeptLabel(a.department)}
                            </span>
                            <span className="text-xs text-muted">
                              {new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-sm text-primary mb-2" style={{ lineHeight: 1.6 }}>
                            {a.sessionNotes}
                          </p>
                          <div className="text-xs text-muted">
                            — Documented by Dr. {a.therapist?.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </DashboardLayout>
  );
};

export default ParentDashboard;
