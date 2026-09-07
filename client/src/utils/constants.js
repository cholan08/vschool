export const DEPARTMENTS = [
  { key: 'pediatric_ot',          label: 'Pediatric Occupational Therapy', color: '#6366f1', short: 'OT' },
  { key: 'special_school',        label: 'Special School',                  color: '#8b5cf6', short: 'SS' },
  { key: 'speech_language',       label: 'Speech & Language Therapy',       color: '#06b6d4', short: 'SLT' },
  { key: 'physiotherapy',         label: 'Paediatric Physiotherapy',        color: '#10b981', short: 'PT' },
  { key: 'special_education',     label: 'Special Education',               color: '#f59e0b', short: 'SE' },
  { key: 'behavioral',            label: 'Behavioral Therapy',              color: '#ef4444', short: 'BT' },
  { key: 'sensory_integration',   label: 'Sensory Integration Therapy',     color: '#ec4899', short: 'SI' },
  { key: 'learning_disabilities', label: 'Learning Disabilities',           color: '#f97316', short: 'LD' },
  { key: 'vision_therapy',        label: 'Vision Therapy',                  color: '#84cc16', short: 'VT' },
  { key: 'psychology',            label: 'Psychological Assessment & Counselling', color: '#a78bfa', short: 'PSY' },
];

export const DEPARTMENT_MAP = Object.fromEntries(DEPARTMENTS.map((d) => [d.key, d]));

export const getDeptLabel = (key) => DEPARTMENT_MAP[key]?.label || key;
export const getDeptColor = (key) => DEPARTMENT_MAP[key]?.color || '#94a3b8';
export const getDeptShort = (key) => DEPARTMENT_MAP[key]?.short || key;

export const ROLES = {
  owner:     { label: 'Clinic Owner',  color: '#f59e0b', icon: '👑' },
  admin:     { label: 'Receptionist',  color: '#06b6d4', icon: '🏥' },
  therapist: { label: 'Therapist',     color: '#10b981', icon: '💊' },
  parent:    { label: 'Parent',        color: '#6366f1', icon: '👨‍👩‍👧' },
};

export const TIME_SLOTS = [
  '10:30 - 11:15', '11:15 - 12:00', '12:00 - 12:45',
  '12:45 - 13:30', '13:30 - 14:15', '14:15 - 15:00',
  '15:00 - 15:45', '15:45 - 16:30', '16:30 - 17:15',
  '17:15 - 18:00', '18:00 - 18:45', '18:45 - 19:30',
];

export const APPOINTMENT_STATUSES = {
  scheduled:  { label: 'Scheduled',  color: '#6366f1' },
  completed:  { label: 'Completed',  color: '#10b981' },
  cancelled:  { label: 'Cancelled',  color: '#ef4444' },
  no_show:    { label: 'No Show',    color: '#f59e0b' },
};

export const PATIENT_STATUSES = {
  active:     { label: 'Active',     color: '#10b981' },
  on_hold:    { label: 'On Hold',    color: '#f59e0b' },
  discharged: { label: 'Discharged', color: '#94a3b8' },
};

// Navigation items per role
export const NAV_ITEMS = {
  owner: [
    { path: '/dashboard',            label: 'Overview',       icon: '📊' },
    { path: '/dashboard/branches',   label: 'Branches',       icon: '🏢' },
    { path: '/dashboard/staff',      label: 'Staff',          icon: '👥' },
  ],
  admin: [
    { path: '/dashboard',            label: 'Today',          icon: '📅' },
    { path: '/dashboard/patients',   label: 'Patients',       icon: '👶' },
    { path: '/dashboard/schedule',   label: 'Schedule',       icon: '🗓️' },
  ],
  therapist: [
    { path: '/dashboard',            label: 'My Sessions',    icon: '📋' },
    { path: '/dashboard/patients',   label: 'My Patients',    icon: '👶' },
  ],
  parent: [
    { path: '/dashboard',            label: 'Home',           icon: '🏠' },
    { path: '/dashboard/progress',   label: 'Progress',       icon: '📈' },
  ],
};
