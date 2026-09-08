import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { useAuth } from '../../../context/AuthContext';
import { appointmentsApi } from '../../../api/appointments';
import { usersApi } from '../../../api/users';
import { patientsApi } from '../../../api/patients';
import {
  TIME_SLOTS,
  DEPARTMENTS,
  getDeptLabel,
  getDeptColor,
  APPOINTMENT_STATUSES,
} from '../../../utils/constants';

const AdminSchedule = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [therapistFilter, setTherapistFilter] = useState('');

  // Modals
  const [bookingSlotData, setBookingSlotData] = useState(null); // { therapistId, timeSlot }
  const [selectedAppointment, setSelectedAppointment] = useState(null); // For details / status update

  // Booking form inside modal
  const [newPatientId, setNewPatientId] = useState('');
  const [newDept, setNewDept] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const [apptsRes, therapistsRes, patientsRes] = await Promise.all([
        appointmentsApi.getAll({
          date: selectedDate,
          department: departmentFilter || undefined,
          therapist: therapistFilter || undefined,
        }),
        usersApi.getTherapists({ branch: user?.branch?._id }),
        patientsApi.getAll({ status: 'active' }),
      ]);
      setAppointments(apptsRes.data);
      setTherapists(therapistsRes.data);
      setPatients(patientsRes.data);
    } catch (err) {
      console.error('Failed to load schedule data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, [selectedDate, departmentFilter, therapistFilter]);

  const handleDateShift = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleSetToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const handleOpenBookSlot = (therapist, slot) => {
    const defaultDept = therapist.departments?.[0] || 'pediatric_ot';
    setBookingSlotData({
      therapistId: therapist._id,
      therapistName: therapist.name,
      timeSlot: slot,
    });
    setNewDept(defaultDept);
    setNewPatientId(patients[0]?._id || '');
    setBookingError('');
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    if (!newPatientId || !bookingSlotData) return;

    setBookingSubmitting(true);
    setBookingError('');

    try {
      await appointmentsApi.create({
        patient: newPatientId,
        therapist: bookingSlotData.therapistId,
        department: newDept,
        date: selectedDate,
        timeSlot: bookingSlotData.timeSlot,
      });
      setBookingSlotData(null);
      await loadSchedule();
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Failed to book slot');
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    try {
      await appointmentsApi.update(appointmentId, { status: newStatus });
      setSelectedAppointment(null);
      await loadSchedule();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  // Filter therapists shown
  const visibleTherapists = therapists.filter(t => {
    if (therapistFilter && t._id !== therapistFilter) return false;
    if (departmentFilter && !t.departments?.includes(departmentFilter)) return false;
    return true;
  });

  return (
    <DashboardLayout>
      {/* Book Slot Modal */}
      {bookingSlotData && (
        <div className="modal-overlay" onClick={() => setBookingSlotData(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Book Session Slot</h3>
                <div className="text-xs text-muted mt-1">
                  Dr. {bookingSlotData.therapistName} • {bookingSlotData.timeSlot} • {selectedDate}
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setBookingSlotData(null)}>✕</button>
            </div>

            {bookingError && (
              <div className="card-compact mb-3" style={{ background: 'var(--error-bg)', color: 'var(--error)', border: '1px solid #fecaca' }}>
                ⚠️ {bookingError}
              </div>
            )}

            <form onSubmit={handleCreateAppointment} className="flex" style={{ flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label font-semibold">Select Patient *</label>
                <select
                  className="select"
                  value={newPatientId}
                  onChange={(e) => setNewPatientId(e.target.value)}
                  required
                >
                  {patients.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.name} (Age {p.age})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label font-semibold">Therapy Department *</label>
                <select
                  className="select"
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  required
                >
                  {DEPARTMENTS.map(d => (
                    <option key={d.key} value={d.key}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-between items-center pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setBookingSlotData(null)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={bookingSubmitting || patients.length === 0}
                >
                  {bookingSubmitting ? 'Booking...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Appointment Detail & Status Modal */}
      {selectedAppointment && (
        <div className="modal-overlay" onClick={() => setSelectedAppointment(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Session Details</h3>
                <div className="text-xs text-muted mt-1">
                  {selectedAppointment.timeSlot} • {new Date(selectedAppointment.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelectedAppointment(null)}>✕</button>
            </div>

            <div className="flex" style={{ flexDirection: 'column', gap: '1rem' }}>
              <div className="card-compact" style={{ background: 'var(--surface-2)' }}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold text-base text-primary">{selectedAppointment.patient?.name}</div>
                    <div className="text-xs text-muted">Gender: {selectedAppointment.patient?.gender}</div>
                  </div>
                  <span
                    className="dept-chip"
                    style={{
                      background: `${getDeptColor(selectedAppointment.department)}18`,
                      color: getDeptColor(selectedAppointment.department),
                    }}
                  >
                    {getDeptLabel(selectedAppointment.department)}
                  </span>
                </div>

                <div className="text-xs text-secondary mt-1">
                  Therapist: <strong>{selectedAppointment.therapist?.name}</strong>
                </div>
                {selectedAppointment.sessionNotes && (
                  <div className="text-xs text-muted mt-2 p-2" style={{ background: 'var(--surface)', borderRadius: 'var(--r-sm)' }}>
                    📝 {selectedAppointment.sessionNotes}
                  </div>
                )}
              </div>

              {/* Status Updater */}
              <div className="form-group">
                <label className="form-label font-semibold">Change Appointment Status</label>
                <div className="flex gap-2 flex-wrap">
                  {['scheduled', 'completed', 'no_show', 'cancelled'].map(st => (
                    <button
                      key={st}
                      className={`btn btn-sm ${selectedAppointment.status === st ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.75rem' }}
                      onClick={() => handleUpdateStatus(selectedAppointment._id, st)}
                    >
                      {APPOINTMENT_STATUSES[st]?.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                <button className="btn btn-secondary" onClick={() => setSelectedAppointment(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Multi-Therapist Calendar Dispatch</h1>
          <p className="page-subtitle">
            Live schedule grid, session dispatch, and double-booking protection for {user?.branch?.name || 'Clinic'}.
          </p>
        </div>

        {/* Date Navigator Controls */}
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => handleDateShift(-1)}>
            ◀ Prev Day
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleSetToday}>
            Today
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => handleDateShift(1)}>
            Next Day ▶
          </button>
          <input
            type="date"
            className="input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ width: 140, padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card mb-4" style={{ padding: '0.85rem 1rem' }}>
        <div className="flex gap-3 flex-wrap items-center">
          <div className="text-xs font-bold text-muted uppercase">Filters:</div>

          {/* Department Filter */}
          <div style={{ minWidth: 200 }}>
            <select
              className="select"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
            >
              <option value="">All Specialties</option>
              {DEPARTMENTS.map(d => (
                <option key={d.key} value={d.key}>{d.label}</option>
              ))}
            </select>
          </div>

          {/* Therapist Filter */}
          <div style={{ minWidth: 200 }}>
            <select
              className="select"
              value={therapistFilter}
              onChange={(e) => setTherapistFilter(e.target.value)}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
            >
              <option value="">All Branch Therapists</option>
              {therapists.map(t => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="text-xs text-muted ml-auto">
            Booked Sessions on this date: <strong className="text-primary">{appointments.length}</strong>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-screen" style={{ minHeight: 300 }}>
            <div className="spinner"></div>
            <p className="mt-2">Loading calendar dispatch grid...</p>
          </div>
        ) : visibleTherapists.length === 0 ? (
          <div className="empty-state" style={{ padding: '3rem 1rem' }}>
            <div className="empty-icon">👥</div>
            <div className="empty-title">No Therapists Match Filter</div>
            <div className="empty-desc">Adjust your department or therapist filter above.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: 800, borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr style={{ background: 'var(--surface-2)', borderBottom: '2px solid var(--border)' }}>
                  <th style={{ width: 140, padding: '0.75rem', position: 'sticky', left: 0, background: 'var(--surface-2)', zIndex: 2 }}>
                    Time Slot
                  </th>
                  {visibleTherapists.map(t => (
                    <th key={t._id} style={{ minWidth: 200, padding: '0.75rem', textAlign: 'left' }}>
                      <div className="font-bold text-primary">{t.name}</div>
                      <div className="text-xs text-muted font-normal">
                        {t.departments?.map(d => getDeptLabel(d).split(' ')[0]).join(', ')}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map(slot => (
                  <tr key={slot} style={{ borderBottom: '1px solid var(--border)' }}>
                    {/* Time slot header */}
                    <td
                      style={{
                        padding: '0.6rem 0.75rem',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        background: 'var(--surface)',
                        position: 'sticky',
                        left: 0,
                        borderRight: '1px solid var(--border)',
                        zIndex: 1,
                      }}
                    >
                      ⏰ {slot}
                    </td>

                    {/* Therapist Cells */}
                    {visibleTherapists.map(t => {
                      const appt = appointments.find(
                        a => a.therapist?._id === t._id && a.timeSlot === slot
                      );

                      if (appt) {
                        const deptColor = getDeptColor(appt.department);
                        return (
                          <td
                            key={t._id}
                            style={{
                              padding: '0.4rem',
                              background: `${deptColor}08`,
                              borderRight: '1px solid var(--border)',
                            }}
                          >
                            <div
                              onClick={() => setSelectedAppointment(appt)}
                              className="p-2 card-compact"
                              style={{
                                cursor: 'pointer',
                                background: 'var(--surface)',
                                borderLeft: `3px solid ${deptColor}`,
                                boxShadow: 'var(--shadow-xs)',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <div className="flex justify-between items-center">
                                <strong className="text-xs text-primary">{appt.patient?.name}</strong>
                                <span
                                  className="badge"
                                  style={{
                                    fontSize: '0.65rem',
                                    padding: '0.1rem 0.35rem',
                                    background: `${APPOINTMENT_STATUSES[appt.status]?.color}15`,
                                    color: APPOINTMENT_STATUSES[appt.status]?.color,
                                  }}
                                >
                                  {APPOINTMENT_STATUSES[appt.status]?.label}
                                </span>
                              </div>
                              <div className="text-xs text-muted mt-1">
                                {getDeptLabel(appt.department)}
                              </div>
                            </div>
                          </td>
                        );
                      }

                      // Open Slot
                      return (
                        <td
                          key={t._id}
                          style={{
                            padding: '0.4rem',
                            borderRight: '1px solid var(--border)',
                            verticalAlign: 'middle',
                          }}
                        >
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{
                              width: '100%',
                              border: '1px dashed var(--border)',
                              fontSize: '0.725rem',
                              color: 'var(--text-muted)',
                              padding: '0.35rem',
                            }}
                            onClick={() => handleOpenBookSlot(t, slot)}
                          >
                            + Book Slot
                          </button>
                        </td>
                      );
                    })}
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

export default AdminSchedule;
