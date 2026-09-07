import { Router } from 'express';
import {
  createPatient,
  getPatients,
  getPatient,
  updatePatient,
  dischargePatient,
  getPatientStats,
} from '../controllers/patientController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.get('/stats', authorize('owner', 'admin'), getPatientStats);
router.post('/', authorize('admin'), createPatient);
router.get('/', authorize('owner', 'admin', 'therapist', 'parent'), getPatients);
router.get('/:id', authorize('owner', 'admin', 'therapist', 'parent'), getPatient);
router.put('/:id', authorize('admin'), updatePatient);
router.patch('/:id/discharge', authorize('admin'), dischargePatient);

export default router;
