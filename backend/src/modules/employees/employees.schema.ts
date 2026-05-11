import { z } from 'zod';

export const CreateEmployeeSchema = z.object({
  firstName: z.string().trim().min(2, 'Le prénom doit contenir au moins 2 caractères').max(50),
  lastName: z.string().trim().min(2, 'Le nom doit contenir au moins 2 caractères').max(50),
  cin: z.string().trim().toUpperCase().optional().or(z.literal('')),
  cne: z.string().trim().toUpperCase().optional().or(z.literal('')),
  email: z.string().email('Email invalide').toLowerCase().optional().or(z.literal('')),
  phone: z.string().trim().optional().or(z.literal('')),
  address: z.string().max(200).optional().or(z.literal('')),
  hireDate: z.string().refine((val) => {
    const d = new Date(val);
    return !isNaN(d.getTime()) && d <= new Date();
  }, { message: "La date d'embauche ne peut pas être dans le futur" }),
  contractType: z.enum(['CDI', 'CDD', 'internship', 'freelance']),
  function: z.string().max(100).optional().or(z.literal('')),
  department: z.string().max(100).optional().or(z.literal('')),
  salary: z.number().positive('Le salaire doit être positif').max(999999).optional().nullable(),
  status: z.enum(['active', 'inactive', 'terminated']).default('active'),
  workScheduleId: z.string().uuid().optional().nullable().or(z.literal('')),
});

export const UpdateEmployeeSchema = CreateEmployeeSchema.partial();

export const EmployeeFiltersSchema = z.object({
  search: z.string().optional(),
  department: z.string().optional(),
  status: z.enum(['active', 'inactive', 'terminated']).optional(),
  contractType: z.enum(['CDI', 'CDD', 'internship', 'freelance']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  managerId: z.string().uuid().optional(),
});

export type CreateEmployeeInput = z.infer<typeof CreateEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof UpdateEmployeeSchema>;
export type EmployeeFiltersInput = z.infer<typeof EmployeeFiltersSchema>;
