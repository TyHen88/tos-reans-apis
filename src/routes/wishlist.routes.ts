import { Router } from 'express';
import { getWishlist, addToWishlist, removeFromWishlist } from '../controllers/wishlist.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getWishlist);
router.post('/', addToWishlist);
router.delete('/:courseId', removeFromWishlist);

export default router;
