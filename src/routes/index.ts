import { Router } from 'express';
import authRoutes from './auth.routes';
import courseRoutes from './course.routes';
import enrollmentRoutes from './enrollment.routes';
import adminRoutes from './admin.routes';
import resourceRoutes from './resource.routes';
import uploadRoutes from './upload.routes';
import categoryRoutes from './category.routes';
import wishlistRoutes from './wishlist.routes';
import progressRoutes from './progress.routes';
import userRoutes from './user.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/admin', adminRoutes);
router.use('/resources', resourceRoutes);
router.use('/upload', uploadRoutes);
router.use('/categories', categoryRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/progress', progressRoutes);
router.use('/user', userRoutes);

export default router;
