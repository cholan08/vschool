import Branch from '../models/Branch.js';

// ─── Create Branch (owner only) ───────────────────────────────────────────────
// @route  POST /api/branches
export const createBranch = async (req, res) => {
  const { name, code, address, city, phone, email, departments } = req.body;

  const existing = await Branch.findOne({ code: code?.toUpperCase() });
  if (existing) {
    return res.status(400).json({ message: 'A branch with this code already exists' });
  }

  const branch = await Branch.create({
    name,
    code,
    address,
    city,
    phone,
    email,
    departments: departments || [],
    createdBy: req.user._id,
  });

  res.status(201).json(branch);
};

// ─── Get all branches ─────────────────────────────────────────────────────────
// @route  GET /api/branches
// Owner → all branches. Admin/Therapist → their branch only.
export const getBranches = async (req, res) => {
  if (req.user.role === 'owner') {
    const branches = await Branch.find().sort({ createdAt: -1 });
    return res.json(branches);
  }

  if (!req.user.branch) {
    return res.json([]);
  }

  const branch = await Branch.findById(req.user.branch);
  res.json(branch ? [branch] : []);
};

// ─── Get single branch ────────────────────────────────────────────────────────
// @route  GET /api/branches/:id
export const getBranch = async (req, res) => {
  const branch = await Branch.findById(req.params.id);
  if (!branch) return res.status(404).json({ message: 'Branch not found' });

  // Non-owners can only view their own branch
  if (req.user.role !== 'owner' && branch._id.toString() !== req.user.branch?._id?.toString()) {
    return res.status(403).json({ message: 'Access denied' });
  }

  res.json(branch);
};

// ─── Update Branch (owner only) ───────────────────────────────────────────────
// @route  PUT /api/branches/:id
export const updateBranch = async (req, res) => {
  const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!branch) return res.status(404).json({ message: 'Branch not found' });
  res.json(branch);
};

// ─── Toggle Branch active/inactive (owner only) ───────────────────────────────
// @route  PATCH /api/branches/:id/toggle
export const toggleBranch = async (req, res) => {
  const branch = await Branch.findById(req.params.id);
  if (!branch) return res.status(404).json({ message: 'Branch not found' });

  branch.isActive = !branch.isActive;
  await branch.save();
  res.json({ message: `Branch ${branch.isActive ? 'activated' : 'deactivated'}`, branch });
};
