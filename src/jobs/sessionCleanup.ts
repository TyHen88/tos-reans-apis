import { prisma } from '../utils/prisma';
import logger from '../utils/logger';

export const cleanupExpiredSessions = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deletedExpired = await prisma.session.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    const deletedRevoked = await prisma.session.deleteMany({
      where: {
        revokedAt: { lt: thirtyDaysAgo },
      },
    });

    const totalDeleted = deletedExpired.count + deletedRevoked.count;
    if (totalDeleted > 0) {
      logger.info(`Session cleanup successful: deleted ${totalDeleted} sessions.`);
    }
  } catch (error) {
    logger.error('Session cleanup failed:', error);
  }
};

// If run directly
if (require.main === module) {
  cleanupExpiredSessions()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
