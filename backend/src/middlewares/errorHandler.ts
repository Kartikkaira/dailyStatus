import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // If response headers are already sent, delegate to standard Express handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const issues = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    res.status(400).json({
      error: 'Validation failed',
      details: issues,
    });
    return;
  }

  // Handle Prisma Database Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002 is Unique constraint violation
    if (err.code === 'P2002') {
      res.status(409).json({
        error: 'A record with these unique details already exists.',
        code: err.code,
      });
      return;
    }
    // P2025 Record not found
    if (err.code === 'P2025') {
      res.status(404).json({
        error: 'Requested record was not found.',
        code: err.code,
      });
      return;
    }
  }

  // Log unexpected errors
  console.error('Unhandled Server Error:', err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
