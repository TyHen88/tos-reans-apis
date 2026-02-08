import { Router } from 'express';
import { getLessons, createLesson, updateLesson, deleteLesson, bulkCreateLessons } from '../controllers/lesson.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router({ mergeParams: true });

// Mounted at /api/courses/:courseId/lessons
router.get('/', getLessons);
router.post('/', authMiddleware, createLesson);
router.post('/bulk-save', authMiddleware, bulkCreateLessons);
router.put('/:lessonId', authMiddleware, updateLesson);
router.delete('/:lessonId', authMiddleware, deleteLesson);

export default router;
