import { Router } from 'express';
import {
  createAppointment,
  getAppointments,
  getAppointment,
  updateAppointment,
  addSessionNotes,
  getAvailableSlots,
  getTodayAppointments,
} from '../controllers/appointmentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.get('/slots', authorize('owner', 'admin', 'therapist'), getAvailableSlots);
router.get('/today', authorize('owner', 'admin', 'therapist'), getTodayAppointments);
router.post('/', authorize('admin'), createAppointment);
router.get('/', authorize('owner', 'admin', 'therapist', 'parent'), getAppointments);
router.get('/:id', authorize('owner', 'admin', 'therapist', 'parent'), getAppointment);
router.put('/:id', authorize('admin'), updateAppointment);
router.patch('/:id/notes', authorize('therapist'), addSessionNotes);

export default router;
