import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import admin from '../utils/firebase';
import { ApiResponse } from '../utils/ApiResponse';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';
import { sessionService } from '../services/session.service';
import crypto from 'crypto';

export const sync = async (req: Request, res: Response, next: NextFunction) => {
  const { idToken } = req.body;

  if (!idToken) {
    return next(new AppError('idToken is required', 400, 'AUTH_001'));
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    let user = await prisma.user.upsert({
      where: { email: email || '' },
      update: {
        firebaseUid: uid,
        name: name || 'User',
        avatar: picture,
        lastLoginAt: new Date(),
        isActive: true,
      },
      create: {
        email: email || '',
        firebaseUid: uid,
        name: name || 'User',
        avatar: picture,
        role: 'STUDENT',
        lastLoginAt: new Date(),
        isActive: true,
      },
    });

    // Create session
    const tempToken = 'temp';
    const session = await sessionService.createSession(user.id, req, tempToken);

    // Create token with sessionId
    const token = jwt.sign(
      { 
        userId: user.id, 
        sessionId: session.id,
        role: user.role 
      }, 
      process.env.JWT_SECRET || 'secret', 
      { expiresIn: '7d' }
    );

    // Update session with actual token hash
    await prisma.session.update({
      where: { id: session.id },
      data: { 
        tokenHash: crypto.createHash('sha256').update(token).digest('hex')
      }
    });

    return ApiResponse.success(res, { user, token }, 'Sync successful');
  } catch (error: any) {
    let message = 'Invalid Firebase token';
    let code = 'AUTH_002';
    
    if (error.code === 'auth/argument-error') {
      message = 'Decoding Firebase ID token failed. Token is malformed or missing.';
      code = 'AUTH_003';
    } else if (error.code === 'auth/id-token-expired') {
      message = 'Firebase ID token has expired. Please refresh the token on the frontend.';
      code = 'AUTH_004';
    }

    return next(new AppError(message, 401, code));
  }
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password, name, role } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return next(new AppError('User already exists', 400, 'AUTH_006'));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name,
        role: role || 'STUDENT',
        lastLoginAt: new Date(),
      },
      select: { id: true, email: true, name: true, role: true, avatar: true },
    });

    // Create session
    const tempToken = 'temp';
    const session = await sessionService.createSession(user.id, req, tempToken);

    // Create token with sessionId
    const token = jwt.sign(
      { 
        userId: user.id, 
        sessionId: session.id,
        role: user.role 
      }, 
      process.env.JWT_SECRET || 'secret', 
      { expiresIn: '7d' }
    );

    // Update session with actual token hash
    await prisma.session.update({
      where: { id: session.id },
      data: { 
        tokenHash: crypto.createHash('sha256').update(token).digest('hex')
      }
    });

    return ApiResponse.success(res, { user, token }, 'User created successfully', 201);
  } catch (error) {
    return next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return next(new AppError('Invalid credentials', 400, 'AUTH_005'));
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash || '');
    if (!isMatch) {
      return next(new AppError('Invalid credentials', 400, 'AUTH_005'));
    }

    // Create session
    const tempToken = 'temp';
    const session = await sessionService.createSession(user.id, req, tempToken);

    // Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Create token with sessionId
    const token = jwt.sign(
      { 
        userId: user.id, 
        sessionId: session.id,
        role: user.role 
      }, 
      process.env.JWT_SECRET || 'secret', 
      { expiresIn: '7d' }
    );

    // Update session with actual token hash
    await prisma.session.update({
      where: { id: session.id },
      data: { 
        tokenHash: crypto.createHash('sha256').update(token).digest('hex')
      }
    });

    const { passwordHash, ...userWithoutPassword } = user;

    return ApiResponse.success(res, { user: userWithoutPassword, token }, 'Logged in successfully');
  } catch (error) {
    return next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          bio: true,
          createdAt: true,
          updatedAt: true,
      }
    });
    
    if (!user) {
      return next(new AppError('User not found', 404, 'USER_001'));
    }

    return ApiResponse.success(res, user);
  } catch (error) {
    return next(error);
  }
};
