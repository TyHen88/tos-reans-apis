import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { ApiResponse } from '../utils/ApiResponse';
import { AppError } from '../utils/AppError';

export const getCourseReviews = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params as { id: string };
  try {
    const reviews = await prisma.review.findMany({
      where: { courseId: id, isPublished: true },
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
    return ApiResponse.success(res, reviews);
  } catch (error) {
    return next(error);
  }
};

export const createReview = async (req: Request, res: Response, next: NextFunction) => {
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
      return next(new AppError('Only enrolled students can leave reviews', 403));
    }

    // Check if verified purchase
    const isVerifiedPurchase = !!enrollment;

    const review = await prisma.$transaction(async (tx) => {
        const _review = await tx.review.upsert({
            where: {
                userId_courseId: {
                    userId,
                    courseId: id,
                },
            },
            create: {
                rating: Number(rating),
                comment,
                userId,
                courseId: id,
                isVerifiedPurchase,
            },
            update: {
                rating: Number(rating),
                comment,
                isVerifiedPurchase,
            }
        });

        // Update course stats
        const stats = await tx.review.aggregate({
            where: { courseId: id, isPublished: true },
            _avg: { rating: true },
            _count: { rating: true },
        });

        await tx.course.update({
            where: { id },
            data: {
                averageRating: stats._avg.rating || 0,
                totalRatings: stats._count.rating || 0,
            }
        });

        return _review;
    });

    return ApiResponse.success(res, review, 'Review submitted successfully');
  } catch (error) {
    return next(error);
  }
};
