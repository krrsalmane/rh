import React from 'react';
import { cn } from '@/shared/utils/cn';

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, hasError, ...props }, ref) => (
    <input
      ref={ref}
      className={cn('form-input', hasError && 'form-input--error', className)}
      {...props}
    />
  )
);
FormInput.displayName = 'FormInput';
