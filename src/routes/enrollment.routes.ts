import { Router } from 'express';
import { checkout, paywayWebhook, getMyLearning, getCourseLearn, updateProgress, getCertificate } from '../controllers/enrollment.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Student Learning Experience
router.get('/my-learning', authMiddleware, getMyLearning);
router.get('/:id/learn', authMiddleware, getCourseLearn);
router.post('/:courseId/progress', authMiddleware, updateProgress);
router.get('/:courseId/certificate', authMiddleware, getCertificate);

// Payment & Checkout
router.post('/checkout', authMiddleware, checkout);
router.post('/webhook/payway', paywayWebhook);

export default router;
