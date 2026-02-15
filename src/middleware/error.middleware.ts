import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { ApiResponse } from '../utils/ApiResponse';
import logger from '../utils/logger';

export const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const code = err instanceof AppError ? err.code : 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'Internal Server Error';

  // Log error with context
  logger.error(`${req.method} ${req.originalUrl} - Error: ${message}`, {
    statusCode,
    code,
    stack: err.stack,
  });

  return ApiResponse.error(res, message, statusCode, code, err.stack);
};
