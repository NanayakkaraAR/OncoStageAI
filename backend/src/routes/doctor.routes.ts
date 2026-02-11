import { Router } from 'express';
import { 
  getAvailableDoctors, 
  assignPatientToDoctor,
  getMyAssignment 
} from '../controllers/doctor.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get available doctors with patient counts
router.get('/available', getAvailableDoctors);

// Assign patient to a doctor (patient only)
router.post('/assign', assignPatientToDoctor);

// Get current patient's doctor assignment
router.get('/my-assignment', getMyAssignment);

export default router;
