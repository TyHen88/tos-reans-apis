import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const trafficLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Log request
  logger.info(`[REQ] ${req.method} ${req.originalUrl}`, {
    body: req.body,
    params: req.params,
    query: req.query,
    ip: req.ip,
  });

  // Capture response
  const oldJson = res.json;
  const oldSend = res.send;

  res.json = function (data) {
    res.json = oldJson; // solve recursion
    const duration = Date.now() - start;
    logger.info(`[RES] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`, {
      statusCode: res.statusCode,
      body: data,
      duration: `${duration}ms`,
    });
    return oldJson.apply(res, arguments as any);
  };

  res.send = function (data) {
    res.send = oldSend; // solve recursion
    const duration = Date.now() - start;
    
    // Only log if it hasn't been logged by res.json already
    if (!res.headersSent) {
        let responseBody;
        try {
          responseBody = typeof data === 'string' ? JSON.parse(data) : data;
        } catch (e) {
          responseBody = data;
        }

        logger.info(`[RES] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`, {
          statusCode: res.statusCode,
          body: responseBody,
          duration: `${duration}ms`,
        });
    }

    return oldSend.apply(res, arguments as any);
  };

  next();
};
