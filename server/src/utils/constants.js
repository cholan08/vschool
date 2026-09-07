// ─── Therapy Departments ──────────────────────────────────────────────────────
export const DEPARTMENTS = [
  { key: 'pediatric_ot',          label: 'Pediatric Occupational Therapy' },
  { key: 'special_school',        label: 'Special School' },
  { key: 'speech_language',       label: 'Speech & Language Therapy' },
  { key: 'physiotherapy',         label: 'Paediatric Physiotherapy' },
  { key: 'special_education',     label: 'Special Education' },
  { key: 'behavioral',            label: 'Behavioral Therapy' },
  { key: 'sensory_integration',   label: 'Sensory Integration Therapy' },
  { key: 'learning_disabilities', label: 'Learning Disabilities' },
  { key: 'vision_therapy',        label: 'Vision Therapy' },
  { key: 'psychology',            label: 'Psychological Assessment & Counselling' },
];

export const DEPARTMENT_KEYS = DEPARTMENTS.map((d) => d.key);

// ─── User Roles ───────────────────────────────────────────────────────────────
export const ROLES = ['owner', 'admin', 'therapist', 'parent'];

// ─── Appointment Time Slots (10:30am – 7:30pm, 45-min each) ──────────────────
// 12 slots per day per therapist
export const TIME_SLOTS = [
  '10:30 - 11:15',
  '11:15 - 12:00',
  '12:00 - 12:45',
  '12:45 - 13:30',
  '13:30 - 14:15',
  '14:15 - 15:00',
  '15:00 - 15:45',
  '15:45 - 16:30',
  '16:30 - 17:15',
  '17:15 - 18:00',
  '18:00 - 18:45',
  '18:45 - 19:30',
];

// ─── Appointment Statuses ─────────────────────────────────────────────────────
export const APPOINTMENT_STATUSES = ['scheduled', 'completed', 'cancelled', 'no_show'];

// ─── Patient Statuses ─────────────────────────────────────────────────────────
export const PATIENT_STATUSES = ['active', 'discharged', 'on_hold'];
