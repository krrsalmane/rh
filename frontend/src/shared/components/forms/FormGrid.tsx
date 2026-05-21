import React from 'react';
import { cn } from '@/shared/utils/cn';

interface FormGridProps {
  children: React.ReactNode;
  className?: string;
}

export const FormGrid: React.FC<FormGridProps> = ({ children, className }) => (
  <div className={cn('form-grid', className)}>{children}</div>
);
