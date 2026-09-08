import { useState } from 'react';
import { getDeptLabel, getDeptColor } from '../../../utils/constants';

// Department-tailored milestone goal suggestions
const DEFAULT_GOALS = {
  pediatric_ot: [
    'Maintains tripod grasp on writing utensil',
    'Crosses physical midline during bilateral motor tasks',
    'Tolerates multi-texture sensory input (tactile/swing)',
    'Independently completes 3-step fine motor sequence',
  ],
  speech_language: [
    'Uses 2-3 word phrases to express spontaneous requests',
    'Follows two-step directions without visual prompts',
    'Maintains eye contact during conversational turn-taking',
    'Imitates target phonemes /s/, /r/, /th/ with 70% accuracy',
  ],
  behavioral: [
    'Transitions between activities with minimal verbal prompt',
    'Utilizes visual schedule to self-regulate task sequence',
    'Sits and engages in structured play for 10 consecutive minutes',
    'Expresses frustration using appropriate emotional regulation cues',
  ],
  sensory_integration: [
    'Engages in linear vestibular stimulation for 5 minutes',
    'Demonstrates improved proprioceptive awareness in obstacle course',
    'Self-regulates arousal levels using deep pressure blanket/tools',
  ],
  physiotherapy: [
    'Maintains single-leg balance for 5 seconds without support',
    'Navigates stairs with alternating foot pattern and railing support',
    'Performs core-strengthening ball exercises with proper posture',
  ],
};

const SessionNotesModal = ({ appointment, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState('soap');
  const [status, setStatus] = useState(appointment.status || 'scheduled');
  const [parentVisible, setParentVisible] = useState(appointment.parentVisible || false);
  const [saving, setSaving] = useState(false);

  // SOAP State
  const [soap, setSoap] = useState({
    subjective: appointment.soapNotes?.subjective || '',
    objective: appointment.soapNotes?.objective || '',
    assessment: appointment.soapNotes?.assessment || '',
    plan: appointment.soapNotes?.plan || '',
  });

  // Home Recommendations State
  const [homeActivities, setHomeActivities] = useState(appointment.homeActivities || '');

  // Milestones State
  const initialMilestones = (appointment.milestones && appointment.milestones.length > 0)
    ? appointment.milestones
    : (DEFAULT_GOALS[appointment.department] || DEFAULT_GOALS.pediatric_ot).map(g => ({
        goal: g,
        status: 'in_progress',
      }));

  const [milestones, setMilestones] = useState(initialMilestones);
  const [newGoal, setNewGoal] = useState('');

  const handleSoapChange = (field, value) => {
    setSoap(prev => ({ ...prev, [field]: value }));
  };

  const handleMilestoneStatusChange = (index, newStatus) => {
    setMilestones(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], status: newStatus };
      return copy;
    });
  };

  const handleAddGoal = (e) => {
    e.preventDefault();
    if (!newGoal.trim()) return;
    setMilestones(prev => [...prev, { goal: newGoal.trim(), status: 'in_progress' }]);
    setNewGoal('');
  };

  const handleRemoveGoal = (index) => {
    setMilestones(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuickAdd = (field, text) => {
    setSoap(prev => ({
      ...prev,
      [field]: prev[field] ? `${prev[field]}; ${text}` : text,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(appointment._id, {
        soapNotes: soap,
        homeActivities,
        milestones,
        parentVisible,
        status,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const deptColor = getDeptColor(appointment.department);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header" style={{ marginBottom: '1rem', paddingBottom: '0.75rem' }}>
          <div>
            <div className="flex items-center gap-2">
              <span
                className="dept-chip"
                style={{ background: `${deptColor}18`, color: deptColor, border: `1px solid ${deptColor}33` }}
              >
                {getDeptLabel(appointment.department)}
              </span>
              <h3 className="modal-title" style={{ margin: 0 }}>
                Clinical Session Note
              </h3>
            </div>
            <div className="text-xs text-muted mt-1">
              Patient: <strong className="text-primary">{appointment.patient?.name}</strong> • Time: <strong>{appointment.timeSlot}</strong>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        {/* Quick Session Status Bar */}
        <div
          className="flex items-center justify-between gap-3 mb-3 p-2"
          style={{ background: 'var(--surface-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-secondary">Session Status:</span>
            <select
              className="select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', minWidth: 140 }}
            >
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed (Attended)</option>
              <option value="no_show">No Show</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={parentVisible}
              onChange={(e) => setParentVisible(e.target.checked)}
              style={{ accentColor: 'var(--primary)' }}
            />
            <span className="text-xs font-semibold text-primary">
              Share in Parent Portal
            </span>
          </label>
        </div>

        {/* Tab Navigation */}
        <div className="tab-nav">
          <button
            className={`tab-btn ${activeTab === 'soap' ? 'active' : ''}`}
            onClick={() => setActiveTab('soap')}
          >
            📋 SOAP Clinical Documentation
          </button>
          <button
            className={`tab-btn ${activeTab === 'milestones' ? 'active' : ''}`}
            onClick={() => setActiveTab('milestones')}
          >
            🎯 Goal &amp; Milestones ({milestones.filter(m => m.status === 'achieved').length}/{milestones.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'parent' ? 'active' : ''}`}
            onClick={() => setActiveTab('parent')}
          >
            🏡 Home Program &amp; Parent Notes
          </button>
        </div>

        {/* ─── TAB 1: SOAP CLINICAL NOTES ─────────────────────────────────── */}
        {activeTab === 'soap' && (
          <div className="flex" style={{ flexDirection: 'column', gap: '1rem' }}>
            {/* Subjective */}
            <div className="soap-box">
              <div className="soap-box-header justify-between">
                <div className="flex items-center gap-2">
                  <span className="soap-badge soap-badge-s">S</span>
                  <div>
                    <div className="soap-box-title">Subjective</div>
                    <div className="soap-box-subtitle">Child's emotional state, alertness, regulation level, parent feedback</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {['Calm & alert', 'Sensory seeking', 'Fatigued', 'Dysregulated'].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      className="badge"
                      style={{ cursor: 'pointer', background: 'var(--surface-3)', color: 'var(--text-secondary)' }}
                      onClick={() => handleQuickAdd('subjective', tag)}
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                className="textarea"
                value={soap.subjective}
                onChange={(e) => handleSoapChange('subjective', e.target.value)}
                placeholder="e.g., Child arrived accompanied by mother. Appeared cheerful and eager to engage; mother noted good sleep overnight..."
                style={{ minHeight: 70 }}
              />
            </div>

            {/* Objective */}
            <div className="soap-box">
              <div className="soap-box-header justify-between">
                <div className="flex items-center gap-2">
                  <span className="soap-badge soap-badge-o">O</span>
                  <div>
                    <div className="soap-box-title">Objective</div>
                    <div className="soap-box-subtitle">Measurable activities, sensory protocols, exercises performed</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {['Vestibular swing 10m', 'Pencil grip drill', 'Vocal imitation', 'Obstacle course'].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      className="badge"
                      style={{ cursor: 'pointer', background: 'var(--surface-3)', color: 'var(--text-secondary)' }}
                      onClick={() => handleQuickAdd('objective', tag)}
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                className="textarea"
                value={soap.objective}
                onChange={(e) => handleSoapChange('objective', e.target.value)}
                placeholder="e.g., Conducted 15 min vestibular swinging (linear rhythm). Practiced dynamic tripod grasp with weighted crayon for 10 repetitions..."
                style={{ minHeight: 85 }}
              />
            </div>

            {/* Assessment */}
            <div className="soap-box">
              <div className="soap-box-header">
                <span className="soap-badge soap-badge-a">A</span>
                <div>
                  <div className="soap-box-title">Assessment</div>
                  <div className="soap-box-subtitle">Clinical analysis of progress, response to sensory input, task stamina</div>
                </div>
              </div>
              <textarea
                className="textarea"
                value={soap.assessment}
                onChange={(e) => handleSoapChange('assessment', e.target.value)}
                placeholder="e.g., Showed notable improvement in bilateral hand integration. Maintained focus for 12 continuous minutes with minimal redirection..."
                style={{ minHeight: 75 }}
              />
            </div>

            {/* Plan */}
            <div className="soap-box">
              <div className="soap-box-header">
                <span className="soap-badge soap-badge-p">P</span>
                <div>
                  <div className="soap-box-title">Plan</div>
                  <div className="soap-box-subtitle">Next clinical targets, progression of resistance or complexity</div>
                </div>
              </div>
              <textarea
                className="textarea"
                value={soap.plan}
                onChange={(e) => handleSoapChange('plan', e.target.value)}
                placeholder="e.g., Advance to scissor cutting along curved lines in next session. Introduce multi-step tactile discrimination..."
                style={{ minHeight: 70 }}
              />
            </div>
          </div>
        )}

        {/* ─── TAB 2: MILESTONES & GOALS ──────────────────────────────────── */}
        {activeTab === 'milestones' && (
          <div className="flex" style={{ flexDirection: 'column', gap: '1rem' }}>
            <div className="card-compact" style={{ background: 'var(--surface-2)' }}>
              <div className="text-xs text-muted mb-2">
                Evaluate target goals addressed in this session. Statuses update the child's longitudinal progress chart.
              </div>
              <div className="flex" style={{ flexDirection: 'column', gap: '0.5rem' }}>
                {milestones.map((m, idx) => (
                  <div key={idx} className="milestone-row">
                    <div className="flex-1 text-sm font-semibold text-primary">
                      {m.goal}
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        className="select"
                        value={m.status}
                        onChange={(e) => handleMilestoneStatusChange(idx, e.target.value)}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          fontWeight: 700,
                          color:
                            m.status === 'achieved' ? 'var(--success)' :
                            m.status === 'in_progress' ? 'var(--primary)' :
                            m.status === 'emerging' ? 'var(--warning)' : 'var(--text-muted)',
                        }}
                      >
                        <option value="in_progress">🔄 In Progress</option>
                        <option value="achieved">✅ Achieved</option>
                        <option value="emerging">🌱 Emerging</option>
                        <option value="not_started">⏸ Not Started</option>
                      </select>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '0.2rem 0.4rem', color: 'var(--error)' }}
                        onClick={() => handleRemoveGoal(idx)}
                        title="Remove goal"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Custom Goal */}
            <form onSubmit={handleAddGoal} className="flex gap-2">
              <input
                type="text"
                className="input flex-1"
                placeholder="Add another clinical goal/milestone..."
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              />
              <button type="submit" className="btn btn-secondary">
                + Add Goal
              </button>
            </form>
          </div>
        )}

        {/* ─── TAB 3: PARENT GUIDANCE & HOME ACTIVITIES ──────────────────── */}
        {activeTab === 'parent' && (
          <div className="flex" style={{ flexDirection: 'column', gap: '1rem' }}>
            <div className="card-compact" style={{ background: 'var(--primary-light)', border: '1px solid rgba(37,99,235,0.2)' }}>
              <div className="font-semibold text-sm text-primary mb-1">
                👨‍👩‍👧 Parent Home Program Guidance
              </div>
              <div className="text-xs text-secondary">
                These exercises and tips will be highlighted directly on the parent's portal dashboard. Keep instructions simple, positive, and practical for home practice.
              </div>
            </div>

            <div className="form-group">
              <label className="form-label font-semibold">Recommended Home Activities / Exercises</label>
              <textarea
                className="textarea"
                value={homeActivities}
                onChange={(e) => setHomeActivities(e.target.value)}
                placeholder="e.g., 1. Play dough rolling & pinching 10 mins daily.&#10;2. Practice buttoning shirt before school with positive reinforcement.&#10;3. High-knees march on living room rug before dinner."
                style={{ minHeight: 180 }}
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div
          className="flex justify-between items-center gap-2 mt-4 pt-3"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <div className="text-xs text-muted">
            {parentVisible ? (
              <span className="text-primary font-semibold">✓ Visible to Parent on Save</span>
            ) : (
              <span>🔒 Internal Clinical Documentation (Hidden from Parent)</span>
            )}
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Clinical Notes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionNotesModal;
