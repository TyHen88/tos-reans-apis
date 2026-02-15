import { Request } from 'express';
import { prisma } from '../utils/prisma';
import { DeviceDetector } from '../utils/deviceDetector';
import { IPUtils } from '../utils/ipUtils';
import { AppError } from '../utils/AppError';
import crypto from 'crypto';

export class SessionService {
  async createSession(userId: string, req: Request, token: string) {
    const deviceInfo = DeviceDetector.parse(req.headers['user-agent']);
    const ipAddress = IPUtils.getClientIP(req);
    const location = await IPUtils.getLocation(ipAddress);
    const tokenHash = this.hashToken(token);

    return await prisma.session.create({
      data: {
        userId,
        deviceName: deviceInfo.deviceName,
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        ipAddress,
        location,
        tokenHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });
  }

  async getActiveSessions(userId: string) {
    return await prisma.session.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gte: new Date() },
      },
      orderBy: {
        lastActive: 'desc',
      },
    });
  }

  async updateLastActive(sessionId: string): Promise<void> {
    await prisma.session.update({
      where: { id: sessionId },
      data: { lastActive: new Date() },
    }).catch(() => {
      // Silently fail - session might be expired
    });
  }

  async revokeSession(sessionId: string, userId: string, currentSessionId: string): Promise<void> {
    if (sessionId === currentSessionId) {
      throw new AppError('Cannot revoke current session. Please use logout instead.', 400, 'SESSION_003');
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new AppError('Session not found', 404, 'SESSION_001');
    }

    if (session.userId !== userId) {
      throw new AppError('Unauthorized to revoke this session', 403, 'SESSION_002');
    }

    await prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  async validateSession(sessionId: string): Promise<boolean> {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) return false;
    if (session.revokedAt) return false;
    if (session.expiresAt < new Date()) return false;

    return true;
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

export const sessionService = new SessionService();
