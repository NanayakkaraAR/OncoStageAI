import { Router } from 'express';
import { register, login, getProfile, updateProfile, changePassword, exportProfileData, deleteAccount } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.post('/change-password', authenticateToken, changePassword);
router.get('/profile/export', authenticateToken, exportProfileData);
router.delete('/profile', authenticateToken, deleteAccount);

export default router;
