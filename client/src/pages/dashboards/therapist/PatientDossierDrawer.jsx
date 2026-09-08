import { useState, useEffect } from 'react';
import { appointmentsApi } from '../../../api/appointments';
import { getDeptLabel, getDeptColor, APPOINTMENT_STATUSES } from '../../../utils/constants';

const PatientDossierDrawer = ({ patient, onClose, onScheduleSession, onEditNotes }) => {
  const [activeTab, setActiveTab] = useState('history');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSessionId, setExpandedSessionId] = useState(null);

  useEffect(() => {
    if (!patient?._id) return;
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await appointmentsApi.getAll({ patient: patient._id });
        setSessions(res.data);
        // Expand the most recent completed or scheduled session by default
        if (res.data.length > 0) {
          setExpandedSessionId(res.data[0]._id);
        }
      } catch (err) {
        console.error('Failed to fetch patient appointment history', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [patient?._id]);

  if (!patient) return null;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="drawer-header">
          <div className="flex items-center gap-3">
            <div
              className="user-avatar-lg"
              style={{ width: 44, height: 44, fontSize: '1.25rem', background: 'var(--primary-light)', color: 'var(--primary)' }}
            >
              {patient.gender === 'female' ? '👧' : '👦'}
            </div>
            <div>
              <div className="font-bold text-base text-primary">{patient.name}</div>
              <div className="text-xs text-muted">
                Age {patient.age} • {patient.gender} • {patient.branch?.name || 'Main Branch'}
              </div>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        {/* Diagnosis Pill & Action Bar */}
        <div
          className="flex justify-between items-center px-4 py-3"
          style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2 flex-wrap">
            {patient.diagnosis && (
              <span className="badge" style={{ background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                📋 {patient.diagnosis}
              </span>
            )}
            {patient.enrolledDepartments?.map(d => (
              <span
                key={d}
                className="dept-chip"
                style={{ background: `${getDeptColor(d)}18`, color: getDeptColor(d) }}
              >
                {getDeptLabel(d).split(' ')[0]}
              </span>
            ))}
          </div>

          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              if (onScheduleSession) onScheduleSession(patient);
            }}
          >
            + New Session
          </button>
        </div>

        {/* Drawer Tabs */}
        <div className="px-4 pt-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="tab-nav" style={{ marginBottom: 0, borderBottom: 'none' }}>
            <button
              className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              📜 Clinical History ({sessions.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              👶 Demographics &amp; Parents
            </button>
            <button
              className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`}
              onClick={() => setActiveTab('team')}
            >
              🩺 Care Team ({patient.assignedTherapists?.length || 0})
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="drawer-body">
          {/* ─── TAB 1: CLINICAL HISTORY ─────────────────────────────────── */}
          {activeTab === 'history' && (
            <div>
              {loading ? (
                <div className="loading-screen" style={{ minHeight: 200 }}>
                  <div className="spinner"></div>
                  <p className="text-xs text-muted mt-2">Loading clinical session timeline...</p>
                </div>
              ) : sessions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <div className="empty-title">No Sessions Yet</div>
                  <div className="empty-desc">This child does not have any recorded therapy sessions.</div>
                </div>
              ) : (
                <div className="timeline" style={{ paddingLeft: '0.75rem' }}>
                  {sessions.map((s) => {
                    const isExpanded = expandedSessionId === s._id;
                    const deptColor = getDeptColor(s.department);

                    return (
                      <div key={s._id} className="timeline-item" style={{ marginBottom: '1.5rem' }}>
                        <div className="timeline-dot" style={{ borderColor: deptColor }} />
                        <div className="flex-1" style={{ marginTop: '-4px' }}>
                          <div
                            className="card-compact"
                            style={{
                              background: 'var(--surface)',
                              border: isExpanded ? `1px solid ${deptColor}` : '1px solid var(--border)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            onClick={() => setExpandedSessionId(isExpanded ? null : s._id)}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className="dept-chip"
                                    style={{ background: `${deptColor}15`, color: deptColor }}
                                  >
                                    {getDeptLabel(s.department)}
                                  </span>
                                  <strong className="text-xs text-secondary">
                                    {new Date(s.date).toLocaleDateString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                                  </strong>
                                  <span className="text-xs text-muted">• {s.timeSlot}</span>
                                </div>
                                <div className="text-xs text-muted mt-1">
                                  Therapist: <strong>{s.therapist?.name || 'Assigned Therapist'}</strong>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span
                                  className="badge"
                                  style={{
                                    background: `${APPOINTMENT_STATUSES[s.status]?.color}15`,
                                    color: APPOINTMENT_STATUSES[s.status]?.color,
                                  }}
                                >
                                  {APPOINTMENT_STATUSES[s.status]?.label}
                                </span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                  {isExpanded ? '▲' : '▼'}
                                </span>
                              </div>
                            </div>

                            {/* Collapsible Details */}
                            {isExpanded && (
                              <div
                                className="mt-3 pt-3"
                                style={{ borderTop: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {/* SOAP Breakdown */}
                                {s.soapNotes && (s.soapNotes.subjective || s.soapNotes.objective || s.soapNotes.assessment || s.soapNotes.plan) ? (
                                  <div className="flex" style={{ flexDirection: 'column', gap: '0.5rem' }}>
                                    {s.soapNotes.subjective && (
                                      <div className="text-xs">
                                        <strong className="text-sky-600">S (Subjective):</strong> {s.soapNotes.subjective}
                                      </div>
                                    )}
                                    {s.soapNotes.objective && (
                                      <div className="text-xs">
                                        <strong className="text-emerald-600">O (Objective):</strong> {s.soapNotes.objective}
                                      </div>
                                    )}
                                    {s.soapNotes.assessment && (
                                      <div className="text-xs">
                                        <strong className="text-amber-600">A (Assessment):</strong> {s.soapNotes.assessment}
                                      </div>
                                    )}
                                    {s.soapNotes.plan && (
                                      <div className="text-xs">
                                        <strong className="text-purple-600">P (Plan):</strong> {s.soapNotes.plan}
                                      </div>
                                    )}
                                  </div>
                                ) : s.sessionNotes ? (
                                  <div className="text-xs text-primary" style={{ whiteSpace: 'pre-line' }}>
                                    {s.sessionNotes}
                                  </div>
                                ) : (
                                  <div className="text-xs text-muted italic">No clinical notes recorded for this session.</div>
                                )}

                                {/* Milestones evaluated */}
                                {s.milestones && s.milestones.length > 0 && (
                                  <div className="mt-1">
                                    <div className="text-xs font-semibold text-secondary mb-1">Target Goals Evaluated:</div>
                                    <div className="flex gap-1 flex-wrap">
                                      {s.milestones.map((m, mi) => (
                                        <span
                                          key={mi}
                                          className="badge"
                                          style={{
                                            fontSize: '0.7rem',
                                            background: m.status === 'achieved' ? 'var(--success-bg)' : 'var(--surface-2)',
                                            color: m.status === 'achieved' ? 'var(--success)' : 'var(--text-secondary)',
                                            border: '1px solid var(--border)',
                                          }}
                                        >
                                          {m.status === 'achieved' ? '✓ ' : '• '} {m.goal}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Home Activities */}
                                {s.homeActivities && (
                                  <div
                                    className="p-2 card-compact"
                                    style={{ background: 'var(--primary-light)', fontSize: '0.75rem', color: 'var(--primary)' }}
                                  >
                                    <strong>🏡 Home Program:</strong> {s.homeActivities}
                                  </div>
                                )}

                                {/* Actions */}
                                <div className="flex justify-between items-center pt-2">
                                  <span className="text-xs text-muted">
                                    {s.parentVisible ? '👨‍👩‍👧 Shared with parent' : '🔒 Clinic internal'}
                                  </span>
                                  {onEditNotes && (
                                    <button
                                      className="btn btn-primary btn-sm"
                                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                                      onClick={() => onEditNotes(s)}
                                    >
                                      Edit / Add Notes
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─── TAB 2: DEMOGRAPHICS & PARENTS ─────────────────────────── */}
          {activeTab === 'profile' && (
            <div className="flex" style={{ flexDirection: 'column', gap: '1rem' }}>
              <div className="card-compact" style={{ background: 'var(--surface-2)' }}>
                <h4 className="font-semibold text-sm mb-2">Child Information</h4>
                <div className="grid-2" style={{ gap: '0.75rem', fontSize: '0.825rem' }}>
                  <div>
                    <span className="text-muted">Full Name:</span>
                    <div className="font-semibold">{patient.name}</div>
                  </div>
                  <div>
                    <span className="text-muted">Date of Birth:</span>
                    <div className="font-semibold">
                      {new Date(patient.dateOfBirth).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted">Age &amp; Gender:</span>
                    <div className="font-semibold">{patient.age} years • {patient.gender}</div>
                  </div>
                  <div>
                    <span className="text-muted">Status:</span>
                    <div className="font-semibold text-emerald-600 uppercase">{patient.status}</div>
                  </div>
                </div>
              </div>

              {/* Medical notes */}
              <div className="card-compact" style={{ background: 'var(--surface-2)' }}>
                <h4 className="font-semibold text-sm mb-2">Clinical Presentation &amp; Intake Notes</h4>
                <div className="text-xs mb-2">
                  <span className="text-muted">Primary Diagnosis:</span>
                  <div className="font-semibold text-primary">{patient.diagnosis || 'None specified'}</div>
                </div>
                <div className="text-xs">
                  <span className="text-muted">Initial Medical / Behavioral Notes:</span>
                  <div className="text-secondary mt-1" style={{ whiteSpace: 'pre-line' }}>
                    {patient.medicalNotes || 'No specific intake notes entered.'}
                  </div>
                </div>
              </div>

              {/* Parent details */}
              <div className="card-compact" style={{ background: 'var(--surface-2)' }}>
                <h4 className="font-semibold text-sm mb-2">Parent / Primary Guardian</h4>
                <div className="grid-2" style={{ gap: '0.75rem', fontSize: '0.825rem' }}>
                  <div>
                    <span className="text-muted">Parent Name:</span>
                    <div className="font-semibold">{patient.parentDetails?.name || 'Not provided'}</div>
                  </div>
                  <div>
                    <span className="text-muted">Relationship:</span>
                    <div className="font-semibold">{patient.parentDetails?.relationship || 'Parent'}</div>
                  </div>
                  <div>
                    <span className="text-muted">Contact Phone:</span>
                    <div className="font-semibold">{patient.parentDetails?.phone || 'Not provided'}</div>
                  </div>
                  <div>
                    <span className="text-muted">Email:</span>
                    <div className="font-semibold">{patient.parentDetails?.email || 'Not provided'}</div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span className="text-muted">Residential Address:</span>
                    <div className="font-semibold">{patient.parentDetails?.address || 'Not provided'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 3: CARE TEAM ───────────────────────────────────────── */}
          {activeTab === 'team' && (
            <div className="flex" style={{ flexDirection: 'column', gap: '0.75rem' }}>
              <p className="text-xs text-muted mb-1">
                Therapists assigned to collaborate on this child's multidisciplinary care plan:
              </p>
              {patient.assignedTherapists?.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">👥</div>
                  <div className="empty-title">No Therapists Assigned</div>
                </div>
              ) : (
                patient.assignedTherapists.map(t => (
                  <div key={t._id} className="card-compact flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="user-avatar" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                        {t.name?.[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-primary">{t.name}</div>
                        <div className="text-xs text-muted">
                          {t.departments?.map(d => getDeptLabel(d)).join(', ')}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted">
                      {t.phone || t.email}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDossierDrawer;
