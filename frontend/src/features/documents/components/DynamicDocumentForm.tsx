import React, { useMemo, useState } from 'react';
import type { VariableSchema } from '../types';
import {
  FormField,
  FormGrid,
  FormInput,
  FormSelect,
  FormTextarea,
  FormWizardNav,
  type FormWizardStep,
} from '@/shared/components/forms';

interface Props {
  variableSchema: VariableSchema[];
  employeeData: Record<string, unknown>;
  formData: Record<string, unknown>;
  onFormDataChange: (data: Record<string, unknown>) => void;
  /** Notifies parent of inner wizard step (for nested flows like DocumentGenerator) */
  onInnerStepChange?: (step: number, totalSteps: number) => void;
}

function resolveValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, part) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[part];
    return undefined;
  }, obj);
}

function renderField(
  v: VariableSchema,
  value: unknown,
  onChange: (val: unknown) => void
) {
  const strVal = value !== undefined && value !== null ? String(value) : '';

  switch (v.type) {
    case 'textarea':
      return (
        <FormTextarea
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          placeholder={v.label}
          required={v.required}
        />
      );
    case 'date':
      return (
        <FormInput
          type="date"
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          required={v.required}
        />
      );
    case 'number':
      return (
        <FormInput
          type="number"
          value={strVal}
          onChange={(e) => onChange(Number(e.target.value))}
          placeholder={v.label}
          required={v.required}
        />
      );
    case 'currency':
      return (
        <div className="relative">
          <FormInput
            type="number"
            value={strVal}
            onChange={(e) => onChange(Number(e.target.value))}
            placeholder="0"
            required={v.required}
            step={100}
            className="pr-14"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#9CA3AF]">
            MAD
          </span>
        </div>
      );
    case 'select':
      return (
        <FormSelect
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          required={v.required}
        >
          <option value="">Sélectionner...</option>
          {(v.options || []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </FormSelect>
      );
    default:
      return (
        <FormInput
          type="text"
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          placeholder={v.label}
          required={v.required}
        />
      );
  }
}

export const DynamicDocumentForm: React.FC<Props> = ({
  variableSchema,
  employeeData,
  formData,
  onFormDataChange,
  onInnerStepChange,
}) => {
  const autoFillVars = variableSchema.filter((v) => v.autoFill);
  const manualVars = variableSchema.filter((v) => !v.autoFill);

  const steps: FormWizardStep[] = useMemo(() => {
    const list: FormWizardStep[] = [];
    if (autoFillVars.length > 0) {
      list.push({ id: 'prefill', title: 'Pré-remplis' });
    }
    if (manualVars.length > 0) {
      list.push({ id: 'manual', title: 'À compléter' });
    }
    return list;
  }, [autoFillVars.length, manualVars.length]);

  const [innerStep, setInnerStep] = useState(0);

  const setStep = (next: number) => {
    setInnerStep(next);
    onInnerStepChange?.(next, steps.length);
  };

  const handleChange = (name: string, value: unknown) => {
    onFormDataChange({ ...formData, [name]: value });
  };

  if (steps.length <= 1) {
    return (
      <div id="dynamic-document-form" className="space-y-4">
        {autoFillVars.length > 0 && (
          <FormGrid>
            {autoFillVars.map((v) => {
              const rawPath = v.name.replace(/^employee\./, '');
              const val = resolveValue(employeeData, rawPath);
              return (
                <div
                  key={v.name}
                  className="rounded-md border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2"
                >
                  <span className="form-label mb-1">{v.label}</span>
                  <p className="text-sm font-medium text-[#1A1A2E]">
                    {val !== undefined && val !== null && val !== '' ? String(val) : '—'}
                  </p>
                </div>
              );
            })}
          </FormGrid>
        )}
        {manualVars.length > 0 && (
          <FormGrid>
            {manualVars.map((v) => {
              const fieldName = v.name.replace(/^form\./, '');
              const currentVal = formData[fieldName] ?? v.defaultValue ?? '';
              return (
                <FormField
                  key={v.name}
                  label={v.label}
                  required={v.required}
                  className={v.type === 'textarea' ? 'md:col-span-2' : ''}
                >
                  {renderField(v, currentVal, (val) => handleChange(fieldName, val))}
                </FormField>
              );
            })}
          </FormGrid>
        )}
      </div>
    );
  }

  const currentId = steps[innerStep]?.id;

  return (
    <div id="dynamic-document-form" className="form-wizard">
      <FormWizardNav
        steps={steps}
        currentStep={innerStep}
        onStepClick={(index) => {
          if (index < innerStep) setStep(index);
        }}
      />
      {steps[innerStep]?.description && (
        <p className="form-wizard-description">{steps[innerStep].description}</p>
      )}

      <div className="form-wizard-panel">
        {currentId === 'prefill' && (
          <FormGrid>
            {autoFillVars.map((v) => {
              const rawPath = v.name.replace(/^employee\./, '');
              const val = resolveValue(employeeData, rawPath);
              return (
                <div
                  key={v.name}
                  className="rounded-md border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2"
                >
                  <span className="form-label mb-1">{v.label}</span>
                  <p className="text-sm font-medium text-[#1A1A2E]">
                    {val !== undefined && val !== null && val !== '' ? String(val) : '—'}
                  </p>
                </div>
              );
            })}
          </FormGrid>
        )}
        {currentId === 'manual' && (
          <FormGrid>
            {manualVars.map((v) => {
              const fieldName = v.name.replace(/^form\./, '');
              const currentVal = formData[fieldName] ?? v.defaultValue ?? '';
              return (
                <FormField
                  key={v.name}
                  label={v.label}
                  required={v.required}
                  className={v.type === 'textarea' ? 'md:col-span-2' : ''}
                >
                  {renderField(v, currentVal, (val) => handleChange(fieldName, val))}
                </FormField>
              );
            })}
          </FormGrid>
        )}
      </div>

      {innerStep < steps.length - 1 && (
        <div className="flex justify-end">
          <button
            type="button"
            className="btn-form-submit"
            onClick={() => setStep(innerStep + 1)}
          >
            Continuer vers les champs à compléter
          </button>
        </div>
      )}
    </div>
  );
};
