import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';
import { prisma } from '../utils/prisma';
import logger from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload a file (thumbnail or avatar)
 *     description: Uploads a file and optionally updates the user's avatar if type=avatar is provided.
 *     tags: [Utils]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Use 'avatar' to automatically update user profile
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 */
router.post('/', authMiddleware, upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const filePath = `/uploads/${req.file.filename}`;
  const type = req.query.type;

  // If type is avatar, update user table automatically
  if (type === 'avatar') {
    try {
      const userId = (req as any).user.userId || (req as any).user.id;
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: { avatar: filePath }
        });
        logger.info(`Updated avatar for user ${userId} via generic upload`);
      }
    } catch (error) {
      logger.error('Failed to update avatar in generic upload:', error);
      // We don't fail the whole request since the file was uploaded successfully
    }
  }

  res.status(200).json({ 
    success: true, 
    data: { 
      url: filePath,
      updatedProfile: type === 'avatar'
    } 
  });
});

export default router;
