import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const getLessons = async (req: Request, res: Response) => {
  const { courseId } = req.params as { courseId: string };
  try {
    const lessons = await prisma.lesson.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
    });
    res.status(200).json({ success: true, data: lessons });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch lessons', error });
  }
};

export const createLesson = async (req: Request, res: Response) => {
  const { courseId } = req.params as { courseId: string };
  const { title, description, duration, isFree, videoUrl, order, attachments } = req.body;

  try {
    const lesson = await prisma.lesson.create({
      data: {
        title,
        description,
        duration: Number(duration),
        isFree,
        videoUrl,
        order: Number(order),
        attachments: attachments || [],
        courseId,
      },
    });
    res.status(201).json({ success: true, message: 'Lesson created', data: lesson });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create lesson', error });
  }
};

export const bulkCreateLessons = async (req: Request, res: Response) => {
  const { courseId } = req.params as { courseId: string };
  const { lessons } = req.body; // Expects array of { title, description, etc. }

  try {
    // Delete existing lessons and recreate for a clean "Course Wizard" save logic
    // or simply use createMany if prisma supports it and you want to append.
    // Given Wizard logic, often it's a full replace or careful sync.
    // Let's implement an upsert-like behavior or clear-and-create.
    
    await prisma.$transaction([
      prisma.lesson.deleteMany({ where: { courseId } }),
      prisma.lesson.createMany({
        data: lessons.map((l: any) => ({
          ...l,
          courseId,
          duration: Number(l.duration || 0),
          order: Number(l.order || 0),
          attachments: l.attachments || [],
        })),
      }),
    ]);

    const updatedLessons = await prisma.lesson.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
    });

    res.status(200).json({ success: true, message: 'Lessons updated successfully', data: updatedLessons });
  } catch (error) {
    console.error('Bulk lesson error:', error);
    res.status(500).json({ success: false, message: 'Failed to bulk update lessons', error });
  }
};

export const updateLesson = async (req: Request, res: Response) => {
  const { lessonId } = req.params as { lessonId: string };
  const data = req.body;

  try {
    const lesson = await prisma.lesson.update({
      where: { id: lessonId },
      data,
    });
    res.status(200).json({ success: true, message: 'Lesson updated', data: lesson });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update lesson', error });
  }
};

export const deleteLesson = async (req: Request, res: Response) => {
  const { lessonId } = req.params as { lessonId: string };
  try {
    await prisma.lesson.delete({ where: { id: lessonId } });
    res.status(200).json({ success: true, message: 'Lesson deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete lesson', error });
  }
};
