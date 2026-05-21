import React from 'react';
import { cn } from '@/shared/utils/cn';

interface FormCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormCard: React.FC<FormCardProps> = ({ title, children, className }) => (
  <div className={cn('form-card', className)}>
    {title && <h3 className="form-section-title">{title}</h3>}
    {children}
  </div>
);
