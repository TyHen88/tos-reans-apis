import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  getProfile,
  updateProfile,
  addPassword,
  changePassword,
  getSessions,
  revokeSession,
  getSecurityScore,
  uploadAvatar,
} from '../controllers/user.controller';
import rateLimit from 'express-rate-limit';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// Rate limiters
const passwordChangeLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many password change attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const profileUpdateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many profile update attempts. Please try again later.',
});

const sessionRevokeLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Too many session revoke attempts. Please try again later.',
});

// All routes require authentication
router.use(authMiddleware);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', profileUpdateLimit, updateProfile);

// Password routes
router.post('/password/add', passwordChangeLimit, addPassword);
router.put('/password/change', passwordChangeLimit, changePassword);

// Session routes
router.get('/sessions', getSessions);
router.delete('/sessions/:sessionId', sessionRevokeLimit, revokeSession);

// Security score
router.get('/security-score', getSecurityScore);

// Avatar upload
router.post('/avatar', upload.single('avatar'), uploadAvatar);

export default router;
