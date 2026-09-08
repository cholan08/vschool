import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { useAuth } from '../../../context/AuthContext';
import { patientsApi } from '../../../api/patients';
import { appointmentsApi } from '../../../api/appointments';
import { getDeptLabel, getDeptColor, PATIENT_STATUSES } from '../../../utils/constants';
import PatientDossierDrawer from './PatientDossierDrawer';
import ScheduleSessionModal from './ScheduleSessionModal';
import SessionNotesModal from './SessionNotesModal';

const TherapistPatients = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');

  // Modals / Drawers
  const [selectedPatientForDossier, setSelectedPatientForDossier] = useState(null);
  const [schedulingPatient, setSchedulingPatient] = useState(null);
  const [editingAppointment, setEditingAppointment] = useState(null);

  const loadPatients = async () => {
    try {
      const res = await patientsApi.getAll({
        search: search || undefined,
        department: departmentFilter || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setPatients(res.data);
    } catch (err) {
      console.error('Failed to load therapist patients', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [departmentFilter, statusFilter]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPatients();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSaveNotes = async (id, data) => {
    await appointmentsApi.addNotes(id, data);
    // Reload patient dossier if open
    if (selectedPatientForDossier) {
      const updatedP = await patientsApi.getOne(selectedPatientForDossier._id);
      setSelectedPatientForDossier(updatedP.data);
    }
  };

  return (
    <DashboardLayout>
      {/* Patient Dossier Drawer */}
      {selectedPatientForDossier && (
        <PatientDossierDrawer
          patient={selectedPatientForDossier}
          onClose={() => setSelectedPatientForDossier(null)}
          onScheduleSession={(p) => setSchedulingPatient(p)}
          onEditNotes={(appt) => setEditingAppointment(appt)}
        />
      )}

      {/* Schedule Follow-up Session Modal */}
      {schedulingPatient && (
        <ScheduleSessionModal
          patients={patients}
          therapist={user}
          onClose={() => setSchedulingPatient(null)}
          onScheduled={() => {
            loadPatients();
          }}
        />
      )}

      {/* Edit Session Notes Modal (when triggered from dossier) */}
      {editingAppointment && (
        <SessionNotesModal
          appointment={editingAppointment}
          onClose={() => setEditingAppointment(null)}
          onSave={handleSaveNotes}
        />
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Patient Caseload &amp; Dossiers</h1>
          <p className="page-subtitle">
            Clinical profiles, medical backgrounds, and therapy progress for your assigned children.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setSchedulingPatient(patients[0] || true)}
          disabled={patients.length === 0}
        >
          + Schedule New Session
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card mb-4" style={{ padding: '1rem' }}>
        <div className="flex gap-3 flex-wrap items-center">
          {/* Search */}
          <div className="flex-1" style={{ minWidth: 240 }}>
            <input
              type="text"
              className="input"
              placeholder="🔍 Search child by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Department filter */}
          <div style={{ minWidth: 180 }}>
            <select
              className="select"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="">All My Specialties</option>
              {user?.departments?.map(d => (
                <option key={d} value={d}>
                  {getDeptLabel(d)}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div style={{ minWidth: 140 }}>
            <select
              className="select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="active">Active Patients</option>
              <option value="discharged">Discharged</option>
              <option value="all">All Statuses</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading-screen">
          <div className="spinner spinner-lg"></div>
          <p className="mt-2">Loading patient roster...</p>
        </div>
      ) : patients.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">👶</div>
            <div className="empty-title">No Patients Found</div>
            <div className="empty-desc">
              {search || departmentFilter
                ? 'No assigned children match your current search or filter criteria.'
                : 'You currently have no children assigned to your clinical caseload.'}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid-3" style={{ gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {patients.map((p) => (
            <div
              key={p._id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Card top accent line based on primary dept */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  background: getDeptColor(p.enrolledDepartments?.[0]),
                }}
              />

              <div>
                {/* Child Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="user-avatar-lg"
                      style={{
                        width: 48,
                        height: 48,
                        fontSize: '1.35rem',
                        background: 'var(--surface-3)',
                        color: 'var(--primary)',
                      }}
                    >
                      {p.gender === 'female' ? '👧' : '👦'}
                    </div>
                    <div>
                      <div className="font-bold text-base text-primary">{p.name}</div>
                      <div className="text-xs text-muted">
                        Age {p.age} • {p.gender}
                      </div>
                    </div>
                  </div>

                  <span
                    className="badge"
                    style={{
                      background: `${PATIENT_STATUSES[p.status]?.color}15`,
                      color: PATIENT_STATUSES[p.status]?.color,
                    }}
                  >
                    {PATIENT_STATUSES[p.status]?.label}
                  </span>
                </div>

                {/* Diagnosis */}
                {p.diagnosis && (
                  <div
                    className="card-compact mb-3"
                    style={{ background: 'var(--surface-2)', padding: '0.5rem 0.75rem', fontSize: '0.775rem' }}
                  >
                    <span className="text-muted">Diagnosis: </span>
                    <strong className="text-secondary">{p.diagnosis}</strong>
                  </div>
                )}

                {/* Enrolled Departments */}
                <div className="mb-3">
                  <div className="text-xs text-muted mb-1 font-semibold">Enrolled Care:</div>
                  <div className="flex gap-1 flex-wrap">
                    {p.enrolledDepartments?.map(d => (
                      <span
                        key={d}
                        className="dept-chip"
                        style={{ background: `${getDeptColor(d)}15`, color: getDeptColor(d) }}
                      >
                        {getDeptLabel(d)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Parent Contact */}
                {p.parentDetails?.name && (
                  <div className="text-xs text-muted mb-3">
                    Guardian: <strong className="text-secondary">{p.parentDetails.name}</strong>
                    {p.parentDetails.phone && ` • 📞 ${p.parentDetails.phone}`}
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div
                className="flex items-center gap-2 pt-3 mt-2"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <button
                  className="btn btn-primary btn-sm flex-1"
                  onClick={() => setSelectedPatientForDossier(p)}
                >
                  📜 View Dossier
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSchedulingPatient(p)}
                  title="Schedule session for this child"
                >
                  🗓️ Book Session
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default TherapistPatients;
