import { Router } from 'express';
import { Request, Response } from 'express';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Patient-only route
router.get('/patient/dashboard', 
  authenticateToken, 
  authorizeRoles('PATIENT'),
  (req: AuthRequest, res: Response) => {
    res.json({ 
      message: 'Welcome to Patient Dashboard',
      user: req.user 
    });
  }
);

// Doctor-only route
router.get('/doctor/dashboard', 
  authenticateToken, 
  authorizeRoles('DOCTOR'),
  (req: AuthRequest, res: Response) => {
    res.json({ 
      message: 'Welcome to Doctor Dashboard',
      user: req.user 
    });
  }
);

// Admin-only route
router.get('/admin/dashboard', 
  authenticateToken, 
  authorizeRoles('ADMIN'),
  (req: AuthRequest, res: Response) => {
    res.json({ 
      message: 'Welcome to Admin Dashboard',
      user: req.user 
    });
  }
);

// Multiple roles allowed
router.get('/doctor-admin/users', 
  authenticateToken, 
  authorizeRoles('DOCTOR', 'ADMIN'),
  (req: AuthRequest, res: Response) => {
    res.json({ 
      message: 'Users list (Doctor or Admin access)',
      user: req.user 
    });
  }
);

export default router;
