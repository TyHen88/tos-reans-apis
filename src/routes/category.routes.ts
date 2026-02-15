import { Router } from 'express';
import { getCategories, getAllCategories, createCategory, updateCategory, deleteCategory } from '../controllers/category.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getCategories);
router.get('/all', authMiddleware, adminMiddleware, getAllCategories);
router.post('/', authMiddleware, adminMiddleware, createCategory);
router.put('/:id', authMiddleware, adminMiddleware, updateCategory);
router.delete('/:id', authMiddleware, adminMiddleware, deleteCategory);

export default router;
