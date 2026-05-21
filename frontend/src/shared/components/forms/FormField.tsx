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
}) => {
  // If htmlFor not provided, try to derive from child's name prop and inject an id
  let child = children as React.ReactNode;
  let derivedId: string | undefined = htmlFor;

  if (!htmlFor && React.isValidElement(children)) {
    const childProps: any = (children as any).props || {};
    if (!childProps.id && childProps.name) {
      derivedId = `${childProps.name}-field`;
      child = React.cloneElement(children as React.ReactElement, { id: derivedId });
    }
  }

  return (
    <div className={cn('form-field', className)}>
      <label className="form-label" htmlFor={derivedId}>
        {label}
        {required && <span className="form-required">*</span>}
      </label>
      {child}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
};
