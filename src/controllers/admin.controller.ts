import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
      }
    });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users', error });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { role } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { role },
    });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update user role', error });
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    // 1. Total Revenue
    const totalRevenue = await prisma.transaction.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amount: true },
    });

    // 2. Monthly Active Users (Simple count of users who logged in or were created this month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const mauCount = await prisma.user.count({
      where: {
        updatedAt: { gte: startOfMonth }
      }
    });

    // 3. Top Performing Courses (by enrollment count)
    const topCourses = await prisma.course.findMany({
      include: {
        _count: { select: { enrollments: true } }
      },
      orderBy: {
        enrollments: { _count: 'desc' }
      },
      take: 5
    });

    res.status(200).json({
      success: true,
      data: {
        totalRevenue: totalRevenue._sum.amount || 0,
        mau: mauCount,
        topCourses: topCourses.map(c => ({
            id: c.id,
            title: c.title,
            enrollments: c._count.enrollments
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats', error });
  }
};
