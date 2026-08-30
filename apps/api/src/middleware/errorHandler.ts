import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: AppError | ZodError | Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request input data',
        details: err.errors,
      },
    });
  }

  const statusCode = (err as AppError).statusCode || 500;
  const code = (err as AppError).code || (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST');
  const message = err.message || 'An unexpected error occurred';

  if (process.env.NODE_ENV !== 'test' && statusCode === 500) {
    console.error('[Error Handler]', err);
  }

  return res.status(statusCode).json({
    error: {
      code,
      message,
    },
  });
}
