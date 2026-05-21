import React, { useState } from 'react';
import {
  FormField,
  FormGrid,
  FormInput,
  FormSelect,
  FormTextarea,
  FormWizard,
  type FormWizardStep,
} from '@/shared/components/forms';

const WIZARD_STEPS: FormWizardStep[] = [
  {
    id: 'basics',
    title: 'Employé et horaires',
    description: 'Sélectionnez l\'employé, la date et les heures principales',
  },
  {
    id: 'breaks',
    title: 'Pauses',
    description: 'Déjeuner et pauses de prière (facultatif)',
  },
  {
    id: 'note',
    title: 'Motif',
    description: 'Commentaire ou justification',
  },
];

export interface PrayerBreak {
  out: string;
  in: string;
}

export interface TimeEntryCreateFormState {
  employeeId: string;
  date: string;
  clockIn: string;
  clockOut: string;
  lunchOut: string;
  lunchIn: string;
  prayerBreaks: PrayerBreak[];
  reason: string;
}

interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
}

interface Props {
  form: TimeEntryCreateFormState;
  onChange: (next: TimeEntryCreateFormState) => void;
  employees: EmployeeOption[];
  employeesLoading?: boolean;
  allowedPrayerBreaks: number;
  onCancel: () => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

export const TimeEntryCreateForm: React.FC<Props> = ({
  form,
  onChange,
  employees,
  employeesLoading,
  allowedPrayerBreaks,
  onCancel,
  onSubmit,
  isLoading,
}) => {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step === 0 && (!form.employeeId || !form.date)) return;
    setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  };

  const updatePrayerBreak = (idx: number, field: 'out' | 'in', value: string) => {
    if (value && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value) && value.length > 5) return;
    onChange({
      ...form,
      prayerBreaks: form.prayerBreaks.map((b, i) =>
        i === idx ? { ...b, [field]: value } : b
      ),
    });
  };

  return (
    <FormWizard
      steps={WIZARD_STEPS}
      currentStep={step}
      onCancel={onCancel}
      onBack={() => setStep((s) => Math.max(0, s - 1))}
      onNext={handleNext}
      onSubmit={onSubmit}
      onStepClick={(index) => {
        if (index < step) setStep(index);
      }}
      isLoading={isLoading}
      submitText="Créer"
      nextDisabled={step === 0 && (!form.employeeId || !form.date)}
    >
      {step === 0 && (
        <>
          <FormField label="Employé" required>
            <FormSelect
              value={form.employeeId}
              onChange={(e) => onChange({ ...form, employeeId: e.target.value })}
              disabled={employeesLoading}
              required
            >
              <option value="">
                {employeesLoading ? 'Chargement...' : 'Sélectionner un employé'}
              </option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label="Date" required>
            <FormInput
              type="date"
              value={form.date}
              onChange={(e) => onChange({ ...form, date: e.target.value })}
              required
            />
          </FormField>
          <FormGrid>
            <FormField label="Heure d'entrée (HH:MM)">
              <FormInput
                inputMode="numeric"
                placeholder="09:00"
                value={form.clockIn}
                onChange={(e) => onChange({ ...form, clockIn: e.target.value })}
                maxLength={5}
                className="text-center font-mono"
              />
            </FormField>
            <FormField label="Heure de sortie (HH:MM)">
              <FormInput
                inputMode="numeric"
                placeholder="18:00"
                value={form.clockOut}
                onChange={(e) => onChange({ ...form, clockOut: e.target.value })}
                maxLength={5}
                className="text-center font-mono"
              />
            </FormField>
          </FormGrid>
        </>
      )}

      {step === 1 && (
        <>
          <FormGrid>
            <FormField label="Sortie déjeuner (HH:MM)">
              <FormInput
                inputMode="numeric"
                placeholder="12:00"
                value={form.lunchOut}
                onChange={(e) => onChange({ ...form, lunchOut: e.target.value })}
                maxLength={5}
                className="text-center font-mono"
              />
            </FormField>
            <FormField label="Retour déjeuner (HH:MM)">
              <FormInput
                inputMode="numeric"
                placeholder="13:00"
                value={form.lunchIn}
                onChange={(e) => onChange({ ...form, lunchIn: e.target.value })}
                maxLength={5}
                className="text-center font-mono"
              />
            </FormField>
          </FormGrid>

          <div className="mt-4 border-t border-[#E5E7EB] pt-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-[#1A1A2E]">Pauses de prière</span>
              <span className="rounded bg-[#EFF6FF] px-2 py-0.5 text-xs font-medium text-[#2563EB]">
                {allowedPrayerBreaks} autorisées
              </span>
            </div>
            {form.prayerBreaks.map((prayerBreak, idx) => (
              <div
                key={idx}
                className="mb-3 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-3"
              >
                <p className="mb-2 text-xs font-semibold text-[#374151]">Prière #{idx + 1}</p>
                <FormGrid>
                  <FormField label="Départ">
                    <FormInput
                      inputMode="numeric"
                      placeholder="15:00"
                      value={prayerBreak.out}
                      onChange={(e) => updatePrayerBreak(idx, 'out', e.target.value)}
                      maxLength={5}
                      className="text-center font-mono text-sm"
                    />
                  </FormField>
                  <FormField label="Retour">
                    <FormInput
                      inputMode="numeric"
                      placeholder="15:30"
                      value={prayerBreak.in}
                      onChange={(e) => updatePrayerBreak(idx, 'in', e.target.value)}
                      maxLength={5}
                      className="text-center font-mono text-sm"
                    />
                  </FormField>
                </FormGrid>
              </div>
            ))}
          </div>
        </>
      )}

      {step === 2 && (
        <FormField label="Motif / commentaire">
          <FormTextarea
            value={form.reason}
            onChange={(e) => onChange({ ...form, reason: e.target.value })}
            placeholder="Ex: Oubli de pointage..."
            rows={4}
          />
        </FormField>
      )}
    </FormWizard>
  );
};
