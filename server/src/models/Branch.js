import mongoose from 'mongoose';
import { DEPARTMENT_KEYS } from '../utils/constants.js';

const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Branch name is required'],
      trim: true,
    },
    // Short identifier: e.g., "SNK-01"
    code: {
      type: String,
      required: [true, 'Branch code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    // Which of the 10 departments does this branch offer
    departments: {
      type: [String],
      enum: DEPARTMENT_KEYS,
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Owner who created this branch
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

const Branch = mongoose.model('Branch', branchSchema);
export default Branch;
