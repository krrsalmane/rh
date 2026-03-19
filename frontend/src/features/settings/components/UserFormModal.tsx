import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateUser, useUpdateUser } from '@/features/settings/hooks/useUsers.ts';
import type { User, UserRole } from '@/features/settings/types.ts';
import { X, Mail, Lock, Eye, EyeOff, Loader2, ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/shared/api/axiosInstance';

// ── Schema ──────────────────────────────────────
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

// ── Helpers ──────────────────────────────────────
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

// ── Component ───────────────────────────────────
interface Props {
  user: User | null; // null = create mode
  onClose: () => void;
}

export const UserFormModal: React.FC<Props> = ({ user, onClose }) => {
  const isEdit = !!user;
  const [showPassword, setShowPassword] = useState(false);
  const createMut = useCreateUser();
  const updateMut = useUpdateUser();

  const schema = isEdit ? editSchema : createSchema;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema) as any,
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

  // Fetch employees for the dropdown
  const { data: employeesData } = useQuery({
    queryKey: ['employees-for-select'],
    queryFn: () => api.get('/employees?limit=100&status=active').then((r) => r.data),
    staleTime: 60_000,
  });

  const employees: { id: string; first_name: string; last_name: string; department: string }[] =
    employeesData?.data ?? [];

  const onSubmit = async (data: any) => {
    if (isEdit) {
      const payload: Record<string, unknown> = { email: data.email, role: data.role };
      if (showEmployeeSelect) payload.employeeId = data.employeeId || null;
      await updateMut.mutateAsync({ id: user!.id, data: payload });
    } else {
      await createMut.mutateAsync({
        email: data.email,
        password: data.password,
        role: data.role,
        employeeId: data.employeeId || undefined,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in-up text-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">
            {isEdit ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Adresse email <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                {...register('email')}
                placeholder="utilisateur@entreprise.com"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                  errors.email
                    ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200 text-red-900'
                    : 'border-gray-200 bg-gray-50 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 focus:bg-white text-gray-900'
                } transition-all`}
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Mot de passe {!isEdit && <span className="text-red-400">*</span>}
              {isEdit && <span className="text-gray-400 text-xs ml-1">(optionnel)</span>}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="••••••••"
                className={`w-full pl-10 pr-12 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                  errors.password
                    ? 'border-red-300 bg-red-50 text-red-900'
                    : 'border-gray-200 bg-gray-50 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 focus:bg-white text-gray-900'
                } transition-all`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Strength bar */}
            {watchedPassword && watchedPassword.length > 0 && (
              <div className="mt-2">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${pwStrength.color} ${pwStrength.width}`} />
                </div>
                <p className={`text-[11px] mt-1 font-medium ${pwStrength.color.replace('bg-', 'text-')}`}>
                  {pwStrength.label}
                </p>
              </div>
            )}
            <p className="mt-1 text-[11px] text-gray-400">
              Min. 8 caractères avec majuscule, chiffre et caractère spécial
            </p>
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Rôle <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <select
                {...register('role')}
                className="w-full appearance-none px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 focus:bg-white transition-all pr-10"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value} className="text-gray-900 bg-white">
                    {r.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Employee link */}
          {showEmployeeSelect && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Lier à un employé <span className="text-gray-400 text-xs">(optionnel)</span>
              </label>
              <div className="relative">
                <select
                  {...register('employeeId')}
                  className="w-full appearance-none px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 focus:bg-white transition-all pr-10"
                >
                  <option value="" className="text-gray-500 bg-white">Aucun</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id} className="text-gray-900 bg-white">
                      {emp.first_name} {emp.last_name} — {emp.department || 'N/A'}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 text-white text-sm font-semibold hover:bg-sky-600 disabled:bg-sky-300 disabled:cursor-not-allowed transition-all shadow-md shadow-sky-500/20"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? 'Enregistrer' : 'Créer l\'utilisateur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
