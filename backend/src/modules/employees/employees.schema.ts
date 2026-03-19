import { z } from 'zod';

export const CreateEmployeeSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  cne: z.string().optional(),
  cin: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  hireDate: z.string(),
  contractType: z.enum(['CDI', 'CDD', 'internship', 'freelance']),
  function: z.string().optional(),
  department: z.string().optional(),
  salary: z.number().positive().optional(),
  workScheduleId: z.string().uuid().optional(),
});

export const UpdateEmployeeSchema = CreateEmployeeSchema.partial();

export const EmployeeFiltersSchema = z.object({
  search: z.string().optional(),
  department: z.string().optional(),
  status: z.enum(['active', 'inactive', 'terminated']).optional(),
  contractType: z.enum(['CDI', 'CDD', 'internship', 'freelance']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateEmployeeInput = z.infer<typeof CreateEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof UpdateEmployeeSchema>;
export type EmployeeFiltersInput = z.infer<typeof EmployeeFiltersSchema>;
