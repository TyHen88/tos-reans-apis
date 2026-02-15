import { prisma } from '../utils/prisma';
import { AppError } from '../utils/AppError';

interface SecurityScore {
  score: number;
  level: 'Excellent' | 'Good' | 'Needs Attention';
  factors: {
    hasPassword: boolean;
    hasGoogleAuth: boolean;
    sessionCount: number;
    emailVerified: boolean;
  };
}

export class SecurityScoreService {
  async calculateScore(userId: string): Promise<SecurityScore> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sessions: {
          where: {
            revokedAt: null,
            expiresAt: { gte: new Date() },
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_001');
    }

    let score = 40; // Base score

    const factors = {
      hasPassword: !!user.passwordHash,
      hasGoogleAuth: !!user.firebaseUid,
      sessionCount: user.sessions.length,
      emailVerified: user.isEmailVerified,
    };

    // Scoring logic as per spec
    if (factors.hasPassword) score += 20;
    if (factors.hasGoogleAuth) score += 15;
    if (factors.sessionCount <= 3) score += 15;
    if (factors.emailVerified) score += 10;

    const level = score >= 80 ? 'Excellent' : score >= 50 ? 'Good' : 'Needs Attention';

    return { score, level, factors };
  }
}

export const securityScoreService = new SecurityScoreService();
