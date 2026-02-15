import winston from 'winston';

const SENSITIVE_FIELDS = ['password', 'token', 'idToken', 'apiKey', 'secret', 'authorization', 'cookie'];

const maskSensitiveData = (data: any): any => {
  if (!data) return data;
  if (typeof data !== 'object') return data;

  const masked = { ...data };
  for (const key in masked) {
    if (SENSITIVE_FIELDS.includes(key.toLowerCase())) {
      masked[key] = '[REDACTED]';
    } else if (typeof masked[key] === 'object') {
      masked[key] = maskSensitiveData(masked[key]);
    }
  }
  return masked;
};

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(maskSensitiveData(meta), null, 2) : '';
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        })
      ),
    }),
  ],
});

export default logger;
