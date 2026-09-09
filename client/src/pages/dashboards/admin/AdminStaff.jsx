import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { useAuth } from '../../../context/AuthContext';
import { usersApi } from '../../../api/users';
import { patientsApi } from '../../../api/patients';
import { DEPARTMENTS, getDeptLabel, getDeptColor, ROLES } from '../../../utils/constants';

const AdminStaff = () => {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'password123',
    role: 'therapist',
    phone: '',
    departments: ['pediatric_ot'],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    try {
      const [usersRes, patientsRes] = await Promise.all([
        usersApi.getAll({ branch: user?.branch?._id }),
        patientsApi.getAll(),
      ]);
      setStaff(usersRes.data);
      setPatients(patientsRes.data);
    } catch (err) {
      console.error('Failed to load staff data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.branch?._id]);

  const handleToggleDept = (key) => {
    setFormData((prev) => {
      const exists = prev.departments.includes(key);
      return {
        ...prev,
        departments: exists
          ? prev.departments.filter((d) => d !== key)
          : [...prev.departments, key],
      };
    });
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError('Name, email, and password are required');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      await usersApi.create({
        ...formData,
        branch: user?.branch?._id,
      });
      setSuccessMsg(`Successfully registered ${formData.name}!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setShowModal(false);
      setFormData({
        name: '',
        email: '',
        password: 'password123',
        role: 'therapist',
        phone: '',
        departments: ['pediatric_ot'],
      });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create staff account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await usersApi.toggle(userId);
      await loadData();
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  // Filtered staff list
  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
      member.name?.toLowerCase().includes(search.toLowerCase()) ||
      member.email?.toLowerCase().includes(search.toLowerCase()) ||
      member.phone?.includes(search);

    const matchesDept =
      !departmentFilter || member.departments?.includes(departmentFilter);

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && member.isActive !== false) ||
      (statusFilter === 'inactive' && member.isActive === false);

    return matchesSearch && matchesDept && matchesStatus;
  });

  // Calculate caseload for a therapist
  const getTherapistPatientCount = (therapistId) => {
    return patients.filter((p) =>
      p.assignedTherapists?.some(
        (t) => (t._id || t).toString() === therapistId.toString()
      )
    ).length;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="loading-screen">
          <div className="spinner spinner-lg"></div>
          <p>Loading staff & therapist directory...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Staffs & Therapists</h1>
          <p className="page-subtitle">
            Manage clinic specialists, workload distribution, and personnel for {user?.branch?.name}
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          <span>+ Add Staff Member</span>
        </button>
      </div>

      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
          <span>✅</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Staff KPI Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card" style={{ '--stat-color': 'var(--primary)' }}>
          <div className="stat-card-top">
            <div className="stat-icon" style={{ background: 'rgba(37,99,235,0.15)', color: 'var(--primary)' }}>
              👥
            </div>
          </div>
          <div>
            <div className="stat-value">{staff.length}</div>
            <div className="stat-label">Total Staff</div>
          </div>
        </div>

        <div className="stat-card" style={{ '--stat-color': 'var(--emerald)' }}>
          <div className="stat-card-top">
            <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--emerald)' }}>
              💊
            </div>
          </div>
          <div>
            <div className="stat-value">
              {staff.filter((s) => ['therapist', 'teacher'].includes(s.role) && s.isActive !== false).length}
            </div>
            <div className="stat-label">Active Therapists &amp; Teachers</div>
          </div>
        </div>

        <div className="stat-card" style={{ '--stat-color': 'var(--violet)' }}>
          <div className="stat-card-top">
            <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--violet)' }}>
              👶
            </div>
          </div>
          <div>
            <div className="stat-value">{patients.length}</div>
            <div className="stat-label">Total Patients Assigned</div>
          </div>
        </div>

        <div className="stat-card" style={{ '--stat-color': 'var(--amber)' }}>
          <div className="stat-card-top">
            <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--amber)' }}>
              🏥
            </div>
          </div>
          <div>
            <div className="stat-value">
              {new Set(staff.flatMap((s) => s.departments || [])).size}
            </div>
            <div className="stat-label">Active Departments</div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            alignItems: 'center',
          }}
        >
          <div className="form-group" style={{ margin: 0 }}>
            <input
              type="text"
              className="form-control"
              placeholder="🔍 Search staff by name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <select
              className="form-control"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              {DEPARTMENTS.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing <strong>{filteredStaff.length}</strong> of {staff.length} staff
          </div>
        </div>
      </div>

      {/* Staff Grid */}
      {filteredStaff.length === 0 ? (
        <div className="card empty-state" style={{ padding: '3rem 1rem' }}>
          <div className="empty-icon">👥</div>
          <div className="empty-title">No Staff Found</div>
          <div className="empty-desc">
            {search || departmentFilter || statusFilter !== 'all'
              ? 'Try changing your search filters.'
              : 'Add your first therapist or staff member to get started.'}
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {filteredStaff.map((member) => {
            const roleMeta = ROLES[member.role] || ROLES.therapist;
            const patientCount = getTherapistPatientCount(member._id);
            const isActive = member.isActive !== false;

            return (
              <div
                key={member._id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  borderTop: `4px solid ${isActive ? 'var(--primary)' : 'var(--border-strong)'}`,
                  opacity: isActive ? 1 : 0.75,
                }}
              >
                <div>
                  {/* Top row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <div
                        className="user-avatar-lg"
                        style={{
                          width: '46px',
                          height: '46px',
                          fontSize: '1.1rem',
                          background: isActive
                            ? 'linear-gradient(135deg, var(--blue-600), var(--violet))'
                            : 'var(--border-strong)',
                        }}
                      >
                        {member.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                          {member.name}
                        </h3>
                        <span
                          className="badge"
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.15rem 0.5rem',
                            marginTop: '0.2rem',
                            background: `${roleMeta.color}18`,
                            color: roleMeta.color,
                            border: `1px solid ${roleMeta.color}33`,
                          }}
                        >
                          {roleMeta.icon} {roleMeta.label}
                        </span>
                      </div>
                    </div>

                    <span
                      className="badge"
                      style={{
                        background: isActive ? 'var(--success-bg)' : 'var(--error-bg)',
                        color: isActive ? 'var(--success)' : 'var(--error)',
                        fontSize: '0.75rem',
                      }}
                    >
                      {isActive ? '● Active' : '○ Inactive'}
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div
                    style={{
                      fontSize: '0.825rem',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                      marginBottom: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ opacity: 0.6 }}>✉️</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {member.email}
                      </span>
                    </div>
                    {member.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ opacity: 0.6 }}>📞</span>
                        <span>{member.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Departments */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                        marginBottom: '0.35rem',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Departments
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {member.departments && member.departments.length > 0 ? (
                        member.departments.map((deptKey) => (
                          <span
                            key={deptKey}
                            className="badge"
                            style={{
                              fontSize: '0.725rem',
                              background: `${getDeptColor(deptKey)}15`,
                              color: getDeptColor(deptKey),
                              border: `1px solid ${getDeptColor(deptKey)}33`,
                            }}
                          >
                            {getDeptLabel(deptKey)}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          General / Operations
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom stats & action */}
                <div
                  style={{
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Caseload: <strong style={{ color: 'var(--text-primary)' }}>{patientCount}</strong> Active Patients
                  </div>

                  <button
                    className={`btn btn-sm ${isActive ? 'btn-ghost' : 'btn-secondary'}`}
                    onClick={() => handleToggleStatus(member._id)}
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                  >
                    {isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Staff Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Register New Staff / Therapist</h2>
              <button className="btn btn-ghost btn-icon" type="button" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAddStaff}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Dr. Kavita Raman"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="kavita@vschool.com"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <select
                    className="form-control"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="therapist">Therapist / Clinical Specialist</option>
                    <option value="teacher">Teacher (Special School)</option>
                    <option value="parent">Parent Liaison</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Password *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Initial password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Clinical Departments</label>
                <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Select all therapy departments this specialist delivers:
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '0.5rem',
                    maxHeight: '180px',
                    overflowY: 'auto',
                    padding: '0.5rem',
                    background: 'var(--surface-2)',
                    borderRadius: 'var(--r-md)',
                  }}
                >
                  {DEPARTMENTS.map((d) => {
                    const isChecked = formData.departments.includes(d.key);
                    return (
                      <label
                        key={d.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          padding: '0.25rem 0.5rem',
                          borderRadius: 'var(--r-sm)',
                          background: isChecked ? 'rgba(37,99,235,0.1)' : 'transparent',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleDept(d.key)}
                        />
                        <span>{d.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  marginTop: '1.5rem',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Registering...' : 'Add Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminStaff;
