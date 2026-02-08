import { Router } from 'express';
import { getUsers, updateUserRole, getStats } from '../controllers/admin.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminMiddleware } from '../middleware/admin.middleware';

const router = Router();

// All admin routes are protected by auth and admin middleware
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/users', getUsers);
router.patch('/users/:id/role', updateUserRole);
router.get('/stats', getStats);

export default router;
