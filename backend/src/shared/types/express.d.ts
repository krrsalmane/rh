declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        companyId: string;
        role: 'super_admin' | 'hr_agent' | 'manager' | 'employee';
      };
    }
  }
}

export {};
