import { Router } from 'express';
import { updateLessonProgress, getCourseProgress } from '../controllers/progress.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/course/:courseId', getCourseProgress);
router.patch('/lesson/:lessonId', updateLessonProgress);

export default router;
