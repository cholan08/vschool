import Appointment from '../models/Appointment.js';
import { TIME_SLOTS } from '../utils/constants.js';

// ─── Create Appointment (admin & therapist) ──────────────────────────────────
// @route  POST /api/appointments
export const createAppointment = async (req, res) => {
  let { patient, therapist, department, date, timeSlot } = req.body;
  const branchId = req.user.branch?._id || req.user.branch;

  if (!branchId) {
    return res.status(400).json({ message: 'User must be assigned to a branch' });
  }

  // If therapist is booking, default therapist to themselves
  if (req.user.role === 'therapist') {
    therapist = req.user._id;
  }

  // Normalize date to just date portion (no time)
  const appointmentDate = new Date(date);
  appointmentDate.setHours(0, 0, 0, 0);

  // Check therapist availability
  const therapistConflict = await Appointment.findOne({
    therapist,
    date: appointmentDate,
    timeSlot,
    status: { $in: ['scheduled'] },
  });
  if (therapistConflict) {
    return res.status(409).json({
      message: `Therapist is already booked for the ${timeSlot} slot on this date`,
    });
  }

  // Check patient not double-booked in same slot
  const patientConflict = await Appointment.findOne({
    patient,
    date: appointmentDate,
    timeSlot,
    status: { $in: ['scheduled'] },
  });
  if (patientConflict) {
    return res.status(409).json({
      message: `Patient already has a session scheduled at ${timeSlot} on this date`,
    });
  }

  const appointment = await Appointment.create({
    patient,
    therapist,
    branch: branchId,
    department,
    date: appointmentDate,
    timeSlot,
    status: 'scheduled',
    scheduledBy: req.user._id,
  });

  const populated = await Appointment.findById(appointment._id)
    .populate('patient', 'name dateOfBirth gender')
    .populate('therapist', 'name email departments')
    .populate('branch', 'name code');

  res.status(201).json(populated);
};

// ─── Get appointments ─────────────────────────────────────────────────────────
// @route  GET /api/appointments
export const getAppointments = async (req, res) => {
  const { branch, therapist, patient, department, date, status } = req.query;
  let filter = {};

  if (req.user.role === 'owner') {
    if (branch) filter.branch = branch;
  } else if (req.user.role === 'admin') {
    filter.branch = req.user.branch?._id;
  } else if (req.user.role === 'therapist') {
    filter.branch = req.user.branch?._id;
    // If specific patient history requested, show patient's sessions (optionally by therapist)
    if (!patient) {
      filter.therapist = req.user._id;
    } else if (therapist) {
      filter.therapist = therapist;
    }
  } else if (req.user.role === 'parent') {
    // Parent sees appointments for their children only
    // They get populated and we filter server-side
    const patientIds = req.user.children || [];
    filter.patient = { $in: patientIds };
    // Only show parent-visible completed sessions + upcoming scheduled
    filter.$or = [
      { status: 'scheduled' },
      { status: 'completed', parentVisible: true },
    ];
  }

  if (therapist && req.user.role !== 'therapist') filter.therapist = therapist;
  if (patient) filter.patient = patient;
  if (department) filter.department = department;
  if (status && req.user.role !== 'parent') filter.status = status;

  if (date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const dEnd = new Date(d);
    dEnd.setDate(dEnd.getDate() + 1);
    filter.date = { $gte: d, $lt: dEnd };
  }

  const appointments = await Appointment.find(filter)
    .populate('patient', 'name dateOfBirth gender')
    .populate('therapist', 'name email departments')
    .populate('branch', 'name code')
    .sort({ date: 1, timeSlot: 1 });

  res.json(appointments);
};

// ─── Get single appointment ───────────────────────────────────────────────────
// @route  GET /api/appointments/:id
export const getAppointment = async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate('patient', 'name dateOfBirth gender parentDetails')
    .populate('therapist', 'name email phone departments')
    .populate('branch', 'name code city');

  if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
  res.json(appointment);
};

// ─── Update appointment (admin — reschedule, cancel) ─────────────────────────
// @route  PUT /api/appointments/:id
export const updateAppointment = async (req, res) => {
  const { date, timeSlot, status, therapist } = req.body;

  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

  // If rescheduling, check availability again
  const newDate = date ? new Date(date) : appointment.date;
  const newSlot = timeSlot || appointment.timeSlot;
  const newTherapist = therapist || appointment.therapist;
  if (date || timeSlot || therapist) {
    newDate.setHours(0, 0, 0, 0);
    const conflict = await Appointment.findOne({
      _id: { $ne: appointment._id },
      therapist: newTherapist,
      date: newDate,
      timeSlot: newSlot,
      status: 'scheduled',
    });
    if (conflict) {
      return res.status(409).json({ message: `Therapist already booked for ${newSlot} on this date` });
    }
  }

  const updated = await Appointment.findByIdAndUpdate(
    req.params.id,
    { ...req.body, date: newDate },
    { new: true, runValidators: true }
  )
    .populate('patient', 'name')
    .populate('therapist', 'name email')
    .populate('branch', 'name code');

  res.json(updated);
};

// ─── Add session notes (therapist only) ──────────────────────────────────────
// @route  PATCH /api/appointments/:id/notes
export const addSessionNotes = async (req, res) => {
  const { sessionNotes, soapNotes, homeActivities, milestones, parentVisible, status } = req.body;

  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

  // Therapist can only add notes to their own appointments
  if (appointment.therapist.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'You can only add notes to your own sessions' });
  }

  if (soapNotes) {
    appointment.soapNotes = {
      subjective: soapNotes.subjective ?? appointment.soapNotes?.subjective ?? '',
      objective:  soapNotes.objective  ?? appointment.soapNotes?.objective  ?? '',
      assessment: soapNotes.assessment ?? appointment.soapNotes?.assessment ?? '',
      plan:       soapNotes.plan       ?? appointment.soapNotes?.plan       ?? '',
    };
  }

  if (homeActivities !== undefined) appointment.homeActivities = homeActivities;
  if (milestones !== undefined) appointment.milestones = milestones;

  if (sessionNotes !== undefined) {
    appointment.sessionNotes = sessionNotes;
  } else if (soapNotes) {
    // Generate text summary for backward compatibility
    const parts = [
      soapNotes.subjective ? `S: ${soapNotes.subjective}` : '',
      soapNotes.objective  ? `O: ${soapNotes.objective}` : '',
      soapNotes.assessment ? `A: ${soapNotes.assessment}` : '',
      soapNotes.plan       ? `P: ${soapNotes.plan}` : '',
    ].filter(Boolean);
    if (parts.length > 0) {
      appointment.sessionNotes = parts.join('\n\n');
    }
  }

  appointment.parentVisible = parentVisible ?? appointment.parentVisible;
  appointment.notesUpdatedAt = new Date();
  if (status) appointment.status = status;

  await appointment.save();

  const populated = await Appointment.findById(appointment._id)
    .populate('patient', 'name dateOfBirth gender')
    .populate('therapist', 'name email departments')
    .populate('branch', 'name code');

  res.json(populated);
};

// ─── Get available time slots for a therapist on a date ──────────────────────
// @route  GET /api/appointments/slots?therapist=X&date=Y
export const getAvailableSlots = async (req, res) => {
  const { therapist, date } = req.query;
  if (!therapist || !date) {
    return res.status(400).json({ message: 'therapist and date query params are required' });
  }

  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dEnd = new Date(d);
  dEnd.setDate(dEnd.getDate() + 1);

  const booked = await Appointment.find({
    therapist,
    date: { $gte: d, $lt: dEnd },
    status: 'scheduled',
  }).select('timeSlot');

  const bookedSlots = booked.map((a) => a.timeSlot);
  const available = TIME_SLOTS.filter((slot) => !bookedSlots.includes(slot));

  res.json({ available, booked: bookedSlots, all: TIME_SLOTS });
};

// ─── Get today's appointment summary (for dashboards) ────────────────────────
// @route  GET /api/appointments/today
export const getTodayAppointments = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const filter = {
    date: { $gte: today, $lt: tomorrow },
  };

  if (req.user.role === 'admin') filter.branch = req.user.branch?._id;
  if (req.user.role === 'therapist') filter.therapist = req.user._id;

  const appointments = await Appointment.find(filter)
    .populate('patient', 'name gender')
    .populate('therapist', 'name')
    .populate('branch', 'name code')
    .sort({ timeSlot: 1 });

  res.json(appointments);
};
