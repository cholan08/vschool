import { useState, useEffect } from 'react';
import { patientsApi } from '../../../api/patients';
import { usersApi } from '../../../api/users';
import { DEPARTMENTS, getDeptLabel } from '../../../utils/constants';

const COMMON_DIAGNOSES = [
  'Autism Spectrum Disorder (ASD)',
  'Attention Deficit Hyperactivity Disorder (ADHD)',
  'Speech & Language Delay',
  'Sensory Processing Disorder (SPD)',
  'Cerebral Palsy (CP)',
  'Global Developmental Delay (GDD)',
  'Down Syndrome',
  'Learning Disability (Dyslexia/Dysgraphia)',
  'Fine / Gross Motor Delay',
];

const RegisterPatientModal = ({ branchId, onClose, onRegistered }) => {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [therapists, setTherapists] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Child
    name: '',
    dateOfBirth: '',
    gender: 'male',
    diagnosis: '',
    customDiagnosis: '',
    // Step 2: Parent
    parentName: '',
    relationship: 'Mother',
    phone: '',
    email: '',
    address: '',
    // Step 3: Care plan
    enrolledDepartments: [],
    assignedTherapists: [],
    medicalNotes: '',
  });

  // Fetch therapists for this branch
  useEffect(() => {
    const fetchTherapists = async () => {
      try {
        const res = await usersApi.getTherapists({ branch: branchId });
        setTherapists(res.data);
      } catch (err) {
        console.error('Failed to load branch therapists', err);
      }
    };
    if (branchId) fetchTherapists();
  }, [branchId]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleToggleDept = (deptKey) => {
    setFormData(prev => {
      const exists = prev.enrolledDepartments.includes(deptKey);
      return {
        ...prev,
        enrolledDepartments: exists
          ? prev.enrolledDepartments.filter(d => d !== deptKey)
          : [...prev.enrolledDepartments, deptKey],
      };
    });
  };

  const handleToggleTherapist = (therapistId) => {
    setFormData(prev => {
      const exists = prev.assignedTherapists.includes(therapistId);
      return {
        ...prev,
        assignedTherapists: exists
          ? prev.assignedTherapists.filter(t => t !== therapistId)
          : [...prev.assignedTherapists, therapistId],
      };
    });
  };

  // Calculate age from DOB
  const calculateAge = (dob) => {
    if (!dob) return null;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const validateStep = (currentStep) => {
    setError('');
    if (currentStep === 1) {
      if (!formData.name.trim()) return 'Child name is required';
      if (!formData.dateOfBirth) return 'Date of birth is required';
      const age = calculateAge(formData.dateOfBirth);
      if (age < 0 || age > 25) return 'Please enter a valid date of birth';
    } else if (currentStep === 2) {
      if (!formData.parentName.trim()) return 'Primary parent/guardian name is required';
      if (!formData.phone.trim()) return 'Parent phone number is required';
    } else if (currentStep === 3) {
      if (formData.enrolledDepartments.length === 0) {
        return 'Please select at least one enrolled department for this child';
      }
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setError('');
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateStep(3);
    if (err) {
      setError(err);
      return;
    }

    setSubmitting(true);
    setError('');

    const finalDiagnosis =
      formData.diagnosis === 'Other'
        ? formData.customDiagnosis
        : formData.diagnosis;

    const payload = {
      name: formData.name.trim(),
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      diagnosis: finalDiagnosis,
      parentDetails: {
        name: formData.parentName.trim(),
        relationship: formData.relationship,
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
      },
      enrolledDepartments: formData.enrolledDepartments,
      assignedTherapists: formData.assignedTherapists,
      medicalNotes: formData.medicalNotes.trim(),
    };

    try {
      const res = await patientsApi.create(payload);
      if (onRegistered) onRegistered(res.data);
      onClose();
    } catch (apiErr) {
      setError(apiErr.response?.data?.message || 'Failed to register patient');
    } finally {
      setSubmitting(false);
    }
  };

  const calculatedAge = calculateAge(formData.dateOfBirth);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Patient Intake &amp; Registration</h3>
            <div className="text-xs text-muted mt-1">
              Step {step} of 3: {step === 1 ? 'Child Information' : step === 2 ? 'Parent / Guardian Details' : 'Care Plan & Therapists'}
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-4">
          {[
            { num: 1, label: 'Child Profile' },
            { num: 2, label: 'Parent / Guardian' },
            { num: 3, label: 'Clinical Enrollment' },
          ].map((s) => (
            <div
              key={s.num}
              className="flex-1 flex items-center gap-2 p-2"
              style={{
                borderRadius: 'var(--r-md)',
                background: step === s.num ? 'var(--primary-light)' : 'var(--surface-2)',
                border: step === s.num ? '1px solid var(--primary)' : '1px solid var(--border)',
                color: step === s.num ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.75rem',
              }}
            >
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: step >= s.num ? 'var(--primary)' : 'var(--surface-3)',
                  color: '#fff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                }}
              >
                {step > s.num ? '✓' : s.num}
              </span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="card-compact mb-3" style={{ background: 'var(--error-bg)', color: 'var(--error)', border: '1px solid #fecaca' }}>
            ⚠️ {error}
          </div>
        )}

        {/* ─── STEP 1: CHILD DETAILS ────────────────────────────────────── */}
        {step === 1 && (
          <div className="flex" style={{ flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label font-semibold">Child Full Name *</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Aarav Sharma"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                autoFocus
              />
            </div>

            <div className="grid-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label font-semibold">
                  Date of Birth * {calculatedAge !== null && `(Age: ${calculatedAge} yrs)`}
                </label>
                <input
                  type="date"
                  className="input"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label font-semibold">Gender *</label>
                <select
                  className="select"
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                >
                  <option value="male">Male (Boy)</option>
                  <option value="female">Female (Girl)</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label font-semibold">Primary Diagnosis / Presenting Concern</label>
              <select
                className="select"
                value={formData.diagnosis}
                onChange={(e) => handleChange('diagnosis', e.target.value)}
              >
                <option value="">Select Primary Diagnosis (or type below)...</option>
                {COMMON_DIAGNOSES.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
                <option value="Other">Other (Specify)</option>
              </select>
            </div>

            {formData.diagnosis === 'Other' && (
              <div className="form-group">
                <label className="form-label font-semibold">Specify Custom Diagnosis</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Enter specific diagnosis..."
                  value={formData.customDiagnosis}
                  onChange={(e) => handleChange('customDiagnosis', e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        {/* ─── STEP 2: PARENT DETAILS ───────────────────────────────────── */}
        {step === 2 && (
          <div className="flex" style={{ flexDirection: 'column', gap: '1rem' }}>
            <div className="grid-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label font-semibold">Parent / Guardian Name *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Ramesh Sharma"
                  value={formData.parentName}
                  onChange={(e) => handleChange('parentName', e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label font-semibold">Relationship to Child *</label>
                <select
                  className="select"
                  value={formData.relationship}
                  onChange={(e) => handleChange('relationship', e.target.value)}
                >
                  <option value="Mother">Mother</option>
                  <option value="Father">Father</option>
                  <option value="Guardian">Legal Guardian</option>
                  <option value="Grandparent">Grandparent</option>
                </select>
              </div>
            </div>

            <div className="grid-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label font-semibold">Contact Phone Number *</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="e.g. +91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label font-semibold">Email Address (Optional)</label>
                <input
                  type="email"
                  className="input"
                  placeholder="e.g. parent@example.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label font-semibold">Residential Address</label>
              <textarea
                className="textarea"
                placeholder="House / Street, Area, City, Pin Code"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                style={{ minHeight: 70 }}
              />
            </div>
          </div>
        )}

        {/* ─── STEP 3: CARE PLAN & ENROLLMENT ───────────────────────────── */}
        {step === 3 && (
          <div className="flex" style={{ flexDirection: 'column', gap: '1rem' }}>
            {/* Enrolled Departments */}
            <div className="form-group">
              <label className="form-label font-semibold flex justify-between">
                <span>Enrolled Therapy Departments *</span>
                <span className="text-xs text-muted">Select all therapies the child will receive</span>
              </label>
              <div className="grid-2" style={{ gap: '0.5rem' }}>
                {DEPARTMENTS.map(dept => {
                  const isSelected = formData.enrolledDepartments.includes(dept.key);
                  return (
                    <div
                      key={dept.key}
                      onClick={() => handleToggleDept(dept.key)}
                      className="p-2 flex items-center gap-2"
                      style={{
                        cursor: 'pointer',
                        borderRadius: 'var(--r-md)',
                        background: isSelected ? `${dept.color}15` : 'var(--surface-2)',
                        border: isSelected ? `1.5px solid ${dept.color}` : '1px solid var(--border)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by parent onClick
                        style={{ accentColor: dept.color }}
                      />
                      <span className="text-xs font-semibold" style={{ color: isSelected ? dept.color : 'var(--text-primary)' }}>
                        {dept.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Assigned Therapists */}
            <div className="form-group">
              <label className="form-label font-semibold flex justify-between">
                <span>Assign Therapists (Optional)</span>
                <span className="text-xs text-muted">Therapists who can conduct sessions</span>
              </label>
              {therapists.length === 0 ? (
                <div className="text-xs text-muted p-2 card-compact" style={{ background: 'var(--surface-2)' }}>
                  No active therapists found in this branch. You can assign therapists later.
                </div>
              ) : (
                <div className="grid-2" style={{ gap: '0.5rem' }}>
                  {therapists.map(t => {
                    const isAssigned = formData.assignedTherapists.includes(t._id);
                    return (
                      <div
                        key={t._id}
                        onClick={() => handleToggleTherapist(t._id)}
                        className="p-2 flex items-center justify-between"
                        style={{
                          cursor: 'pointer',
                          borderRadius: 'var(--r-md)',
                          background: isAssigned ? 'var(--primary-light)' : 'var(--surface-2)',
                          border: isAssigned ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div>
                          <div className="text-xs font-bold text-primary">{t.name}</div>
                          <div className="text-xs text-muted">
                            {t.departments?.map(d => getDeptLabel(d).split(' ')[0]).join(', ')}
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          onChange={() => {}}
                          style={{ accentColor: 'var(--primary)' }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Medical Notes */}
            <div className="form-group">
              <label className="form-label font-semibold">Intake Clinical &amp; Behavioral Notes</label>
              <textarea
                className="textarea"
                placeholder="Document any medical history, allergies, sensory triggers, behavioral patterns, or school reports..."
                value={formData.medicalNotes}
                onChange={(e) => handleChange('medicalNotes', e.target.value)}
                style={{ minHeight: 70 }}
              />
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div
          className="flex justify-between items-center gap-2 mt-4 pt-3"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          {step > 1 ? (
            <button type="button" className="btn btn-secondary" onClick={handlePrev}>
              ← Back
            </button>
          ) : (
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button type="button" className="btn btn-primary" onClick={handleNext}>
              Next Step →
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Registering Patient...' : '✓ Complete Registration'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterPatientModal;
