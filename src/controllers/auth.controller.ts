import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import admin from '../utils/firebase';

export const sync = async (req: Request, res: Response) => {
  const { idToken } = req.body;

  console.log('[Auth] Sync request received. Body keys:', Object.keys(req.body));
  
  if (!idToken) {
    console.error('[Auth] Sync failed: No idToken provided in request body');
    return res.status(400).json({ success: false, message: 'idToken is required' });
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
      },
      create: {
        email: email || '',
        firebaseUid: uid,
        name: name || 'User',
        avatar: picture,
        role: 'STUDENT',
      },
    });

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '7d',
    });

    res.status(200).json({ success: true, data: { user, token } });
  } catch (error: any) {
    console.error('[Auth] Firebase verifyIdToken error:', error.code || 'Unknown', error.message);
    
    let message = 'Invalid Firebase token';
    if (error.code === 'auth/argument-error') {
      message = 'Decoding Firebase ID token failed. Token is malformed or missing.';
    } else if (error.code === 'auth/id-token-expired') {
      message = 'Firebase ID token has expired. Please refresh the token on the frontend.';
    }

    res.status(401).json({ success: false, message, technicalDetail: error.message });
  }
};

export const register = async (req: Request, res: Response) => {
  const { email, password, name, role } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name,
        role: role || 'STUDENT',
      },
      select: { id: true, email: true, name: true, role: true, avatar: true },
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '7d',
    });

    res.status(201).json({ success: true, message: 'User created successfully', data: { user, token } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash || '');
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '7d',
    });

    const { passwordHash, ...userWithoutPassword } = user;

    res.status(200).json({ success: true, message: 'Logged in successfully', data: { user: userWithoutPassword, token } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
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
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};
