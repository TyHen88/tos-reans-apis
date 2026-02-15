import { Request } from 'express';
import logger from './logger';

export class IPUtils {
  static getClientIP(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.socket.remoteAddress || 'unknown';
  }

  static async getLocation(ip: string): Promise<string | null> {
    // Skip for localhost/private IPs
    if (ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip === '::1') {
      return 'Local Network';
    }

    try {
      const response = await fetch(`https://ipapi.co/${ip}/json/`, {
        signal: (AbortSignal as any).timeout(3000), // 3 second timeout
      });

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as any;

      if (data.city && data.country_name) {
        return `${data.city}, ${data.country_name}`;
      }

      return data.country_name || null;
    } catch (error) {
      logger.warn('Geolocation failed:', error);
      return null;
    }
  }
}
