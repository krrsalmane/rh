import React from 'react';
import { cn } from '@/shared/utils/cn';
import type { FormWizardStep } from './FormWizard';

interface FormWizardNavProps {
  steps: FormWizardStep[];
  currentStep: number;
  onStepClick?: (index: number) => void;
  className?: string;
}

/** Step indicator only — use when an outer form owns the footer actions. */
export const FormWizardNav: React.FC<FormWizardNavProps> = ({
  steps,
  currentStep,
  onStepClick,
  className,
}) => (
  <nav className={cn('form-wizard-nav', className)} aria-label="Étapes">
    <ol className="form-wizard-steps">
      {steps.map((s, index) => {
        const isActive = index === currentStep;
        const isDone = index < currentStep;
        const canClick = onStepClick && (isDone || isActive);

        return (
          <li
            key={s.id}
            className={cn(
              'form-wizard-step',
              isActive && 'form-wizard-step--active',
              isDone && 'form-wizard-step--done'
            )}
          >
            <button
              type="button"
              className="form-wizard-step-button"
              onClick={canClick ? () => onStepClick(index) : undefined}
              disabled={!canClick}
              aria-current={isActive ? 'step' : undefined}
            >
              <span className="form-wizard-step-index">{isDone ? '✓' : index + 1}</span>
              <span className="form-wizard-step-label">{s.title}</span>
            </button>
          </li>
        );
      })}
    </ol>
  </nav>
);
