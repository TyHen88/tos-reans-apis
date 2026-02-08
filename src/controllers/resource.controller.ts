import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const getResources = async (req: Request, res: Response) => {
  const { category } = req.query;
  try {
    const resources = await prisma.resource.findMany({
      where: category ? { category: String(category) } : {},
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, data: resources });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch resources', error });
  }
};

export const createResource = async (req: Request, res: Response) => {
  const { title, description, type, url, category } = req.body;
  try {
    const resource = await prisma.resource.create({
      data: { title, description, type, url, category },
    });
    res.status(201).json({ success: true, data: resource });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create resource', error });
  }
};

export const deleteResource = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  try {
    await prisma.resource.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Resource deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete resource', error });
  }
};
