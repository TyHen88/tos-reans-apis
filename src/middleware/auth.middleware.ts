import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { ApiResponse } from '../utils/ApiResponse';
import { AppError } from '../utils/AppError';
import { sessionService } from '../services/session.service';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return ApiResponse.error(res, 'Authentication required', 401, 'AUTH_001');
  }

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    
    // 1. Validate session if sessionId exists in token
    if (decoded.sessionId) {
      const isValid = await sessionService.validateSession(decoded.sessionId);
      if (!isValid) {
        return ApiResponse.error(res, 'Session expired or revoked', 401, 'AUTH_007');
      }
      
      // Update last active (async, don't await)
      sessionService.updateLastActive(decoded.sessionId).catch(() => {});
    }

    // 2. Fetch full user object for compatibility with other controllers
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return ApiResponse.error(res, 'User no longer exists', 401, 'AUTH_002');
    }

    if (!user.isActive) {
      return ApiResponse.error(res, 'Account is inactive', 401, 'AUTH_008');
    }

    // Attach user and sessionId to request
    (req as any).user = {
      ...user,
      userId: user.id, // For new controllers
      sessionId: decoded.sessionId, // For session management
    };
    
    next();
  } catch (error) {
    return ApiResponse.error(res, 'Invalid or expired token', 401, 'AUTH_002');
  }
};

export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user || user.role !== 'ADMIN') {
    return ApiResponse.error(res, 'Access denied: Requires Admin role', 403, 'AUTH_009');
  }
  next();
};

export const instructorMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user || (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN')) {
    return ApiResponse.error(res, 'Access denied: Requires Instructor role', 403, 'AUTH_010');
  }
  next();
};
