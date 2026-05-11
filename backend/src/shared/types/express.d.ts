declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        companyId: string;
        role: 'super_admin' | 'hr_agent' | 'manager' | 'employee';
        employeeId?: string | null;
      };
    }
  }
}

export {};
