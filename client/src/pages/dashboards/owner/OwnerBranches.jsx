import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { branchApi } from '../../../api/branches';
import { DEPARTMENTS, getDeptLabel, getDeptColor } from '../../../utils/constants';

const OwnerBranches = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: 'Bangalore',
    phone: '',
    email: '',
    departments: ['pediatric_ot', 'speech_language', 'physiotherapy'],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadBranches = async () => {
    try {
      const res = await branchApi.getAll();
      setBranches(res.data);
    } catch (err) {
      console.error('Failed to load branches', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

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

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      setError('Branch name and code are required');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      await branchApi.create(formData);
      setShowCreateModal(false);
      setFormData({
        name: '',
        code: '',
        address: '',
        city: 'Bangalore',
        phone: '',
        email: '',
        departments: ['pediatric_ot', 'speech_language', 'physiotherapy'],
      });
      await loadBranches();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create branch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (branchId) => {
    try {
      await branchApi.toggle(branchId);
      await loadBranches();
    } catch (err) {
      console.error('Failed to toggle branch status', err);
    }
  };

  const activeCount = branches.filter(b => b.isActive).length;

  return (
    <DashboardLayout>
      {/* Create Branch Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Create Clinic Branch</h3>
                <div className="text-xs text-muted mt-1">Add a new center to your healthcare network</div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            {error && (
              <div className="card-compact mb-3" style={{ background: 'var(--error-bg)', color: 'var(--error)', border: '1px solid #fecaca' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleCreateBranch} className="flex" style={{ flexDirection: 'column', gap: '1rem' }}>
              <div className="grid-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label font-semibold">Branch Name *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Absolute — North Bangalore"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label font-semibold">Branch Code * (e.g. ASST-NORTH)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="ASST-NORTH"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
              </div>

              <div className="grid-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label font-semibold">City</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label font-semibold">Phone Number</label>
                  <input
                    type="tel"
                    className="input"
                    placeholder="+91 80 4567 8902"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label font-semibold">Branch Email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="north@pediatrictherapy.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label font-semibold">Address</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Street, Landmark, Area"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              {/* Departments Offered */}
              <div className="form-group">
                <label className="form-label font-semibold">Clinical Departments Offered at this Branch</label>
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

              <div className="flex justify-between items-center pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating Branch...' : '✓ Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Branch Network Management</h1>
          <p className="page-subtitle">
            Configure locations, manage capacity, and assign medical specialties across your centers.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + Create New Branch
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid mb-4">
        {[
          { icon: '🏢', label: 'Total Branches', value: branches.length, color: 'var(--primary)' },
          { icon: '✅', label: 'Active Facilities', value: activeCount, color: 'var(--emerald)' },
          { icon: '📍', label: 'Primary City', value: 'Bangalore', color: 'var(--amber)' },
          { icon: '🩺', label: 'Network Specialties', value: DEPARTMENTS.length, color: 'var(--violet)' },
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

      {/* Branch Cards */}
      {loading ? (
        <div className="loading-screen">
          <div className="spinner spinner-lg"></div>
          <p className="mt-2">Loading branch network...</p>
        </div>
      ) : (
        <div className="grid-2" style={{ gap: '1.25rem' }}>
          {branches.map(b => (
            <div
              key={b._id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderLeft: b.isActive ? '4px solid var(--emerald)' : '4px solid var(--rose)',
              }}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-base font-bold text-primary">{b.name}</h3>
                    <div className="text-xs text-muted mt-0.5">
                      Code: <strong className="text-secondary">{b.code}</strong> • {b.city}
                    </div>
                  </div>

                  <button
                    className="badge"
                    style={{
                      cursor: 'pointer',
                      background: b.isActive ? 'var(--success-bg)' : 'var(--error-bg)',
                      color: b.isActive ? 'var(--success)' : 'var(--error)',
                      borderColor: b.isActive ? '#bbf7d0' : '#fecaca',
                    }}
                    onClick={() => handleToggleStatus(b._id)}
                    title="Click to toggle active status"
                  >
                    {b.isActive ? '● Active' : '○ Inactive'}
                  </button>
                </div>

                <div className="card-compact mb-3" style={{ background: 'var(--surface-2)', fontSize: '0.8rem' }}>
                  <div className="text-secondary">
                    📍 {b.address || 'Address not listed'}
                  </div>
                  {(b.phone || b.email) && (
                    <div className="text-muted mt-1">
                      📞 {b.phone || '—'} • ✉️ {b.email || '—'}
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-xs text-muted mb-1 font-semibold">Available Specialties ({b.departments?.length || 0}):</div>
                  <div className="flex gap-1 flex-wrap">
                    {b.departments?.map(d => (
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
              </div>

              <div className="flex justify-between items-center pt-3 mt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <span className="text-xs text-muted">
                  Created {new Date(b.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleToggleStatus(b._id)}
                >
                  {b.isActive ? 'Deactivate Branch' : 'Activate Branch'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default OwnerBranches;
