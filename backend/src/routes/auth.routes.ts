import { Router } from 'express';
import { register, login, getProfile } from '../controllers/auth.controller';
import { getLandingReviews } from '../controllers/review.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/landing-reviews', getLandingReviews);

router.get('/profile', authenticateToken, getProfile);


export default router;
