import React from 'react';
import { cn } from '@/shared/utils/cn';

export interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ className, hasError, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn('form-select', hasError && 'form-input--error', className)}
      {...props}
    >
      {children}
    </select>
  )
);
FormSelect.displayName = 'FormSelect';
