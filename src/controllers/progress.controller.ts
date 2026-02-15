import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { ApiResponse } from '../utils/ApiResponse';
import { AppError } from '../utils/AppError';

export const updateLessonProgress = async (req: Request, res: Response, next: NextFunction) => {
  const lessonId = req.params.lessonId as string;
  const { isCompleted, watchedDuration, lastPosition, courseId } = req.body;
  const userId = (req as any).user.id;

  try {
    const progress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: userId as string,
          lessonId: lessonId as string,
        },
      },
      update: {
        isCompleted: isCompleted !== undefined ? !!isCompleted : undefined,
        watchedDuration: watchedDuration !== undefined ? Number(watchedDuration) : undefined,
        lastPosition: lastPosition !== undefined ? Number(lastPosition) : undefined,
        completedAt: isCompleted ? new Date() : undefined,
      },
      create: {
        userId: userId as string,
        lessonId: lessonId as string,
        courseId: courseId as string,
        isCompleted: !!isCompleted,
        watchedDuration: Number(watchedDuration || 0),
        lastPosition: Number(lastPosition || 0),
        completedAt: isCompleted ? new Date() : null,
      },
    });

    // If completed, update enrollment overall progress
    if (isCompleted) {
        const completedLessons = await prisma.lessonProgress.count({
            where: { userId, courseId, isCompleted: true }
        });
        const totalLessons = await prisma.lesson.count({
            where: { courseId }
        });

        const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        await prisma.enrollment.update({
            where: { userId_courseId: { userId, courseId } },
            data: { 
                progress: progressPercent,
                lastAccessedAt: new Date()
            }
        });
    }

    return ApiResponse.success(res, progress, 'Progress updated successfully');
  } catch (error) {
    return next(error);
  }
};

export const getCourseProgress = async (req: Request, res: Response, next: NextFunction) => {
    const courseId = req.params.courseId as string;
    const userId = (req as any).user.id;

    try {
        const progress = await prisma.lessonProgress.findMany({
            where: { 
                userId: userId as string, 
                courseId: courseId as string 
            }
        });
        return ApiResponse.success(res, progress);
    } catch (error) {
        return next(error);
    }
};
