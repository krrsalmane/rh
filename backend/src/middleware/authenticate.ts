import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../config/jwt';
import { AppError } from '../shared/utils/AppError';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.id,
      email: payload.email,
      companyId: payload.companyId,
      role: payload.role as 'super_admin' | 'hr_agent' | 'manager' | 'employee',
      employeeId: payload.employeeId,
    };
    next();
  } catch {
    return next(new AppError('Invalid or expired token', 401));
  }
}
