import { Router } from 'express';
import { getCourses, getCourseById, createCourse, updateCourse, deleteCourse } from '../controllers/course.controller';
import { getCourseReviews, createReview } from '../controllers/review.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import lessonRoutes from './lesson.routes';

const router = Router();

// Review Routes
router.get('/:id/reviews', getCourseReviews);
router.post('/:id/reviews', authMiddleware, createReview);

// Lesson Routes (Nested)
router.use('/:courseId/lessons', lessonRoutes);

// Course Routes
router.get('/', getCourses);
router.get('/:id', getCourseById);
router.post('/', authMiddleware, createCourse);
router.put('/:id', authMiddleware, updateCourse);
router.patch('/:id', authMiddleware, updateCourse); // Add PATCH for partial updates
router.delete('/:id', authMiddleware, deleteCourse);

export default router;
