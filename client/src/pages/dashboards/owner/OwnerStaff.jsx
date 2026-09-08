import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { usersApi } from '../../../api/users';
import { branchApi } from '../../../api/branches';
import { DEPARTMENTS, getDeptLabel, getDeptColor, ROLES } from '../../../utils/constants';

const OwnerStaff = () => {
  const [staff, setStaff] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [roleFilter, setRoleFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'password123',
    role: 'therapist',
    branch: '',
    phone: '',
    departments: ['pediatric_ot'],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      const [usersRes, branchRes] = await Promise.all([
        usersApi.getAll({
          role: roleFilter || undefined,
          branch: branchFilter || undefined,
        }),
        branchApi.getAll(),
      ]);
      setStaff(usersRes.data);
      setBranches(branchRes.data);
      if (branchRes.data.length > 0 && !formData.branch) {
        setFormData(prev => ({ ...prev, branch: branchRes.data[0]._id }));
      }
    } catch (err) {
      console.error('Failed to load staff directory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [roleFilter, branchFilter]);

  const handleToggleDept = (key) => {
    setFormData(prev => {
      const exists = prev.departments.includes(key);
      return {
        ...prev,
        departments: exists
          ? prev.departments.filter(d => d !== key)
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
      await usersApi.create(formData);
      setShowAddModal(false);
      setFormData({
        name: '',
        email: '',
        password: 'password123',
        role: 'therapist',
        branch: branches[0]?._id || '',
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
      console.error('Failed to toggle staff active status', err);
    }
  };

  const filteredStaff = staff.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q);
  });

  const therapistCount = staff.filter(s => s.role === 'therapist').length;
  const adminCount = staff.filter(s => s.role === 'admin').length;
  const activeCount = staff.filter(s => s.isActive).length;

  return (
    <DashboardLayout>
      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Add Clinic Staff Member</h3>
                <div className="text-xs text-muted mt-1">Provision login access for a therapist or branch receptionist</div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            {error && (
              <div className="card-compact mb-3" style={{ background: 'var(--error-bg)', color: 'var(--error)', border: '1px solid #fecaca' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleAddStaff} className="flex" style={{ flexDirection: 'column', gap: '1rem' }}>
              <div className="grid-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label font-semibold">Full Name *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Dr. Pooja Menon"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label font-semibold">Email Address * (Login ID)</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="e.g. pooja@pediatrictherapy.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label font-semibold">Temporary Password *</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label font-semibold">Phone Number</label>
                  <input
                    type="tel"
                    className="input"
                    placeholder="+91 98765 00008"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label font-semibold">Staff Role *</label>
                  <select
                    className="select"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="therapist">Therapist / Doctor</option>
                    <option value="admin">Branch Receptionist / Admin</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label font-semibold">Assigned Branch Facility *</label>
                  <select
                    className="select"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    required
                  >
                    {branches.map(b => (
                      <option key={b._id} value={b._id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Departments if therapist */}
              {formData.role === 'therapist' && (
                <div className="form-group">
                  <label className="form-label font-semibold">Specialty Qualifications (Departments)</label>
                  <div className="grid-2" style={{ gap: '0.5rem' }}>
                    {DEPARTMENTS.map(d => {
                      const isSelected = formData.departments.includes(d.key);
                      return (
                        <div
                          key={d.key}
                          onClick={() => handleToggleDept(d.key)}
                          className="p-2 flex items-center gap-2"
                          style={{
                            cursor: 'pointer',
                            borderRadius: 'var(--r-md)',
                            background: isSelected ? `${d.color}15` : 'var(--surface-2)',
                            border: isSelected ? `1.5px solid ${d.color}` : '1px solid var(--border)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            style={{ accentColor: d.color }}
                          />
                          <span className="text-xs font-semibold" style={{ color: isSelected ? d.color : 'var(--text-primary)' }}>
                            {d.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating Account...' : '✓ Provision Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Clinic Staff &amp; Practitioner Directory</h1>
          <p className="page-subtitle">
            Manage personnel, assign specialties, and control system credentials across your clinics.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + Add Staff Member
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid mb-4">
        {[
          { icon: '👥', label: 'Total Staff', value: staff.length, color: 'var(--primary)' },
          { icon: '💊', label: 'Therapists', value: therapistCount, color: 'var(--emerald)' },
          { icon: '🏥', label: 'Reception Admins', value: adminCount, color: 'var(--accent)' },
          { icon: '🔒', label: 'Active Logins', value: activeCount, color: 'var(--violet)' },
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

      {/* Filter Bar */}
      <div className="card mb-4" style={{ padding: '0.85rem 1rem' }}>
        <div className="flex gap-3 flex-wrap items-center">
          <div className="flex-1" style={{ minWidth: 220 }}>
            <input
              type="text"
              className="input"
              placeholder="🔍 Search staff by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ minWidth: 160 }}>
            <select
              className="select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ padding: '0.4rem 0.65rem', fontSize: '0.825rem' }}
            >
              <option value="">All Roles</option>
              <option value="therapist">Therapists Only</option>
              <option value="admin">Admins Only</option>
            </select>
          </div>

          <div style={{ minWidth: 200 }}>
            <select
              className="select"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              style={{ padding: '0.4rem 0.65rem', fontSize: '0.825rem' }}
            >
              <option value="">All Branches</option>
              {branches.map(b => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="card">
        <div className="card-header flex justify-between items-center">
          <h2 className="section-title">Staff Members ({filteredStaff.length})</h2>
          <span className="text-xs text-muted">Showing all active practitioners and branch operators</span>
        </div>

        {loading ? (
          <div className="loading-screen" style={{ minHeight: 200 }}>
            <div className="spinner"></div>
            <p className="mt-2">Loading staff roster...</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <div className="empty-title">No Staff Found</div>
            <div className="empty-desc">No staff records match your current filters.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Role</th>
                  <th>Branch Location</th>
                  <th>Specialties / Departments</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map(s => {
                  const roleMeta = ROLES[s.role] || { label: s.role, color: 'var(--text-primary)' };
                  return (
                    <tr key={s._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div
                            className="user-avatar"
                            style={{
                              background: `${roleMeta.color}18`,
                              color: roleMeta.color,
                              fontWeight: 700,
                            }}
                          >
                            {s.name[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-primary">{s.name}</div>
                            <div className="text-xs text-muted">
                              ✉️ {s.email} {s.phone && `• 📞 ${s.phone}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          className="badge"
                          style={{
                            background: `${roleMeta.color}15`,
                            color: roleMeta.color,
                            border: `1px solid ${roleMeta.color}33`,
                            fontWeight: 600,
                          }}
                        >
                          {roleMeta.icon} {roleMeta.label}
                        </span>
                      </td>

                      <td>
                        <div className="text-xs font-semibold text-secondary">
                          {s.branch?.name || s.branch?.code || 'All Branches'}
                        </div>
                      </td>

                      <td>
                        {s.departments && s.departments.length > 0 ? (
                          <div className="flex gap-1 flex-wrap" style={{ maxWidth: 220 }}>
                            {s.departments.map(d => (
                              <span
                                key={d}
                                className="dept-chip"
                                style={{ background: `${getDeptColor(d)}15`, color: getDeptColor(d) }}
                              >
                                {getDeptLabel(d).split(' ')[0]}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>

                      <td>
                        <span
                          className="badge"
                          style={{
                            background: s.isActive ? 'var(--success-bg)' : 'var(--error-bg)',
                            color: s.isActive ? 'var(--success)' : 'var(--error)',
                            border: s.isActive ? '1px solid #bbf7d0' : '1px solid #fecaca',
                          }}
                        >
                          {s.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                          onClick={() => handleToggleStatus(s._id)}
                        >
                          {s.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default OwnerStaff;
