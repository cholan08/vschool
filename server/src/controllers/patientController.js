import Patient from '../models/Patient.js';
import User from '../models/User.js';

// ─── Register a new patient (admin only) ─────────────────────────────────────
// @route  POST /api/patients
export const createPatient = async (req, res) => {
  const {
    name,
    dateOfBirth,
    gender,
    parentDetails,
    enrolledDepartments,
    assignedTherapists,
    medicalNotes,
    diagnosis,
    // Optionally link to an existing parent User account
    parent,
  } = req.body;

  const branchId = req.user.branch?._id || req.user.branch;
  if (!branchId) {
    return res.status(400).json({ message: 'Admin must be assigned to a branch to register patients' });
  }

  const patient = await Patient.create({
    name,
    dateOfBirth,
    gender,
    parentDetails: parentDetails || {},
    parent: parent || null,
    branch: branchId,
    enrolledDepartments: enrolledDepartments || [],
    assignedTherapists: assignedTherapists || [],
    medicalNotes: medicalNotes || '',
    diagnosis: diagnosis || '',
    registeredBy: req.user._id,
  });

  // If a parent User is linked, push patient to their children array
  if (parent) {
    await User.findByIdAndUpdate(parent, { $addToSet: { children: patient._id } });
  }

  const populated = await Patient.findById(patient._id)
    .populate('branch', 'name code city')
    .populate('assignedTherapists', 'name email departments')
    .populate('parent', 'name email phone');

  res.status(201).json(populated);
};

// ─── Get patients ─────────────────────────────────────────────────────────────
// @route  GET /api/patients
// Owner: all patients (filterable by branch/department)
// Admin: patients in their branch
// Therapist: patients assigned to them
// Parent: their children only
export const getPatients = async (req, res) => {
  const { branch, department, status, search } = req.query;
  let filter = {};

  if (req.user.role === 'owner') {
    if (branch) filter.branch = branch;
  } else if (req.user.role === 'admin') {
    filter.branch = req.user.branch?._id;
  } else if (req.user.role === 'therapist') {
    filter.assignedTherapists = { $in: [req.user._id] };
    filter.branch = req.user.branch?._id;
  } else if (req.user.role === 'parent') {
    filter.parent = req.user._id;
  }

  if (department) filter.enrolledDepartments = { $in: [department] };
  if (status) filter.status = status;
  if (search) filter.name = { $regex: search, $options: 'i' };

  const patients = await Patient.find(filter)
    .populate('branch', 'name code city')
    .populate('assignedTherapists', 'name email departments')
    .populate('parent', 'name email phone')
    .sort({ createdAt: -1 });

  res.json(patients);
};

// ─── Get single patient ───────────────────────────────────────────────────────
// @route  GET /api/patients/:id
export const getPatient = async (req, res) => {
  const patient = await Patient.findById(req.params.id)
    .populate('branch', 'name code city')
    .populate('assignedTherapists', 'name email phone departments')
    .populate('parent', 'name email phone')
    .populate('registeredBy', 'name email');

  if (!patient) return res.status(404).json({ message: 'Patient not found' });

  // Access control
  const role = req.user.role;
  if (role === 'admin' && patient.branch?._id?.toString() !== req.user.branch?._id?.toString()) {
    return res.status(403).json({ message: 'Access denied' });
  }
  if (role === 'therapist' && !patient.assignedTherapists.some(t => t._id.toString() === req.user._id.toString())) {
    return res.status(403).json({ message: 'Access denied — patient not assigned to you' });
  }
  if (role === 'parent' && patient.parent?._id?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Access denied' });
  }

  res.json(patient);
};

// ─── Update patient ───────────────────────────────────────────────────────────
// @route  PUT /api/patients/:id
export const updatePatient = async (req, res) => {
  // Prevent moving patient to another branch
  if (req.user.role === 'admin') {
    delete req.body.branch;
    delete req.body.registeredBy;
  }

  const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate('branch', 'name code city')
    .populate('assignedTherapists', 'name email departments')
    .populate('parent', 'name email phone');

  if (!patient) return res.status(404).json({ message: 'Patient not found' });

  // Keep parent's children array in sync if parent changed
  if (req.body.parent) {
    await User.findByIdAndUpdate(req.body.parent, { $addToSet: { children: patient._id } });
  }

  res.json(patient);
};

// ─── Discharge patient ────────────────────────────────────────────────────────
// @route  PATCH /api/patients/:id/discharge
export const dischargePatient = async (req, res) => {
  const patient = await Patient.findByIdAndUpdate(
    req.params.id,
    { status: 'discharged' },
    { new: true }
  );
  if (!patient) return res.status(404).json({ message: 'Patient not found' });
  res.json({ message: 'Patient discharged', patient });
};

// ─── Get patient stats for a branch (used by dashboards) ─────────────────────
// @route  GET /api/patients/stats
export const getPatientStats = async (req, res) => {
  const branchId = req.user.role === 'owner' ? req.query.branch : req.user.branch?._id;
  const filter = branchId ? { branch: branchId } : {};

  const [total, active, discharged, byDept] = await Promise.all([
    Patient.countDocuments(filter),
    Patient.countDocuments({ ...filter, status: 'active' }),
    Patient.countDocuments({ ...filter, status: 'discharged' }),
    Patient.aggregate([
      { $match: filter },
      { $unwind: '$enrolledDepartments' },
      { $group: { _id: '$enrolledDepartments', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  res.json({ total, active, discharged, byDepartment: byDept });
};
