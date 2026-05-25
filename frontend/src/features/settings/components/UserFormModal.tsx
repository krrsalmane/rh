import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateUser, useUpdateUser } from '@/features/settings/hooks/useUsers.ts';
import type { User, UserRole } from '@/features/settings/types.ts';
import { Eye, EyeOff } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/shared/api/axiosInstance';
import {
  Modal,
  FormCard,
  FormField,
  FormInput,
  FormSelect,
  FormFooter,
  FormWizard,
  type FormWizardStep,
} from '@/shared/components/forms';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;

const createSchema = z.object({
  email: z.string().email('Format email invalide'),
  password: z
    .string()
    .min(8, 'Min. 8 caractères')
    .regex(passwordRegex, 'Majuscule, minuscule, chiffre et caractère spécial requis'),
  role: z.enum(['super_admin', 'hr_agent', 'manager', 'employee']),
  employeeId: z.string().optional(),
});

const editSchema = z.object({
  email: z.string().email('Format email invalide'),
  password: z
    .string()
    .optional()
    .refine(
      (v) => !v || (v.length >= 8 && passwordRegex.test(v)),
      'Min. 8 caractères avec majuscule, minuscule, chiffre et caractère spécial'
    ),
  role: z.enum(['super_admin', 'hr_agent', 'manager', 'employee']),
  employeeId: z.string().optional(),
});

const CREATE_STEPS: FormWizardStep[] = [
  { id: 'credentials', title: 'Identifiants', description: 'Email et mot de passe de connexion' },
  { id: 'access', title: 'Rôle et accès', description: 'Permissions et lien employé' },
];

function getPasswordStrength(pw: string): { label: string; color: string; width: string } {
  if (!pw || pw.length < 8) return { label: 'Faible', color: 'bg-red-400', width: 'w-1/4' };
  const hasUpper = /[A-Z]/.test(pw);
  const hasLower = /[a-z]/.test(pw);
  const hasDigit = /\d/.test(pw);
  const hasSpecial = /[@$!%*?&]/.test(pw);
  const score = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;
  if (score >= 4) return { label: 'Fort', color: 'bg-emerald-400', width: 'w-full' };
  if (score >= 2) return { label: 'Moyen', color: 'bg-amber-400', width: 'w-2/3' };
  return { label: 'Faible', color: 'bg-red-400', width: 'w-1/4' };
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'super_admin', label: 'Super Administrateur' },
  { value: 'hr_agent', label: 'Agent RH' },
  { value: 'manager', label: 'Manager' },
  { value: 'employee', label: 'Employé' },
];

interface Props {
  user: User | null;
  onClose: () => void;
}

export const UserFormModal: React.FC<Props> = ({ user, onClose }) => {
  const isEdit = !!user;
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(0);
  const createMut = useCreateUser();
  const updateMut = useUpdateUser();
  const schema = isEdit ? editSchema : createSchema;

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      email: user?.email ?? '',
      password: '',
      role: user?.role ?? 'employee',
      employeeId: user?.employeeId ?? '',
    },
  });

  const watchedPassword = watch('password');
  const watchedRole = watch('role');
  const pwStrength = useMemo(() => getPasswordStrength(watchedPassword ?? ''), [watchedPassword]);
  const showEmployeeSelect = watchedRole !== 'super_admin';

  const { data: employeesData } = useQuery({
    queryKey: ['employees-for-select'],
    queryFn: () => api.get('/employees?limit=100&status=active').then((r) => r.data),
    staleTime: 60_000,
  });

  const employees: { id: string; first_name: string; last_name: string; department: string }[] = Array.from(
    new Map(((employeesData?.data ?? []) as { id: string; first_name: string; last_name: string; department: string }[]).map((employee) => [employee.id, employee])).values()
  );

  const onSubmit = async (data: Record<string, string>) => {
    if (isEdit) {
      const payload: Record<string, unknown> = { email: data.email, role: data.role };
      if (showEmployeeSelect) payload.employeeId = data.employeeId || null;
      await updateMut.mutateAsync({ id: user!.id, data: payload });
    } else {
      await createMut.mutateAsync({
        email: data.email,
        password: data.password,
        role: data.role as UserRole,
        employeeId: data.employeeId || undefined,
      });
    }
    onClose();
  };

  const handleCreateNext = async () => {
    const fields = step === 0 ? (['email', 'password'] as const) : ([] as const);
    const ok = fields.length ? await trigger(fields) : true;
    if (ok) setStep(1);
  };

  const credentialsFields = (
    <>
      <FormField label="Adresse email" required error={errors.email?.message as string}>
        <FormInput
          type="email"
          {...register('email')}
          placeholder="utilisateur@entreprise.com"
          hasError={!!errors.email}
        />
      </FormField>
      <FormField
        label={isEdit ? 'Mot de passe (optionnel)' : 'Mot de passe'}
        required={!isEdit}
        error={errors.password?.message as string}
      >
        <div className="relative">
          <FormInput
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
            placeholder="••••••••"
            hasError={!!errors.password}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1A1A2E]"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {watchedPassword && watchedPassword.length > 0 && (
          <div className="mt-2">
            <div className="h-1.5 overflow-hidden rounded-full bg-[#E5E7EB]">
              <div
                className={`h-full rounded-full transition-all duration-300 ${pwStrength.color} ${pwStrength.width}`}
              />
            </div>
            <p className="mt-1 text-[11px] font-medium text-[#6B7280]">{pwStrength.label}</p>
          </div>
        )}
        <p className="mt-1 text-[11px] text-[#9CA3AF]">
          Min. 8 caractères avec majuscule, chiffre et caractère spécial
        </p>
      </FormField>
    </>
  );

  const accessFields = (
    <>
      <FormField label="Rôle" required>
        <FormSelect {...register('role')}>
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </FormSelect>
      </FormField>
      {showEmployeeSelect && (
        <FormField label="Lier à un employé">
          <FormSelect {...register('employeeId')}>
            <option value="">Aucun</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.first_name} {emp.last_name} — {emp.department || 'N/A'}
              </option>
            ))}
          </FormSelect>
        </FormField>
      )}
    </>
  );

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        {isEdit ? (
          <>
            <FormCard title="Identifiants">{credentialsFields}</FormCard>
            <FormCard title="Rôle et accès">{accessFields}</FormCard>
            <FormFooter
              onCancel={onClose}
              submitText="Enregistrer"
              isLoading={isSubmitting || updateMut.isPending}
            />
          </>
        ) : (
          <FormWizard
            steps={CREATE_STEPS}
            currentStep={step}
            onCancel={onClose}
            onBack={() => setStep(0)}
            onNext={handleCreateNext}
            onSubmit={() => void handleSubmit(onSubmit)()}
            onStepClick={(index) => {
              if (index < step) setStep(index);
            }}
            isLoading={isSubmitting || createMut.isPending}
            submitText="Créer l'utilisateur"
          >
            {step === 0 ? credentialsFields : accessFields}
          </FormWizard>
        )}
      </form>
    </Modal>
  );
};
