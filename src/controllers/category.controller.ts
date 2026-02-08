import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const getCategories = async (req: Request, res: Response) => {
  try {
    // Distinct categories from existing courses
    const categories = await prisma.course.findMany({
      select: { category: true },
      distinct: ['category'],
    });
    
    const categoryList = categories.map(c => c.category);
    
    // Add some default ones if empty or just return the list
    res.status(200).json({ success: true, data: categoryList });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories', error });
  }
};
