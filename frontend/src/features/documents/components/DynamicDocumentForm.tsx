import React from 'react';
import type { VariableSchema } from '../types';

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

export const DynamicDocumentForm: React.FC<Props> = ({ variableSchema, employeeData, formData, onFormDataChange }) => {
  const autoFillVars = variableSchema.filter((v) => v.autoFill);
  const manualVars = variableSchema.filter((v) => !v.autoFill);

  const handleChange = (name: string, value: unknown) => {
    onFormDataChange({ ...formData, [name]: value });
  };

  return (
    <div className="space-y-6" id="dynamic-document-form">
      {/* Auto-filled fields (read-only display) */}
      {autoFillVars.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-sky-100 text-sky-600 flex items-center justify-center text-[10px]">🔒</span>
            Champs pré-remplis depuis le dossier employé
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {autoFillVars.map((v) => {
              const rawPath = v.name.replace(/^employee\./, '');
              const val = resolveValue(employeeData, rawPath);
              return (
                <div key={v.name} className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                  <label className="block text-xs font-medium text-slate-400 mb-0.5">{v.label}</label>
                  <p className="text-sm font-medium text-slate-700">
                    {val !== undefined && val !== null && val !== '' ? String(val) : '—'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Manual fields */}
      {manualVars.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-amber-100 text-amber-600 flex items-center justify-center text-[10px]">✏️</span>
            Champs à renseigner
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {manualVars.map((v) => {
              const fieldName = v.name.replace(/^form\./, '');
              const currentVal = formData[fieldName] ?? v.defaultValue ?? '';

              return (
                <div key={v.name} className={v.type === 'textarea' ? 'md:col-span-2' : ''}>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    {v.label}
                    {v.required && <span className="text-rose-500 ml-1">*</span>}
                  </label>
                  {renderField(v, currentVal, (val) => handleChange(fieldName, val))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

function renderField(v: VariableSchema, value: unknown, onChange: (val: unknown) => void) {
  const strVal = value !== undefined && value !== null ? String(value) : '';

  switch (v.type) {
    case 'textarea':
      return (
        <textarea
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          className="input-field min-h-[80px] resize-none"
          placeholder={v.label}
          required={v.required}
        />
      );
    case 'date':
      return (
        <input
          type="date"
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          className="input-field"
          required={v.required}
        />
      );
    case 'number':
      return (
        <input
          type="number"
          value={strVal}
          onChange={(e) => onChange(Number(e.target.value))}
          className="input-field"
          placeholder={v.label}
          required={v.required}
        />
      );
    case 'currency':
      return (
        <div className="relative">
          <input
            type="number"
            value={strVal}
            onChange={(e) => onChange(Number(e.target.value))}
            className="input-field pr-16"
            placeholder="0"
            required={v.required}
            step="100"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">MAD</span>
        </div>
      );
    case 'select':
      return (
        <select
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          className="input-field"
          required={v.required}
        >
          <option value="">Sélectionner...</option>
          {(v.options || []).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    default:
      return (
        <input
          type="text"
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          className="input-field"
          placeholder={v.label}
          required={v.required}
        />
      );
  }
}
