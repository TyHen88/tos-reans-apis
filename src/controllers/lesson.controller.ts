import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { ApiResponse } from '../utils/ApiResponse';
import { AppError } from '../utils/AppError';
import { slugify } from '../utils/slug';

export const getLessons = async (req: Request, res: Response, next: NextFunction) => {
  const { courseId } = req.params as { courseId: string };
  try {
    const lessons = await prisma.lesson.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
    });
    return ApiResponse.success(res, lessons);
  } catch (error) {
    return next(error);
  }
};

export const createLesson = async (req: Request, res: Response, next: NextFunction) => {
  const { courseId } = req.params as { courseId: string };
  const { title, description, duration, isFree, videoUrl, videoProvider, order, attachments, isPublished } = req.body;

  try {
    // Generate unique slug for lesson within the course
    const slug = slugify(title);
    
    const lesson = await prisma.lesson.create({
      data: {
        title,
        slug,
        description,
        duration: Number(duration),
        isFree: !!isFree,
        isPublished: isPublished !== undefined ? !!isPublished : true,
        videoUrl,
        videoProvider,
        order: Number(order),
        attachments: attachments || [],
        courseId,
      },
    });
    return ApiResponse.success(res, lesson, 'Lesson created successfully', 201);
  } catch (error) {
    return next(error);
  }
};

export const bulkCreateLessons = async (req: Request, res: Response, next: NextFunction) => {
  const { courseId } = req.params as { courseId: string };
  const { lessons } = req.body;

  try {
    await prisma.$transaction(async (tx) => {
      // Clear old lessons
      await tx.lesson.deleteMany({ where: { courseId } });
      
      // Create new ones with slugs
      for (const l of lessons) {
        await tx.lesson.create({
            data: {
                title: l.title,
                slug: l.slug || slugify(l.title),
                description: l.description,
                videoUrl: l.videoUrl,
                videoProvider: l.videoProvider,
                duration: Number(l.duration || 0),
                order: Number(l.order || 0),
                isFree: !!l.isFree,
                isPublished: l.isPublished !== undefined ? !!l.isPublished : true,
                attachments: l.attachments || [],
                courseId,
            }
        });
      }
    });

    const updatedLessons = await prisma.lesson.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
    });

    return ApiResponse.success(res, updatedLessons, 'Lessons bulk updated successfully');
  } catch (error) {
    return next(error);
  }
};

export const updateLesson = async (req: Request, res: Response, next: NextFunction) => {
  const { lessonId } = req.params as { lessonId: string };
  const { id, courseId, createdAt, updatedAt, ...data } = req.body;

  try {
    if (data.title && !data.slug) {
        data.slug = slugify(data.title);
    }

    const lesson = await prisma.lesson.update({
      where: { id: lessonId },
      data,
    });
    return ApiResponse.success(res, lesson, 'Lesson updated successfully');
  } catch (error) {
    return next(error);
  }
};

export const deleteLesson = async (req: Request, res: Response, next: NextFunction) => {
  const { lessonId } = req.params as { lessonId: string };
  try {
    await prisma.lesson.delete({ where: { id: lessonId } });
    return ApiResponse.success(res, null, 'Lesson deleted successfully');
  } catch (error) {
    return next(error);
  }
};
