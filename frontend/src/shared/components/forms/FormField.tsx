import React from 'react';
import { cn } from '@/shared/utils/cn';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  children,
  className,
  htmlFor,
}) => (
  <div className={cn('form-field', className)}>
    <label className="form-label" htmlFor={htmlFor}>
      {label}
      {required && <span className="form-required">*</span>}
    </label>
    {children}
    {error && <p className="form-error">{error}</p>}
  </div>
);
