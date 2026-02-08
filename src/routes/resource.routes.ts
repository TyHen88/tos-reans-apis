import { Router } from 'express';
import { getResources, createResource, deleteResource } from '../controllers/resource.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminMiddleware } from '../middleware/admin.middleware';

const router = Router();

router.get('/', getResources);
router.post('/', authMiddleware, adminMiddleware, createResource);
router.delete('/:id', authMiddleware, adminMiddleware, deleteResource);

export default router;
