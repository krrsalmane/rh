import React from 'react';
import type { VariableSchema } from '../types';
import {
  FormCard,
  FormField,
  FormGrid,
  FormInput,
  FormSelect,
  FormTextarea,
} from '@/shared/components/forms';

interface Props {
  variableSchema: VariableSchema[];
  employeeData: Record<string, unknown>;
  formData: Record<string, unknown>;
  onFormDataChange: (data: Record<string, unknown>) => void;
}

function resolveValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, part) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[part];
    return undefined;
  }, obj);
}

export const DynamicDocumentForm: React.FC<Props> = ({
  variableSchema,
  employeeData,
  formData,
  onFormDataChange,
}) => {
  const autoFillVars = variableSchema.filter((v) => v.autoFill);
  const manualVars = variableSchema.filter((v) => !v.autoFill);

  const handleChange = (name: string, value: unknown) => {
    onFormDataChange({ ...formData, [name]: value });
  };

  return (
    <div id="dynamic-document-form">
      {autoFillVars.length > 0 && (
        <FormCard title="Champs pré-remplis depuis le dossier employé">
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
        </FormCard>
      )}

      {manualVars.length > 0 && (
        <FormCard title="Champs à renseigner">
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
        </FormCard>
      )}
    </div>
  );
};

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
