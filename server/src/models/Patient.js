import mongoose from 'mongoose';
import { DEPARTMENT_KEYS, PATIENT_STATUSES } from '../utils/constants.js';

const patientSchema = new mongoose.Schema(
  {
    // Child's details (filled by parent, entered by admin)
    name: {
      type: String,
      required: [true, "Child's name is required"],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Child's date of birth is required"],
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: [true, 'Gender is required'],
    },

    // ─── Parent Details (embedded for quick access) ─────────────────────────
    parentDetails: {
      name:         { type: String, trim: true, default: '' },
      phone:        { type: String, trim: true, default: '' },
      email:        { type: String, trim: true, lowercase: true, default: '' },
      relationship: { type: String, trim: true, default: 'Parent' }, // Mother / Father / Guardian
      address:      { type: String, trim: true, default: '' },
    },

    // ─── Linked system parent account (created by admin) ───────────────────
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // ─── Clinic References ──────────────────────────────────────────────────
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
    },

    // Departments child is enrolled in (can be multiple)
    enrolledDepartments: {
      type: [String],
      enum: DEPARTMENT_KEYS,
      default: [],
    },

    // Therapists actively working with this child
    assignedTherapists: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // ─── Clinical Notes ─────────────────────────────────────────────────────
    // Initial notes entered by admin at registration
    medicalNotes: {
      type: String,
      default: '',
    },
    // Diagnosis / presenting concerns
    diagnosis: {
      type: String,
      default: '',
    },

    // ─── Status ─────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: PATIENT_STATUSES,
      default: 'active',
    },

    // Admin who registered this patient
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Virtual: age in years
patientSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birth = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
});

patientSchema.set('toJSON', { virtuals: true });
patientSchema.set('toObject', { virtuals: true });

const Patient = mongoose.model('Patient', patientSchema);
export default Patient;
