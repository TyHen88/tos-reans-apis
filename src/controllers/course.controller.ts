import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { Level, Status } from '@prisma/client';

export const getCourses = async (req: Request, res: Response) => {
  const { search, category, level, price, status, page = '1', limit = '10' } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: any = {
    status: (status as Status) || 'PUBLISHED',
  };

  if (search) {
    where.OR = [
      { title: { contains: String(search), mode: 'insensitive' } },
      { description: { contains: String(search), mode: 'insensitive' } },
    ];
  }

  if (category) where.category = String(category);
  if (level) where.level = level as Level;
  if (price) where.price = { lte: Number(price) };

  try {
    const [courses, total] = await prisma.$transaction([
      prisma.course.findMany({
        where,
        skip,
        take,
        include: {
          instructor: { select: { name: true, avatar: true } },
          _count: { select: { lessons: true, enrollments: true } },
          reviews: { select: { rating: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.course.count({ where }),
    ]);

    const formattedCourses = courses.map((course) => {
      const totalRating = course.reviews.reduce((acc: number, review: { rating: number }) => acc + review.rating, 0);
      const avgRating = course.reviews.length > 0 ? totalRating / course.reviews.length : 0;

      return {
        ...course,
        lessonsCount: course._count.lessons,
        studentsCount: course._count.enrollments,
        rating: avgRating,
      };
    });

    res.status(200).json({
      success: true,
      data: formattedCourses,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch courses', error });
  }
};

export const getCourseById = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  try {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        lessons: { orderBy: { order: 'asc' } },
        instructor: { select: { name: true, avatar: true, bio: true } },
        _count: { select: { lessons: true, enrollments: true } },
        reviews: {
          include: { user: { select: { name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const totalRating = course.reviews.reduce((acc: number, review: { rating: number }) => acc + review.rating, 0);
    const avgRating = course.reviews.length > 0 ? totalRating / course.reviews.length : 0;

    const formattedCourse = {
      ...course,
      lessonsCount: course._count.lessons,
      studentsCount: course._count.enrollments,
      rating: avgRating,
    };

    res.status(200).json({ success: true, data: formattedCourse });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch course', error });
  }
};

export const createCourse = async (req: Request, res: Response) => {
  const { title, description, price, level, category, tags, thumbnail, videoUrl } = req.body;
  const instructorId = (req as any).user.id;

  try {
    const newCourse = await prisma.course.create({
      data: {
        title,
        description: description || '',
        price: price || 0,
        level: (level as Level) || 'BEGINNER',
        category: category || 'General',
        tags: tags || [],
        thumbnail,
        videoUrl,
        instructorId,
        status: 'DRAFT',
      },
    });

    res.status(201).json({ success: true, message: 'Course created successfully', data: newCourse });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create course', error });
  }
};

export const updateCourse = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const data = req.body;

  try {
    const updatedCourse = await prisma.course.update({
      where: { id },
      data,
    });
    res.status(200).json({ success: true, message: 'Course updated', data: updatedCourse });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update course', error });
  }
};

export const deleteCourse = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  try {
    // Soft delete / Archive as per new doc
    await prisma.course.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
    res.status(200).json({ success: true, message: 'Course archived' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to archive course', error });
  }
};
