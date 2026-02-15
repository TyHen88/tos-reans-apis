import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { ApiResponse } from '../utils/ApiResponse';
import { AppError } from '../utils/AppError';
import { slugify } from '../utils/slug';

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
    return ApiResponse.success(res, categories);
  } catch (error) {
    return next(error);
  }
};

export const getAllCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { order: 'asc' },
      });
      return ApiResponse.success(res, categories);
    } catch (error) {
      return next(error);
    }
  };

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  const { name, description, icon, order, isActive } = req.body;
  try {
    const slug = slugify(name);
    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        icon,
        order: Number(order || 0),
        isActive: isActive !== undefined ? !!isActive : true,
      },
    });
    return ApiResponse.success(res, category, 'Category created successfully', 201);
  } catch (error) {
    return next(error);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id as string;
  const data = req.body;
  try {
    if (data.name) {
      data.slug = slugify(data.name);
    }
    const category = await prisma.category.update({
      where: { id },
      data,
    });
    return ApiResponse.success(res, category, 'Category updated successfully');
  } catch (error) {
    return next(error);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id as string;
  try {
    await prisma.category.delete({ where: { id } });
    return ApiResponse.success(res, null, 'Category deleted successfully');
  } catch (error) {
    return next(error);
  }
};
