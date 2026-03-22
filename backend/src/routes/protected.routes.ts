import { Router } from 'express';
import { Response } from 'express';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth.middleware';
import { getDoctors, submitPrediction, getDoctorPredictions } from '../controllers/predictions.controller';

const router = Router();

// ── Shared – any authenticated user ─────────────────────────────────────────
// List all active doctors (patients use this to choose their doctor)
router.get('/doctors',
  authenticateToken,
  getDoctors
);

// ── Patient dashboard ────────────────────────────────────────────────────────
router.get('/patient/dashboard',
  authenticateToken,
  authorizeRoles('PATIENT'),
  (req: AuthRequest, res: Response) => {
    res.json({ message: 'Welcome to Patient Dashboard', user: req.user });
  }
);

// Submit a prediction – patient fills the form, result is saved under doctorId
router.post('/predict',
  authenticateToken,
  authorizeRoles('PATIENT', 'DOCTOR'),
  submitPrediction
);

// ── Doctor dashboard ─────────────────────────────────────────────────────────
router.get('/doctor/dashboard',
  authenticateToken,
  authorizeRoles('DOCTOR'),
  (req: AuthRequest, res: Response) => {
    res.json({ message: 'Welcome to Doctor Dashboard', user: req.user });
  }
);

// Doctor sees all predictions belonging to them
router.get('/doctor/predictions',
  authenticateToken,
  authorizeRoles('DOCTOR'),
  getDoctorPredictions
);

// ── Admin dashboard ──────────────────────────────────────────────────────────
router.get('/admin/dashboard',
  authenticateToken,
  authorizeRoles('ADMIN'),
  (req: AuthRequest, res: Response) => {
    res.json({ message: 'Welcome to Admin Dashboard', user: req.user });
  }
);

// Multiple roles allowed
router.get('/doctor-admin/users',
  authenticateToken,
  authorizeRoles('DOCTOR', 'ADMIN'),
  (req: AuthRequest, res: Response) => {
    res.json({ message: 'Users list (Doctor or Admin access)', user: req.user });
  }
);

export default router;
