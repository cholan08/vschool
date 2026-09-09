import { Router } from 'express';
import {
  createBranch,
  getBranches,
  getBranch,
  updateBranch,
  toggleBranch,
} from '../controllers/branchController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect); // all branch routes require auth

router.post('/', authorize('owner'), createBranch);
router.get('/', authorize('owner', 'admin', 'therapist', 'teacher'), getBranches);
router.get('/:id', authorize('owner', 'admin', 'therapist', 'teacher'), getBranch);
router.put('/:id', authorize('owner'), updateBranch);
router.patch('/:id/toggle', authorize('owner'), toggleBranch);

export default router;
