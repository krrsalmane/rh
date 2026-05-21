import React from 'react';
import { cn } from '@/shared/utils/cn';

export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ className, hasError, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn('form-textarea', hasError && 'form-input--error', className)}
      {...props}
    />
  )
);
FormTextarea.displayName = 'FormTextarea';
