import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppSelector } from '@/store/hooks';
import { useDepartments } from '../hooks/useEmployees';
import { useWorkSchedules } from '@/features/time/hooks/useTime';
import type { CreateEmployeeDto, Employee } from '../types';

const employeeFormSchema = z.object({
  firstName: z.string().min(2, 'Min 2 caractères').max(50),
  lastName: z.string().min(2, 'Min 2 caractères').max(50),
  cin: z.string().optional().or(z.literal('')),
  cne: z.string().optional().or(z.literal('')),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().max(200).optional().or(z.literal('')),
  hireDate: z.string().min(1, 'Date requise'),
  contractType: z.enum(['CDI', 'CDD', 'internship', 'freelance']),
  function: z.string().max(100).optional().or(z.literal('')),
  department: z.string().max(100).optional().or(z.literal('')),
  salary: z.union([z.number().positive().max(999999), z.nan(), z.literal(0)]).optional().nullable(),
  status: z.enum(['active', 'inactive', 'terminated']).default('active'),
  workScheduleId: z.string().optional().or(z.literal('')),
});

type FormData = z.infer<typeof employeeFormSchema>;

interface Props {
  employee?: Employee;
  onSubmit: (data: CreateEmployeeDto) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

export const EmployeeForm: React.FC<Props> = ({ employee, onSubmit, isSubmitting, onCancel }) => {
  const userRole = useAppSelector((s) => s.auth.role);
  const isSuperAdmin = userRole === 'super_admin';
  const { data: departments = [] } = useDepartments();
  const { data: schedulesResult } = useWorkSchedules();
  const schedules = Array.isArray(schedulesResult) ? schedulesResult : [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<FormData>({
    resolver: zodResolver(employeeFormSchema) as any,
    defaultValues: {
      firstName: '',
      lastName: '',
      cin: '',
      cne: '',
      email: '',
      phone: '',
      address: '',
      hireDate: new Date().toISOString().split('T')[0],
      contractType: 'CDI',
      function: '',
      department: '',
      salary: undefined,
      status: 'active',
      workScheduleId: '',
    },
  });

  useEffect(() => {
    if (employee) {
      reset({
        firstName: employee.firstName,
        lastName: employee.lastName,
        cin: employee.cin || '',
        cne: employee.cne || '',
        email: employee.email || '',
        phone: employee.phone || '',
        address: employee.address || '',
        hireDate: employee.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : '',
        contractType: employee.contractType,
        function: employee.function || '',
        department: employee.department || '',
        salary: employee.salary || undefined,
        status: employee.status,
        workScheduleId: employee.workScheduleId || '',
      });
    }
  }, [employee, reset]);

  const handleFormSubmit = (data: FormData) => {
    const dto: CreateEmployeeDto = {
      firstName: data.firstName,
      lastName: data.lastName,
      cin: data.cin || undefined,
      cne: data.cne || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined,
      hireDate: data.hireDate,
      contractType: data.contractType,
      function: data.function || undefined,
      department: data.department || undefined,
      salary: data.salary && !isNaN(data.salary) ? data.salary : undefined,
      status: data.status,
      workScheduleId: data.workScheduleId || undefined,
    };
    onSubmit(dto);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8" id="employee-form">
      {/* Section 1 — Personal Info */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center text-xs font-bold">1</span>
          Informations personnelles
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Prénom *</label>
            <input {...register('firstName')} className="input-field" placeholder="Prénom" id="emp-firstName" />
            {errors.firstName && <p className="text-xs text-rose-500 mt-1">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Nom *</label>
            <input {...register('lastName')} className="input-field" placeholder="Nom" id="emp-lastName" />
            {errors.lastName && <p className="text-xs text-rose-500 mt-1">{errors.lastName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">CIN</label>
            <input {...register('cin')} className="input-field" placeholder="CIN" id="emp-cin" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">CNE</label>
            <input {...register('cne')} className="input-field" placeholder="CNE" id="emp-cne" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
            <input {...register('email')} type="email" className="input-field" placeholder="email@exemple.com" id="emp-email" />
            {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Téléphone</label>
            <input {...register('phone')} className="input-field" placeholder="+212 6XX XXX XXX" id="emp-phone" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-600 mb-1">Adresse</label>
            <textarea {...register('address')} className="input-field min-h-[80px] resize-none" placeholder="Adresse" id="emp-address" />
          </div>
        </div>
      </div>

      {/* Section 2 — Professional Info */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center text-xs font-bold">2</span>
          Informations professionnelles
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Date d'embauche *</label>
            <input {...register('hireDate')} type="date" className="input-field" id="emp-hireDate" />
            {errors.hireDate && <p className="text-xs text-rose-500 mt-1">{errors.hireDate.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Type de contrat *</label>
            <select {...register('contractType')} className="input-field" id="emp-contractType">
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
              <option value="internship">Stage</option>
              <option value="freelance">Freelance</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Fonction</label>
            <input {...register('function')} className="input-field" placeholder="Fonction" id="emp-function" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Département</label>
            <input
              {...register('department')}
              className="input-field"
              placeholder="Département"
              list="department-options"
              id="emp-department"
            />
            <datalist id="department-options">
              {departments.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Statut</label>
            <select {...register('status')} className="input-field" id="emp-status">
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
              <option value="terminated">Résilié</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Horaire de travail</label>
            <select {...register('workScheduleId')} className="input-field" id="emp-workScheduleId">
              <option value="">Par défaut (8h/jour)</option>
              {schedules.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name} ({s.dailyHours || 8}h/j)</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Section 3 — Compensation (super_admin only) */}
      {isSuperAdmin && (
        <div>
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center text-xs font-bold">3</span>
            Rémunération
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Salaire (MAD)</label>
              <input
                {...register('salary', { valueAsNumber: true })}
                type="number"
                className="input-field"
                placeholder="0"
                min="0"
                max="999999"
                step="100"
                id="emp-salary"
              />
              {errors.salary && <p className="text-xs text-rose-500 mt-1">{errors.salary.message}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          id="emp-form-cancel"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 text-sm font-semibold text-white bg-sky-500 hover:bg-sky-600 rounded-xl transition-colors shadow-lg shadow-sky-500/20 disabled:opacity-50 inline-flex items-center gap-2"
          id="emp-form-submit"
        >
          {isSubmitting && (
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {employee ? 'Enregistrer' : 'Créer l\'employé'}
        </button>
      </div>
    </form>
  );
};
