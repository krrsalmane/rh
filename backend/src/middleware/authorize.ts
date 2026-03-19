import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/utils/AppError';

type UserRole = 'super_admin' | 'hr_agent' | 'manager' | 'employee';

export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    next();
  };
}
