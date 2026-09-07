import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ─── Generate JWT ─────────────────────────────────────────────────────────────
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ─── Format user response ─────────────────────────────────────────────────────
const userResponse = (user, token) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  branch: user.branch,
  departments: user.departments,
  isActive: user.isActive,
  ...(token && { token }),
});

// ─── Register (internal — owner/admin create accounts) ───────────────────────
// @route  POST /api/auth/register
// @access Private (owner, admin) — see notes below
export const register = async (req, res) => {
  const { name, email, password, role, branch, departments, phone } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'A user already exists with that email' });
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'parent',
    branch: branch || null,
    departments: departments || [],
    phone: phone || '',
    createdBy: req.user?._id || null,
  });

  const populated = await User.findById(user._id).populate('branch', 'name code city');

  res.status(201).json(userResponse(populated, generateToken(user._id)));
};

// ─── Login ────────────────────────────────────────────────────────────────────
// @route  POST /api/auth/login
// @access Public
export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email })
    .select('+password')
    .populate('branch', 'name code city isActive');

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  if (!user.isActive) {
    return res.status(403).json({ message: 'Your account has been deactivated. Please contact the clinic.' });
  }

  if (user.branch && !user.branch.isActive) {
    return res.status(403).json({ message: 'Your branch is currently inactive. Please contact the clinic owner.' });
  }

  res.json(userResponse(user, generateToken(user._id)));
};

// ─── Get current user profile ─────────────────────────────────────────────────
// @route  GET /api/auth/me
// @access Private
export const getMe = async (req, res) => {
  const user = await User.findById(req.user._id).populate('branch', 'name code city departments');
  res.json(userResponse(user));
};

// ─── Change password ──────────────────────────────────────────────────────────
// @route  PUT /api/auth/password
// @access Private
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!user || !(await user.matchPassword(currentPassword))) {
    return res.status(401).json({ message: 'Current password is incorrect' });
  }

  user.password = newPassword;
  await user.save();

  res.json({ message: 'Password updated successfully' });
};
