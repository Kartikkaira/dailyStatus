import { Router } from 'express';
import { register, login, refresh, logout } from '../controllers/authController';
import { authRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Apply basic rate limiting to all auth endpoints
router.use(authRateLimiter);

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);

export default router;
