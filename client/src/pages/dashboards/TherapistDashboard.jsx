import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { patientsApi } from '../../api/patients';
import { appointmentsApi } from '../../api/appointments';
import { getDeptLabel, getDeptColor, APPOINTMENT_STATUSES } from '../../utils/constants';
import { Link } from 'react-router-dom';

const NotesModal = ({ appointment, onClose, onSave }) => {
  const [notes, setNotes] = useState(appointment.sessionNotes || '');
  const [parentVisible, setParentVisible] = useState(appointment.parentVisible || false);
  const [status, setStatus] = useState(appointment.status);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(appointment._id, { sessionNotes: notes, parentVisible, status });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Clinical Session Notes</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="mb-3 text-sm text-secondary">
          Patient: <strong className="text-primary">{appointment.patient?.name}</strong> • {appointment.timeSlot}
        </div>
        <div className="flex" style={{ flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Session Status</label>
            <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="no_show">No Show</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Therapy Notes</label>
            <textarea
              className="textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Document patient progress, interventions, and observations..."
              style={{ minHeight: 180 }}
            />
          </div>
          <label className="card-compact flex items-center gap-3" style={{ cursor: 'pointer', background: 'var(--surface-2)' }}>
            <input type="checkbox" checked={parentVisible} onChange={(e) => setParentVisible(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
            <div>
              <div className="font-semibold text-sm">Share via Parent Portal</div>
              <div className="text-xs text-muted mt-1">Make these notes visible to the patient's parents on their dashboard.</div>
            </div>
          </label>
          <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Clinical Notes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TherapistDashboard = () => {
  const { user } = useAuth();
  const [todayAppts, setTodayAppts] = useState([]);
  const [myPatients, setMyPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppt, setSelectedAppt] = useState(null);

  const load = async () => {
    try {
      const [todayRes, patientRes] = await Promise.all([
        appointmentsApi.getToday(),
        patientsApi.getAll(),
      ]);
      setTodayAppts(todayRes.data);
      setMyPatients(patientRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSaveNotes = async (id, data) => {
    await appointmentsApi.addNotes(id, data);
    await load();
  };

  if (loading) return (
    <DashboardLayout>
      <div className="loading-screen">
        <div className="spinner spinner-lg"></div>
        <p>Loading your schedule...</p>
      </div>
    </DashboardLayout>
  );

  const completed = todayAppts.filter(a => a.status === 'completed').length;
  const remaining = todayAppts.filter(a => a.status === 'scheduled').length;

  return (
    <DashboardLayout>
      {selectedAppt && (
        <NotesModal
          appointment={selectedAppt}
          onClose={() => setSelectedAppt(null)}
          onSave={handleSaveNotes}
        />
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Clinical Dashboard</h1>
          <p className="page-subtitle">
            {user?.name} • {user?.departments?.map(d => getDeptLabel(d)).join(', ')}
          </p>
        </div>
        <Link to="/dashboard/patients" className="btn btn-secondary">Patient Roster</Link>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { icon: '📅', label: "Today's Caseload", value: todayAppts.length, color: 'var(--primary)' },
          { icon: '✅', label: 'Sessions Completed', value: completed, color: 'var(--success)' },
          { icon: '⏳', label: 'Sessions Remaining', value: remaining, color: 'var(--warning)' },
          { icon: '👶', label: 'Active Patients', value: myPatients.length, color: 'var(--violet)' },
        ].map((s) => (
          <div key={s.label} className="stat-card" style={{ '--stat-color': s.color }}>
            <div className="stat-card-top">
              <div className="stat-icon" style={{ background: `${s.color}22`, color: s.color }}>{s.icon}</div>
            </div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '3fr 2fr' }}>
        {/* Today's sessions */}
        <div className="card">
          <div className="card-header">
            <h2 className="section-title">Today's Caseload</h2>
          </div>
          {todayAppts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎉</div>
              <div className="empty-title">All Caught Up</div>
              <div className="empty-desc">You have no scheduled sessions for today.</div>
            </div>
          ) : (
            <div className="flex" style={{ flexDirection: 'column', gap: '0.75rem' }}>
              {todayAppts.map((a) => (
                <div key={a._id} className="list-item">
                  <div className="list-item-accent" style={{ background: getDeptColor(a.department) }} />
                  <div className="list-item-body">
                    <div className="list-item-title">{a.patient?.name}</div>
                    <div className="list-item-sub">
                      <strong>{a.timeSlot}</strong> • {getDeptLabel(a.department)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {a.sessionNotes && (
                      <span className="badge" style={{ background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid #bbf7d0' }}>
                        ✓ Notes Saved
                      </span>
                    )}
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setSelectedAppt(a)}
                    >
                      {a.sessionNotes ? 'Edit Notes' : 'Add Notes'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My patients panel */}
        <div className="card">
          <div className="card-header">
            <h2 className="section-title">My Active Patients</h2>
          </div>
          {myPatients.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👶</div>
              <div className="empty-title">No Assigned Patients</div>
            </div>
          ) : (
            <div className="flex" style={{ flexDirection: 'column', gap: '0.75rem' }}>
              {myPatients.map((p) => (
                <div key={p._id} className="list-item" style={{ padding: '0.75rem' }}>
                  <div className="user-avatar-lg" style={{ background: 'var(--surface-3)', color: 'var(--primary)', border: '1px solid var(--border)' }}>
                    {p.name[0]}
                  </div>
                  <div className="list-item-body">
                    <div className="list-item-title">{p.name}</div>
                    <div className="text-xs text-muted mt-1">Age {p.age} • {p.gender}</div>
                    <div className="flex" style={{ flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.35rem' }}>
                      {p.enrolledDepartments?.map(d => (
                        <span key={d} className="dept-chip" style={{ background: `${getDeptColor(d)}15`, color: getDeptColor(d) }}>
                          {getDeptLabel(d).split(' ')[0]}
                        </span>
                      ))}
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

export default TherapistDashboard;
