import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { patientsApi } from '../../api/patients';
import { appointmentsApi } from '../../api/appointments';
import { getDeptLabel, getDeptColor, APPOINTMENT_STATUSES } from '../../utils/constants';
import { Link } from 'react-router-dom';
import SessionNotesModal from './therapist/SessionNotesModal';
import ScheduleSessionModal from './therapist/ScheduleSessionModal';
import PatientDossierDrawer from './therapist/PatientDossierDrawer';

const TherapistDashboard = () => {
  const { user } = useAuth();
  const [todayAppts, setTodayAppts] = useState([]);
  const [myPatients, setMyPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionFilter, setSessionFilter] = useState('all');

  // Modals & Drawers
  const [selectedApptForNotes, setSelectedApptForNotes] = useState(null);
  const [selectedPatientForDossier, setSelectedPatientForDossier] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const loadData = async () => {
    try {
      const [todayRes, patientRes] = await Promise.all([
        appointmentsApi.getToday(),
        patientsApi.getAll({ status: 'active' }),
      ]);
      setTodayAppts(todayRes.data);
      setMyPatients(patientRes.data);
    } catch (err) {
      console.error('Failed to load therapist dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveNotes = async (id, data) => {
    await appointmentsApi.addNotes(id, data);
    await loadData();
  };

  const handleQuickComplete = async (appt, e) => {
    e.stopPropagation();
    try {
      await appointmentsApi.update(appt._id, { status: 'completed' });
      await loadData();
    } catch (err) {
      console.error('Failed to mark session as completed', err);
    }
  };

  const handleOpenPatientDossier = (patient) => {
    setSelectedPatientForDossier(patient);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="loading-screen">
          <div className="spinner spinner-lg"></div>
          <p className="mt-3">Loading clinical caseload &amp; schedule...</p>
        </div>
      </DashboardLayout>
    );
  }

  const completedCount = todayAppts.filter(a => a.status === 'completed').length;
  const remainingCount = todayAppts.filter(a => a.status === 'scheduled').length;
  const documentationNeededCount = todayAppts.filter(
    a => a.status === 'completed' && !a.sessionNotes && (!a.soapNotes || !a.soapNotes.assessment)
  ).length;

  const filteredAppts = todayAppts.filter(a => {
    if (sessionFilter === 'scheduled') return a.status === 'scheduled';
    if (sessionFilter === 'completed') return a.status === 'completed';
    return true;
  });

  return (
    <DashboardLayout>
      {/* SOAP Notes Documentation Modal */}
      {selectedApptForNotes && (
        <SessionNotesModal
          appointment={selectedApptForNotes}
          onClose={() => setSelectedApptForNotes(null)}
          onSave={handleSaveNotes}
        />
      )}

      {/* Patient Dossier Drawer */}
      {selectedPatientForDossier && (
        <PatientDossierDrawer
          patient={selectedPatientForDossier}
          onClose={() => setSelectedPatientForDossier(null)}
          onScheduleSession={() => {
            setSelectedPatientForDossier(null);
            setShowScheduleModal(true);
          }}
          onEditNotes={(appt) => setSelectedApptForNotes(appt)}
        />
      )}

      {/* Schedule Follow-up Modal */}
      {showScheduleModal && (
        <ScheduleSessionModal
          patients={myPatients}
          therapist={user}
          onClose={() => setShowScheduleModal(false)}
          onScheduled={() => loadData()}
        />
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Clinical Workspace</h1>
          <p className="page-subtitle">
            {user?.name} • {user?.departments?.map(d => getDeptLabel(d)).join(', ')} • {user?.branch?.name || 'Clinic'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/dashboard/patients" className="btn btn-secondary">
            👶 Patient Caseload ({myPatients.length})
          </Link>
          <button
            className="btn btn-primary"
            onClick={() => setShowScheduleModal(true)}
            disabled={myPatients.length === 0}
          >
            + Schedule Session
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid mb-4">
        {[
          {
            icon: '📅',
            label: "Today's Caseload",
            value: todayAppts.length,
            color: 'var(--primary)',
            subtext: `${remainingCount} upcoming today`,
          },
          {
            icon: '✅',
            label: 'Sessions Conducted',
            value: completedCount,
            color: 'var(--emerald)',
            subtext: `${Math.round((completedCount / (todayAppts.length || 1)) * 100)}% attendance`,
          },
          {
            icon: '📝',
            label: 'Pending SOAP Notes',
            value: documentationNeededCount,
            color: documentationNeededCount > 0 ? 'var(--rose)' : 'var(--emerald)',
            subtext: documentationNeededCount > 0 ? 'Documentation required' : 'All notes up to date',
          },
          {
            icon: '👶',
            label: 'Active Caseload',
            value: myPatients.length,
            color: 'var(--violet)',
            subtext: 'Enrolled under your care',
          },
        ].map((s) => (
          <div key={s.label} className="stat-card" style={{ '--stat-color': s.color }}>
            <div className="stat-card-top">
              <div className="stat-icon" style={{ background: `${s.color}22`, color: s.color }}>
                {s.icon}
              </div>
            </div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <div className="text-xs text-muted mt-1">{s.subtext}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
        {/* Today's Schedule & Caseload */}
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <div>
              <h2 className="section-title">Today's Schedule &amp; Clinical Sessions</h2>
              <p className="text-xs text-muted mt-1">Record SOAP notes, track child milestones, and update parents</p>
            </div>
            {/* Filter pills */}
            <div className="flex gap-1">
              {[
                { key: 'all', label: `All (${todayAppts.length})` },
                { key: 'scheduled', label: `Scheduled (${remainingCount})` },
                { key: 'completed', label: `Completed (${completedCount})` },
              ].map(tab => (
                <button
                  key={tab.key}
                  className={`btn btn-sm ${sessionFilter === tab.key ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: '0.725rem', padding: '0.25rem 0.6rem' }}
                  onClick={() => setSessionFilter(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredAppts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎉</div>
              <div className="empty-title">
                {sessionFilter === 'completed'
                  ? 'No completed sessions yet'
                  : 'No scheduled sessions for this filter'}
              </div>
              <div className="empty-desc">
                {todayAppts.length === 0
                  ? 'You have no clinical sessions scheduled for today.'
                  : 'Try selecting a different filter above.'}
              </div>
            </div>
          ) : (
            <div className="flex" style={{ flexDirection: 'column', gap: '0.85rem' }}>
              {filteredAppts.map((a) => {
                const deptColor = getDeptColor(a.department);
                const hasNotes = a.sessionNotes || (a.soapNotes && (a.soapNotes.subjective || a.soapNotes.objective));

                return (
                  <div
                    key={a._id}
                    className="list-item"
                    style={{
                      padding: '1rem',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--r-lg)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div className="list-item-accent" style={{ background: deptColor }} />
                    <div className="list-item-body">
                      <div className="flex items-center gap-2">
                        <span
                          className="list-item-title text-base"
                          style={{ cursor: 'pointer', color: 'var(--primary)' }}
                          onClick={() => handleOpenPatientDossier(a.patient)}
                          title="Click to view child's clinical dossier"
                        >
                          {a.patient?.name}
                        </span>
                        <span
                          className="dept-chip"
                          style={{ background: `${deptColor}15`, color: deptColor }}
                        >
                          {getDeptLabel(a.department)}
                        </span>
                      </div>

                      <div className="list-item-sub mt-1">
                        <strong>⏰ {a.timeSlot}</strong>
                        {a.parentVisible && (
                          <span className="text-emerald-600 ml-2 font-semibold">
                            • 👨‍👩‍👧 Shared with parent
                          </span>
                        )}
                      </div>

                      {/* Brief note snippet preview */}
                      {hasNotes && (
                        <div
                          className="text-xs text-muted mt-2 p-2"
                          style={{
                            background: 'var(--surface-2)',
                            borderRadius: 'var(--r-sm)',
                            maxWidth: '480px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          📝 {a.soapNotes?.assessment || a.sessionNotes}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="badge"
                        style={{
                          background: `${APPOINTMENT_STATUSES[a.status]?.color}15`,
                          color: APPOINTMENT_STATUSES[a.status]?.color,
                          borderColor: `${APPOINTMENT_STATUSES[a.status]?.color}33`,
                        }}
                      >
                        {APPOINTMENT_STATUSES[a.status]?.label}
                      </span>

                      {/* Quick Complete Button if still scheduled */}
                      {a.status === 'scheduled' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem', color: 'var(--emerald)' }}
                          onClick={(e) => handleQuickComplete(a, e)}
                          title="Mark as completed"
                        >
                          ✓ Complete
                        </button>
                      )}

                      {/* SOAP Notes Button */}
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                        onClick={() => setSelectedApptForNotes(a)}
                      >
                        {hasNotes ? '📝 Edit Notes' : '✍️ Add Notes'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Assigned Patients Quick Panel */}
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <div>
              <h2 className="section-title">My Active Caseload</h2>
              <div className="text-xs text-muted mt-1">Children currently in therapy</div>
            </div>
            <Link to="/dashboard/patients" className="btn btn-ghost btn-sm">
              All Dossiers →
            </Link>
          </div>

          {myPatients.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👶</div>
              <div className="empty-title">No Assigned Patients</div>
              <div className="empty-desc">Patients registered by reception will appear here.</div>
            </div>
          ) : (
            <div className="flex" style={{ flexDirection: 'column', gap: '0.75rem' }}>
              {myPatients.map((p) => (
                <div
                  key={p._id}
                  className="list-item"
                  style={{
                    padding: '0.85rem',
                    cursor: 'pointer',
                    borderRadius: 'var(--r-md)',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => handleOpenPatientDossier(p)}
                >
                  <div
                    className="user-avatar-lg"
                    style={{
                      width: 40,
                      height: 40,
                      background: 'var(--surface-3)',
                      color: 'var(--primary)',
                      fontSize: '1rem',
                    }}
                  >
                    {p.gender === 'female' ? '👧' : '👦'}
                  </div>
                  <div className="list-item-body">
                    <div className="list-item-title flex items-center justify-between">
                      <span>{p.name}</span>
                      <span className="text-xs text-muted font-normal">Age {p.age}</span>
                    </div>
                    {p.diagnosis && (
                      <div className="text-xs text-secondary mt-1 font-medium">
                        {p.diagnosis}
                      </div>
                    )}
                    <div className="flex" style={{ flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.4rem' }}>
                      {p.enrolledDepartments?.map(d => (
                        <span
                          key={d}
                          className="dept-chip"
                          style={{
                            background: `${getDeptColor(d)}15`,
                            color: getDeptColor(d),
                            fontSize: '0.675rem',
                            padding: '0.15rem 0.45rem',
                          }}
                        >
                          {getDeptLabel(d).split(' ')[0]}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '0.25rem 0.5rem', color: 'var(--primary)', fontSize: '0.75rem' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenPatientDossier(p);
                    }}
                  >
                    Dossier →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TherapistDashboard;
