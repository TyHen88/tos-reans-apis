import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const getWishlist = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  try {
    const wishlist = await prisma.wishlist.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            instructor: { select: { name: true } },
            _count: { select: { lessons: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, data: wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch wishlist', error });
  }
};

export const addToWishlist = async (req: Request, res: Response) => {
  const { courseId } = req.body;
  const userId = (req as any).user.id;

  try {
    const item = await prisma.wishlist.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: {},
      create: { userId, courseId }
    });
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add to wishlist', error });
  }
};

export const removeFromWishlist = async (req: Request, res: Response) => {
  const { courseId } = req.params as { courseId: string };
  const userId = (req as any).user.id;

  try {
    await prisma.wishlist.delete({
      where: { userId_courseId: { userId, courseId } }
    });
    res.status(200).json({ success: true, message: 'Removed from wishlist' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove from wishlist', error });
  }
};
