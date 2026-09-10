import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { useAuth } from '../../../context/AuthContext';
import { patientsApi } from '../../../api/patients';
import { appointmentsApi } from '../../../api/appointments';
import { usersApi } from '../../../api/users';
import { getDeptLabel, getDeptColor, DEPARTMENTS, PATIENT_STATUSES, TIME_SLOTS } from '../../../utils/constants';
import RegisterPatientModal from './RegisterPatientModal';

const AdminPatients = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, discharged: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedPatientForDetail, setSelectedPatientForDetail] = useState(null);
  const [bookingPatient, setBookingPatient] = useState(null);

  // Booking form state
  const [therapists, setTherapists] = useState([]);
  const [bookingDept, setBookingDept] = useState('');
  const [bookingTherapist, setBookingTherapist] = useState('');
  const [bookingDate, setBookingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [bookingSlot, setBookingSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');

  const loadPatients = async () => {
    try {
      const [patientsRes, statsRes] = await Promise.all([
        patientsApi.getAll({
          search: search || undefined,
          department: departmentFilter || undefined,
          category: categoryFilter || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
        }),
        patientsApi.getStats(),
      ]);
      setPatients(patientsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to load patient registry', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [departmentFilter, categoryFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPatients();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load therapists for booking
  useEffect(() => {
    const fetchTherapists = async () => {
      if (!user?.branch?._id) return;
      try {
        const res = await usersApi.getTherapists({ branch: user.branch._id });
        setTherapists(res.data);
      } catch (err) {
        console.error('Failed to fetch therapists for scheduling', err);
      }
    };
    fetchTherapists();
  }, [user?.branch?._id]);

  // Open booking modal
  const handleOpenBooking = (patient) => {
    setBookingPatient(patient);
    const defaultDept = patient.enrolledDepartments?.[0] || 'pediatric_ot';
    setBookingDept(defaultDept);

    // Pick first assigned therapist that supports this department, or any therapist
    const matching = patient.assignedTherapists?.find(t => t.departments?.includes(defaultDept))
      || therapists.find(t => t.departments?.includes(defaultDept))
      || therapists[0];
    setBookingTherapist(matching?._id || '');
    setBookingError('');
  };

  // Fetch available slots when therapist or date changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (!bookingTherapist || !bookingDate) return;
      try {
        const res = await appointmentsApi.getAvailableSlots({
          therapist: bookingTherapist,
          date: bookingDate,
        });
        const avail = res.data.available || [];
        setAvailableSlots(avail);
        if (avail.length > 0) setBookingSlot(avail[0]);
      } catch (err) {
        console.error('Failed to fetch available slots', err);
        setAvailableSlots(TIME_SLOTS);
      }
    };
    if (bookingPatient) fetchSlots();
  }, [bookingTherapist, bookingDate, bookingPatient]);

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    if (!bookingPatient || !bookingTherapist || !bookingDate || !bookingSlot) {
      setBookingError('Please fill in all scheduling fields');
      return;
    }
    setBookingSubmitting(true);
    setBookingError('');
    try {
      await appointmentsApi.create({
        patient: bookingPatient._id,
        therapist: bookingTherapist,
        department: bookingDept,
        date: bookingDate,
        timeSlot: bookingSlot,
      });
      setBookingPatient(null);
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Failed to schedule appointment');
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleStatusChange = async (patientId, newStatus) => {
    try {
      await patientsApi.update(patientId, { status: newStatus });
      await loadPatients();
    } catch (err) {
      console.error('Failed to update patient status', err);
    }
  };

  return (
    <DashboardLayout>
      {/* Register Patient Modal */}
      {showRegisterModal && (
        <RegisterPatientModal
          branchId={user?.branch?._id}
          onClose={() => setShowRegisterModal(false)}
          onRegistered={() => {
            loadPatients();
          }}
        />
      )}

      {/* Patient Detail Modal */}
      {selectedPatientForDetail && (
        <div className="modal-overlay" onClick={() => setSelectedPatientForDetail(null)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div
                  className="user-avatar-lg"
                  style={{ width: 44, height: 44, fontSize: '1.25rem', background: 'var(--surface-3)', color: 'var(--primary)' }}
                >
                  {selectedPatientForDetail.gender === 'female' ? '👧' : '👦'}
                </div>
                <div>
                  <h3 className="modal-title" style={{ margin: 0 }}>{selectedPatientForDetail.name}</h3>
                  <div className="text-xs text-muted">
                    Age {selectedPatientForDetail.age} • {selectedPatientForDetail.gender} • Registered by Reception
                  </div>
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelectedPatientForDetail(null)}>✕</button>
            </div>

            <div className="flex" style={{ flexDirection: 'column', gap: '1.25rem' }}>
              {/* Diagnosis & Departments */}
              <div className="card-compact" style={{ background: 'var(--surface-2)' }}>
                <div className="text-xs text-muted mb-1 font-semibold">Primary Diagnosis:</div>
                <div className="font-bold text-primary mb-3 text-sm">
                  {selectedPatientForDetail.diagnosis || 'None specified'}
                </div>

                <div className="text-xs text-muted mb-1 font-semibold">Enrolled Care Departments:</div>
                <div className="flex gap-1 flex-wrap mb-2">
                  {selectedPatientForDetail.enrolledDepartments?.map(d => (
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

              {/* Parent & Contact */}
              <div className="card-compact" style={{ background: 'var(--surface-2)' }}>
                <h4 className="font-semibold text-sm mb-2">Parent / Primary Guardian</h4>
                <div className="grid-2" style={{ gap: '0.75rem', fontSize: '0.825rem' }}>
                  <div>
                    <span className="text-muted">Parent Name:</span>
                    <div className="font-semibold">{selectedPatientForDetail.parentDetails?.name || 'Not provided'}</div>
                  </div>
                  <div>
                    <span className="text-muted">Relationship:</span>
                    <div className="font-semibold">{selectedPatientForDetail.parentDetails?.relationship || 'Parent'}</div>
                  </div>
                  <div>
                    <span className="text-muted">Contact Phone:</span>
                    <div className="font-semibold">{selectedPatientForDetail.parentDetails?.phone || 'Not provided'}</div>
                  </div>
                  <div>
                    <span className="text-muted">Email Address:</span>
                    <div className="font-semibold">{selectedPatientForDetail.parentDetails?.email || 'Not provided'}</div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span className="text-muted">Residential Address:</span>
                    <div className="font-semibold">{selectedPatientForDetail.parentDetails?.address || 'Not provided'}</div>
                  </div>
                </div>
              </div>

              {/* Medical Notes */}
              {selectedPatientForDetail.medicalNotes && (
                <div className="card-compact" style={{ background: 'var(--surface-2)' }}>
                  <h4 className="font-semibold text-sm mb-1">Intake Medical Notes</h4>
                  <div className="text-xs text-secondary" style={{ whiteSpace: 'pre-line' }}>
                    {selectedPatientForDetail.medicalNotes}
                  </div>
                </div>
              )}

              {/* Care Team */}
              {selectedPatientForDetail.assignedTherapists?.length > 0 && (
                <div className="card-compact" style={{ background: 'var(--surface-2)' }}>
                  <h4 className="font-semibold text-sm mb-2">Assigned Therapists</h4>
                  <div className="flex gap-2 flex-wrap">
                    {selectedPatientForDetail.assignedTherapists.map(t => (
                      <div key={t._id} className="badge" style={{ background: 'var(--surface)', padding: '0.4rem 0.75rem', border: '1px solid var(--border)' }}>
                        🩺 {t.name} ({t.departments?.map(d => getDeptLabel(d).split(' ')[0]).join(', ')})
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    const p = selectedPatientForDetail;
                    setSelectedPatientForDetail(null);
                    handleOpenBooking(p);
                  }}
                >
                  🗓️ Schedule Session for {selectedPatientForDetail.name}
                </button>
                <button className="btn btn-secondary" onClick={() => setSelectedPatientForDetail(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Booking Modal */}
      {bookingPatient && (
        <div className="modal-overlay" onClick={() => setBookingPatient(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Book Session for {bookingPatient.name}</h3>
                <div className="text-xs text-muted mt-1">Select therapist, date, and 45-minute clinic slot</div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setBookingPatient(null)}>✕</button>
            </div>

            {bookingError && (
              <div className="card-compact mb-3" style={{ background: 'var(--error-bg)', color: 'var(--error)', border: '1px solid #fecaca' }}>
                ⚠️ {bookingError}
              </div>
            )}

            <form onSubmit={handleCreateAppointment} className="flex" style={{ flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label font-semibold">Therapy Department</label>
                <select
                  className="select"
                  value={bookingDept}
                  onChange={(e) => setBookingDept(e.target.value)}
                  required
                >
                  {bookingPatient.enrolledDepartments?.map(d => (
                    <option key={d} value={d}>{getDeptLabel(d)}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label font-semibold">Select Therapist</label>
                <select
                  className="select"
                  value={bookingTherapist}
                  onChange={(e) => setBookingTherapist(e.target.value)}
                  required
                >
                  {therapists.map(t => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.departments?.map(d => getDeptLabel(d).split(' ')[0]).join(', ')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label font-semibold">Session Date</label>
                <input
                  type="date"
                  className="input"
                  value={bookingDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setBookingDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label font-semibold">Available Time Slots</label>
                {availableSlots.length === 0 ? (
                  <div className="text-xs text-secondary p-2 card-compact" style={{ background: 'var(--surface-2)' }}>
                    No slots available on this date for the selected therapist.
                  </div>
                ) : (
                  <div className="grid-3" style={{ gap: '0.4rem', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
                    {availableSlots.map(slot => (
                      <button
                        key={slot}
                        type="button"
                        className={`btn btn-sm ${bookingSlot === slot ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.75rem', padding: '0.4rem 0.25rem' }}
                        onClick={() => setBookingSlot(slot)}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-3 mt-2" style={{ borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setBookingPatient(null)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={bookingSubmitting || availableSlots.length === 0}
                >
                  {bookingSubmitting ? 'Booking...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Patient Registry &amp; Intake</h1>
          <p className="page-subtitle">
            Manage patient records, registrations, and therapy enrollments for {user?.branch?.name || 'Clinic'}.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowRegisterModal(true)}
        >
          + Register New Child
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div className="stats-grid mb-4">
        {[
          { label: 'Total Registrations', value: stats.total, color: 'var(--primary)', icon: '📋' },
          { label: 'Active In Therapy', value: stats.active, color: 'var(--emerald)', icon: '👶' },
          { label: 'Discharged / Completed', value: stats.discharged, color: 'var(--text-muted)', icon: '🎓' },
          { label: 'Enrolled Specialties', value: DEPARTMENTS.length, color: 'var(--violet)', icon: '🩺' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ '--stat-color': s.color }}>
            <div className="stat-card-top">
              <div className="stat-icon" style={{ background: `${s.color}22`, color: s.color }}>
                {s.icon}
              </div>
            </div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="card mb-4" style={{ padding: '1rem' }}>
        <div className="flex gap-3 flex-wrap items-center">
          <div className="flex-1" style={{ minWidth: 260 }}>
            <input
              type="text"
              className="input"
              placeholder="🔍 Search child name, parent name, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ minWidth: 160 }}>
            <select
              className="select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Programs (School & Clinic)</option>
              <option value="school">🎒 Special School</option>
              <option value="clinic">🩺 Therapy Clinic</option>
            </select>
          </div>

          <div style={{ minWidth: 200 }}>
            <select
              className="select"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="">All Care Departments</option>
              {DEPARTMENTS.map(d => (
                <option key={d.key} value={d.key}>{d.label}</option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: 140 }}>
            <select
              className="select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="discharged">Discharged</option>
              <option value="all">All Statuses</option>
            </select>
          </div>
        </div>
      </div>

      {/* Patients Table */}
      <div className="card">
        <div className="card-header flex justify-between items-center">
          <h2 className="section-title">Enrolled Students &amp; Patients ({patients.length})</h2>
          <span className="text-xs text-muted">Showing records for {user?.branch?.code || 'Branch'}</span>
        </div>

        {loading ? (
          <div className="loading-screen" style={{ minHeight: 200 }}>
            <div className="spinner"></div>
            <p className="mt-2">Loading student directory...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👶</div>
            <div className="empty-title">No Students/Patients Found</div>
            <div className="empty-desc">
              {search || departmentFilter || categoryFilter ? 'No records matched your search filters.' : 'Click "+ Register New Child" to add the first student.'}
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student / Child</th>
                  <th>Program / School</th>
                  <th>Primary Diagnosis</th>
                  <th>Enrolled Therapies</th>
                  <th>Parent / Contact</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div
                          className="user-avatar"
                          style={{ background: 'var(--surface-3)', color: 'var(--primary)', fontSize: '0.9rem' }}
                        >
                          {p.gender === 'female' ? '👧' : '👦'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className="font-bold text-primary"
                              style={{ cursor: 'pointer' }}
                              onClick={() => setSelectedPatientForDetail(p)}
                            >
                              {p.name}
                            </span>
                            {p.studentId && (
                              <span
                                className="badge"
                                style={{
                                  background: 'var(--surface-3)',
                                  color: 'var(--text-secondary)',
                                  fontSize: '0.65rem',
                                  padding: '0.1rem 0.4rem',
                                  fontFamily: 'monospace',
                                  letterSpacing: '0.03em',
                                }}
                              >
                                {p.studentId}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted">
                            Age {p.age} • {p.gender}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-1 flex-wrap">
                          {p.categories?.includes('school') && (
                            <span className="badge badge-sm" style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.7rem' }}>
                              🎒 School
                            </span>
                          )}
                          {p.categories?.includes('clinic') && (
                            <span className="badge badge-sm" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.7rem' }}>
                              🩺 Clinic
                            </span>
                          )}
                        </div>
                        {p.schoolDetails?.grade && (
                          <span className="text-xs text-secondary font-medium">
                            {p.schoolDetails.grade} {p.schoolDetails.section ? `(${p.schoolDetails.section})` : ''}
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      {p.diagnosis ? (
                        <span className="badge" style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                          {p.diagnosis}
                        </span>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>

                    <td>
                      <div className="flex gap-1 flex-wrap" style={{ maxWidth: 220 }}>
                        {p.enrolledDepartments?.map(d => (
                          <span
                            key={d}
                            className="dept-chip"
                            style={{ background: `${getDeptColor(d)}15`, color: getDeptColor(d) }}
                          >
                            {getDeptLabel(d).split(' ')[0]}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td>
                      <div className="text-xs">
                        <strong>{p.parentDetails?.name || '—'}</strong>
                        {p.parentDetails?.phone && (
                          <div className="text-muted mt-0.5">📞 {p.parentDetails.phone}</div>
                        )}
                      </div>
                    </td>

                    <td>
                      <select
                        className="select"
                        value={p.status}
                        onChange={(e) => handleStatusChange(p._id, e.target.value)}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.2rem 0.5rem',
                          fontWeight: 700,
                          color: PATIENT_STATUSES[p.status]?.color || 'var(--text-primary)',
                        }}
                      >
                        <option value="active">Active</option>
                        <option value="on_hold">On Hold</option>
                        <option value="discharged">Discharged</option>
                      </select>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div className="flex justify-end items-center gap-1">
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '0.3rem 0.5rem' }}
                          onClick={() => setSelectedPatientForDetail(p)}
                          title="View Full Profile"
                        >
                          👁️ View
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={() => handleOpenBooking(p)}
                        >
                          🗓️ Book
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminPatients;
