import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError } from 'zod';

export const validateRequest = (schema: ZodType<any, any>) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: (error as any).issues || (error as ZodError).message, // Fallback
      });
    }
    next(error);
  }
};
