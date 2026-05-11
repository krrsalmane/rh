import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/utils/AppError';
import { ZodError } from 'zod';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    const fieldErrors = err.flatten().fieldErrors;
    const errorMessages = Object.entries(fieldErrors)
      .map(([field, errors]) => `${field}: ${errors?.join(', ')}`)
      .join('; ');
    
    res.status(400).json({
      status: 'error',
      message: `Validation failed: ${errorMessages}`,
      errors: fieldErrors,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  console.error('Unhandled error:', err);

  const mysqlCode = (err as { code?: string }).code;
  if (mysqlCode === 'ER_DUP_ENTRY') {
    res.status(409).json({ status: 'error', message: 'A record with the same unique value already exists' });
    return;
  }
  if (mysqlCode === 'ER_NO_REFERENCED_ROW_2') {
    res.status(400).json({ status: 'error', message: 'Referenced record does not exist' });
    return;
  }
  if (mysqlCode === 'ER_PARSE_ERROR') {
    res.status(500).json({ status: 'error', message: 'Database query error' });
    return;
  }

  res.status(500).json({
    status: 'error',
    message: 'An unexpected error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
