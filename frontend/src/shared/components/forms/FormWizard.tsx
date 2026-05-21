import React from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export interface FormWizardStep {
  id: string;
  title: string;
  description?: string;
}

interface FormWizardProps {
  steps: FormWizardStep[];
  currentStep: number;
  onCancel: () => void;
  onBack: () => void;
  onNext: () => void;
  onSubmit?: () => void;
  children: React.ReactNode;
  isLoading?: boolean;
  submitText?: string;
  nextText?: string;
  nextDisabled?: boolean;
  /** Allow jumping to completed steps via the stepper */
  onStepClick?: (index: number) => void;
  className?: string;
}

export const FormWizard: React.FC<FormWizardProps> = ({
  steps,
  currentStep,
  onCancel,
  onBack,
  onNext,
  onSubmit,
  children,
  isLoading = false,
  submitText = 'Enregistrer',
  nextText = 'Suivant',
  nextDisabled = false,
  onStepClick,
  className,
}) => {
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const step = steps[currentStep];

  return (
    <div className={cn('form-wizard', className)}>
      <nav className="form-wizard-nav" aria-label="Étapes du formulaire">
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
                  <span className="form-wizard-step-index">
                    {isDone ? '✓' : index + 1}
                  </span>
                  <span className="form-wizard-step-label">{s.title}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {step?.description && (
        <p className="form-wizard-description">{step.description}</p>
      )}

      <div className="form-wizard-panel">{children}</div>

      <div className="form-footer form-wizard-footer">
        <button type="button" className="btn-form-cancel" onClick={onCancel} disabled={isLoading}>
          Annuler
        </button>
        <div className="form-wizard-footer-actions">
          {!isFirst && (
            <button type="button" className="btn-form-cancel" onClick={onBack} disabled={isLoading}>
              <ChevronLeft className="h-4 w-4" />
              Retour
            </button>
          )}
          {isLast ? (
            <button
              type="button"
              className="btn-form-submit"
              onClick={onSubmit}
              disabled={isLoading || nextDisabled}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitText}
            </button>
          ) : (
            <button
              type="button"
              className="btn-form-submit"
              onClick={onNext}
              disabled={isLoading || nextDisabled}
            >
              {nextText}
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
