import { useState, useEffect } from 'react';
import { appointmentsApi } from '../../../api/appointments';
import { getDeptLabel, TIME_SLOTS } from '../../../utils/constants';

const ScheduleSessionModal = ({ patients = [], therapist, onClose, onScheduled }) => {
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?._id || '');
  const [department, setDepartment] = useState(therapist?.departments?.[0] || '');
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch available slots when date or therapist changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (!therapist?._id || !date) return;
      setLoadingSlots(true);
      setError('');
      try {
        const res = await appointmentsApi.getAvailableSlots({
          therapist: therapist._id,
          date,
        });
        const avail = res.data.available || [];
        setAvailableSlots(avail);
        if (avail.length > 0 && !avail.includes(timeSlot)) {
          setTimeSlot(avail[0]);
        }
      } catch (err) {
        console.error('Failed to fetch available slots', err);
        // Fallback to all slots if error
        setAvailableSlots(TIME_SLOTS);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [date, therapist?._id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatientId || !timeSlot || !department) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await appointmentsApi.create({
        patient: selectedPatientId,
        department,
        date,
        timeSlot,
      });
      if (onScheduled) onScheduled();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule appointment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Schedule Therapy Session</h3>
            <div className="text-xs text-muted mt-1">Book follow-up or ad-hoc session</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div className="card-compact mb-3" style={{ background: 'var(--error-bg)', color: 'var(--error)', border: '1px solid #fecaca' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex" style={{ flexDirection: 'column', gap: '1rem' }}>
          {/* Patient Selection */}
          <div className="form-group">
            <label className="form-label font-semibold">Patient</label>
            <select
              className="select"
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              required
            >
              {patients.length === 0 ? (
                <option value="">No patients available</option>
              ) : (
                patients.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.name} (Age {p.age})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Department Selection */}
          <div className="form-group">
            <label className="form-label font-semibold">Department / Therapy Type</label>
            <select
              className="select"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
            >
              {therapist?.departments?.map(d => (
                <option key={d} value={d}>
                  {getDeptLabel(d)}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="form-group">
            <label className="form-label font-semibold">Session Date</label>
            <input
              type="date"
              className="input"
              value={date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Time Slot Selection */}
          <div className="form-group">
            <label className="form-label font-semibold flex justify-between">
              <span>Time Slot (45 min)</span>
              {loadingSlots && <span className="text-xs text-muted">Checking schedule...</span>}
            </label>
            {availableSlots.length === 0 ? (
              <div className="text-xs text-secondary p-2 card-compact" style={{ background: 'var(--surface-2)' }}>
                No slots available on this date. Please pick another date.
              </div>
            ) : (
              <div className="grid-3" style={{ gap: '0.4rem', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
                {availableSlots.map(slot => (
                  <button
                    key={slot}
                    type="button"
                    className={`btn btn-sm ${timeSlot === slot ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.75rem', padding: '0.4rem 0.25rem', textAlign: 'center' }}
                    onClick={() => setTimeSlot(slot)}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || availableSlots.length === 0}
            >
              {submitting ? 'Booking...' : 'Confirm Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleSessionModal;
