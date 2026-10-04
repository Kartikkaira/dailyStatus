import { Router } from 'express';
import { getAllDays, getDayStatus, upsertDayStatus } from '../controllers/dayController';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

// Public: Get all saved day entries (for calendar and grid overview)
router.get('/', getAllDays);

// Public: Get status for one specific day
router.get('/:month/:day', getDayStatus);

// Protected: Upsert status for a specific day
router.put('/:month/:day', authenticateJWT, upsertDayStatus);

export default router;
