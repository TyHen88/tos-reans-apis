import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const getCourseReviews = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  try {
    const reviews = await prisma.review.findMany({
      where: { courseId: id },
      include: {
        user: {
          select: {
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch reviews', error });
  }
};

export const createReview = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { rating, comment } = req.body;
  const userId = (req as any).user.id;

  try {
    // Check if user is enrolled
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: id,
        },
      },
    });

    if (!enrollment) {
      return res.status(403).json({ success: false, message: 'Only enrolled students can leave reviews' });
    }

    const review = await prisma.review.create({
      data: {
        rating: Number(rating),
        comment,
        userId,
        courseId: id,
      },
    });

    res.status(201).json({ success: true, message: 'Review submitted', data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit review', error });
  }
};
