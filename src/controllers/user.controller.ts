import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { ApiResponse } from '../utils/ApiResponse';
import { AppError } from '../utils/AppError';
import { PasswordValidator } from '../utils/passwordValidator';
import { sessionService } from '../services/session.service';
import { securityScoreService } from '../services/securityScore.service';
import bcrypt from 'bcrypt';

// GET /api/user/profile
export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        bio: true,
        firebaseUid: true,
        createdAt: true,
        updatedAt: true,
        passwordHash: true, // We'll transform this
      },
    });

    if (!user) {
      return next(new AppError('User not found', 404, 'USER_001'));
    }

    // Transform response
    const { passwordHash, ...userWithoutHash } = user;
    const response = {
      ...userWithoutHash,
      hasPassword: !!passwordHash,
    };

    return ApiResponse.success(res, response);
  } catch (error) {
    return next(error);
  }
};

// PUT /api/user/profile
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const { name, email, bio } = req.body;

    // Validation
    if (!name || name.length < 2 || name.length > 100) {
      return next(new AppError('Name must be between 2 and 100 characters', 400, 'VALIDATION_001'));
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return next(new AppError('Valid email is required', 400, 'VALIDATION_002'));
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser && existingUser.id !== userId) {
      return next(new AppError('Email already in use', 409, 'USER_002'));
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name, email, bio },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        role: true,
        updatedAt: true,
      },
    });

    return ApiResponse.success(res, updatedUser, 'Profile updated successfully');
  } catch (error) {
    return next(error);
  }
};

// POST /api/user/password/add
export const addPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const { newPassword, confirmPassword } = req.body;

    // Get user
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return next(new AppError('User not found', 404, 'USER_001'));
    }

    // Check if user already has a password
    if (user.passwordHash) {
      return next(new AppError('User already has a password. Use change password instead.', 400, 'PASSWORD_003'));
    }

    // Check if user has Google auth
    if (!user.firebaseUid) {
      return next(new AppError('This endpoint is for Google users only', 400, 'PASSWORD_004'));
    }

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      return next(new AppError('Passwords do not match', 400, 'PASSWORD_005'));
    }

    // Validate password strength
    const validation = PasswordValidator.validate(newPassword);
    if (!validation.valid) {
      return next(new AppError(validation.errors.join(', '), 400, 'PASSWORD_006'));
    }

    // Hash and save password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    return ApiResponse.success(res, {
      message: 'Password added successfully',
      hasPassword: true,
    });
  } catch (error) {
    return next(error);
  }
};

// PUT /api/user/password/change
export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Get user
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return next(new AppError('User not found', 404, 'USER_001'));
    }

    // Check if user has a password
    if (!user.passwordHash) {
      return next(new AppError('No password set. Use add password endpoint instead.', 403, 'PASSWORD_001'));
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return next(new AppError('Current password is incorrect', 401, 'PASSWORD_002'));
    }

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      return next(new AppError('New passwords do not match', 400, 'PASSWORD_005'));
    }

    // Check if new password is same as old
    const isSameAsOld = await PasswordValidator.isSameAsOld(newPassword, user.passwordHash);
    if (isSameAsOld) {
      return next(new AppError('New password must be different from current password', 400, 'PASSWORD_007'));
    }

    // Validate password strength
    const validation = PasswordValidator.validate(newPassword);
    if (!validation.valid) {
      return next(new AppError(validation.errors.join(', '), 400, 'PASSWORD_006'));
    }

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    return ApiResponse.success(res, { message: 'Password changed successfully' });
  } catch (error) {
    return next(error);
  }
};

// GET /api/user/sessions
export const getSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const currentSessionId = (req as any).user.sessionId;

    const sessions = await sessionService.getActiveSessions(userId);

    const formattedSessions = sessions.map((session: any) => ({
      id: session.id,
      deviceName: session.deviceName,
      deviceType: session.deviceType,
      browser: session.browser,
      location: session.location,
      ipAddress: session.ipAddress,
      lastActive: session.lastActive,
      isCurrent: session.id === currentSessionId,
      createdAt: session.createdAt,
    }));

    return ApiResponse.success(res, { sessions: formattedSessions });
  } catch (error) {
    return next(error);
  }
};

// DELETE /api/user/sessions/:sessionId
export const revokeSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const currentSessionId = (req as any).user.sessionId;
    const { sessionId } = req.params;

    await sessionService.revokeSession(sessionId as string, userId, currentSessionId as string);

    return ApiResponse.success(res, { message: 'Session revoked successfully' });
  } catch (error) {
    return next(error);
  }
};

// GET /api/user/security-score
export const getSecurityScore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const score = await securityScoreService.calculateScore(userId);

    return ApiResponse.success(res, score);
  } catch (error) {
    return next(error);
  }
};

// POST /api/user/avatar
export const uploadAvatar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;

    if (!req.file) {
      return next(new AppError('No file uploaded', 400, 'UPLOAD_001'));
    }

    const avatarUrl = `/uploads/${req.file.filename}`;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        name: true,
        avatar: true,
        updatedAt: true,
      },
    });

    return ApiResponse.success(res, updatedUser, 'Avatar uploaded successfully');
  } catch (error) {
    return next(error);
  }
};
