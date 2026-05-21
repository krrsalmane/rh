import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppSelector } from '@/store/hooks';
import { useDepartments } from '../hooks/useEmployees';
import { useWorkSchedules } from '@/features/time/hooks/useTime';
import {
  FormCard,
  FormField,
  FormGrid,
  FormFooter,
  FormInput,
  FormSelect,
  FormTextarea,
} from '@/shared/components/forms';
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
  } = useForm<FormData>({
    resolver: zodResolver(employeeFormSchema) as never,
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
    <form onSubmit={handleSubmit(handleFormSubmit)} id="employee-form">
      <FormCard title="Informations personnelles">
        <FormGrid>
          <FormField label="Prénom" required error={errors.firstName?.message}>
            <FormInput
              {...register('firstName')}
              placeholder="Prénom"
              id="emp-firstName"
              hasError={!!errors.firstName}
            />
          </FormField>
          <FormField label="Nom" required error={errors.lastName?.message}>
            <FormInput
              {...register('lastName')}
              placeholder="Nom"
              id="emp-lastName"
              hasError={!!errors.lastName}
            />
          </FormField>
          <FormField label="CIN">
            <FormInput {...register('cin')} placeholder="CIN" id="emp-cin" />
          </FormField>
          <FormField label="CNE">
            <FormInput {...register('cne')} placeholder="CNE" id="emp-cne" />
          </FormField>
          <FormField label="Email" error={errors.email?.message}>
            <FormInput
              {...register('email')}
              type="email"
              placeholder="email@exemple.com"
              id="emp-email"
              hasError={!!errors.email}
            />
          </FormField>
          <FormField label="Téléphone">
            <FormInput {...register('phone')} placeholder="+212 6XX XXX XXX" id="emp-phone" />
          </FormField>
        </FormGrid>
        <FormField label="Adresse">
          <FormTextarea {...register('address')} placeholder="Adresse" id="emp-address" rows={3} />
        </FormField>
      </FormCard>

      <FormCard title="Informations professionnelles">
        <FormGrid>
          <FormField label="Date d'embauche" required error={errors.hireDate?.message}>
            <FormInput
              {...register('hireDate')}
              type="date"
              id="emp-hireDate"
              hasError={!!errors.hireDate}
            />
          </FormField>
          <FormField label="Type de contrat" required>
            <FormSelect {...register('contractType')} id="emp-contractType">
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
              <option value="internship">Stage</option>
              <option value="freelance">Freelance</option>
            </FormSelect>
          </FormField>
          <FormField label="Fonction">
            <FormInput {...register('function')} placeholder="Fonction" id="emp-function" />
          </FormField>
          <FormField label="Département">
            <FormInput
              {...register('department')}
              placeholder="Département"
              list="department-options"
              id="emp-department"
            />
            <datalist id="department-options">
              {departments.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </FormField>
          <FormField label="Statut">
            <FormSelect {...register('status')} id="emp-status">
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
              <option value="terminated">Résilié</option>
            </FormSelect>
          </FormField>
          <FormField label="Horaire de travail">
            <FormSelect {...register('workScheduleId')} id="emp-workScheduleId">
              <option value="">Par défaut (8h/jour)</option>
              {schedules.map((s: { id: string; name: string; dailyHours?: number }) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.dailyHours || 8}h/j)
                </option>
              ))}
            </FormSelect>
          </FormField>
        </FormGrid>
      </FormCard>

      {isSuperAdmin && (
        <FormCard title="Rémunération">
          <FormField label="Salaire (MAD)" error={errors.salary?.message}>
            <FormInput
              {...register('salary', { valueAsNumber: true })}
              type="number"
              placeholder="0"
              min={0}
              max={999999}
              step={100}
              id="emp-salary"
              hasError={!!errors.salary}
            />
          </FormField>
        </FormCard>
      )}

      <FormFooter
        onCancel={onCancel}
        submitText={employee ? 'Enregistrer' : "Créer l'employé"}
        isLoading={isSubmitting}
      />
    </form>
  );
};
