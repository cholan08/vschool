import User from '../models/User.js';
import Branch from '../models/Branch.js';

// ─── Create user (owner creates admin/therapist; admin creates therapist/parent) ─
// @route  POST /api/users
export const createUser = async (req, res) => {
  const { name, email, password, role, departments, phone } = req.body;

  // Admin can only create therapists, teachers, and parents for their own branch
  if (req.user.role === 'admin') {
    if (!['therapist', 'teacher', 'parent'].includes(role)) {
      return res.status(403).json({ message: 'Admins can only create therapist, teacher, or parent accounts' });
    }
    // Force to admin's own branch
    req.body.branch = req.user.branch?._id;
  }

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'Email already in use' });

  // Validate branch exists if provided
  if (req.body.branch) {
    const branchExists = await Branch.findById(req.body.branch);
    if (!branchExists) return res.status(404).json({ message: 'Branch not found' });
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    branch: req.body.branch || null,
    departments: departments || [],
    phone: phone || '',
    createdBy: req.user._id,
  });

  const populated = await User.findById(user._id)
    .populate('branch', 'name code city')
    .select('-password');

  res.status(201).json(populated);
};

// ─── Get users ────────────────────────────────────────────────────────────────
// @route  GET /api/users
// Owner: filter by role/branch query params. Admin: only their branch staff.
export const getUsers = async (req, res) => {
  const { role, branch, department } = req.query;
  const filter = {};

  if (req.user.role === 'admin') {
    // Admin sees users in their branch only
    filter.branch = req.user.branch?._id;
    // Admin cannot list other owners/admins
    filter.role = { $in: ['therapist', 'teacher', 'parent'] };
  } else {
    // Owner can filter
    if (role) filter.role = role;
    if (branch) filter.branch = branch;
  }

  if (department) filter.departments = { $in: [department] };

  const users = await User.find(filter)
    .populate('branch', 'name code city')
    .select('-password')
    .sort({ createdAt: -1 });

  res.json(users);
};

// ─── Get single user ──────────────────────────────────────────────────────────
// @route  GET /api/users/:id
export const getUser = async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate('branch', 'name code city')
    .select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Branch isolation for admins
  if (
    req.user.role === 'admin' &&
    user.branch?._id?.toString() !== req.user.branch?._id?.toString()
  ) {
    return res.status(403).json({ message: 'Access denied' });
  }

  res.json(user);
};

// ─── Update user ──────────────────────────────────────────────────────────────
// @route  PUT /api/users/:id
export const updateUser = async (req, res) => {
  const { name, email, phone, departments, branch, role } = req.body;

  // Admin cannot change roles or move users across branches
  if (req.user.role === 'admin') {
    delete req.body.role;
    delete req.body.branch;
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { name, email, phone, departments, ...(branch && { branch }), ...(role && { role }) },
    { new: true, runValidators: true }
  )
    .populate('branch', 'name code city')
    .select('-password');

  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

// ─── Toggle user active/inactive (owner only) ─────────────────────────────────
// @route  PATCH /api/users/:id/toggle
export const toggleUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (user.role === 'owner') {
    return res.status(400).json({ message: 'Cannot deactivate owner account this way' });
  }

  user.isActive = !user.isActive;
  await user.save();
  res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}`, isActive: user.isActive });
};

// ─── Get therapists for a branch (used by scheduler) ─────────────────────────
// @route  GET /api/users/therapists
export const getBranchTherapists = async (req, res) => {
  const branchId = req.query.branch || req.user.branch?._id;
  const { department } = req.query;

  if (!branchId) return res.status(400).json({ message: 'Branch is required' });

  const filter = { role: { $in: ['therapist', 'teacher'] }, branch: branchId, isActive: true };
  if (department) filter.departments = { $in: [department] };

  const therapists = await User.find(filter).select('name email phone departments').sort('name');
  res.json(therapists);
};
