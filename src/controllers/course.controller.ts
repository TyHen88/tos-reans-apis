import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { Level, Status } from '@prisma/client';
import { ApiResponse } from '../utils/ApiResponse';
import { AppError } from '../utils/AppError';
import { slugify, generateUniqueSlug } from '../utils/slug';

export const getCourses = async (req: Request, res: Response, next: NextFunction) => {
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
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.course.count({ where }),
    ]);

    const formattedCourses = courses.map((course:any) => {
      return {
        ...course,
        lessonsCount: course._count.lessons,
        studentsCount: course.enrollmentCount,
        rating: Number(course.averageRating || 0),
      };
    });

    return res.status(200).json({
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
    return next(error);
  }
};

export const getCourseById = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params as { id: string };
  try {
    const course:any = await prisma.course.findUnique({
      where: { id },
      include: {
        lessons: { orderBy: { order: 'asc' } },
        instructor: { select: { name: true, avatar: true, bio: true } },
        _count: { select: { lessons: true, enrollments: true } },
      },
    });

    if (!course) {
      return next(new AppError('Course not found', 404, 'COURSE_001'));
    }

    const formattedCourse:any = {
      ...course,
      lessonsCount: course._count.lessons,
      studentsCount: course?.enrollmentCount,
      rating: Number(course?.averageRating || 0),
    };

    return ApiResponse.success(res, formattedCourse);
  } catch (error) {
    return next(error);
  }
};

export const createCourse = async (req: Request, res: Response, next: NextFunction) => {
  const { title, description, price, level, category, tags, thumbnail, videoUrl } = req.body;
  const user = (req as any).user;
  const instructorId = user.id;
  const instructorName = user.name;

  try {
    const slug = await generateUniqueSlug(title, prisma.course);
    
    const newCourse = await prisma.course.create({
      data: {
        title,
        slug,
        description: description || '',
        price: price || 0,
        level: (level as Level) || 'BEGINNER',
        category: category || 'General',
        tags: tags || [],
        thumbnail,
        videoUrl,
        instructorId,
        instructorName,
        status: 'DRAFT',
      },
    });

    return ApiResponse.success(res, newCourse, 'Course created successfully', 201);
  } catch (error) {
    return next(error);
  }
};

export const updateCourse = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params as { id: string };
  const { instructor, _count, reviews, rating, lessonsCount, studentsCount, ...rest } = req.body;

  try {
    const data: any = { ...rest };
    
    // If title changes, we might want to update the slug (optional dependency on business rules)
    if (data.title) {
        // Only update slug if it was explicitly asked or if we want it to stay in sync
        // For SEO, usually slugs shouldn't change, but here we'll update if provided or if logic dictates
    }

    // Handle publishedAt
    if (data.status === 'PUBLISHED') {
        const existing:any = await prisma.course.findUnique({ where: { id } });
        if (existing && !existing?.publishedAt) {
            data.publishedAt = new Date();
        }
    }

    // Convert price to Decimal if it exists as a string
    if (data.price !== undefined) {
      data.price = Number(data.price);
    }

    const updatedCourse = await prisma.course.update({
      where: { id },
      data,
    });
    
    return ApiResponse.success(res, updatedCourse, 'Course updated successfully');
  } catch (error) {
    return next(error);
  }
};

export const deleteCourse = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params as { id: string };
  try {
    // Soft delete / Archive as per new doc
    await prisma.course.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
    return ApiResponse.success(res, null, 'Course archived successfully');
  } catch (error) {
    return next(error);
  }
};
