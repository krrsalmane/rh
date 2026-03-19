import { z } from 'zod';

export const CreateAbsenceSchema = z.object({
  employeeId: z.string().uuid(),
  startDate: z.string(),
  endDate: z.string(),
  type: z.string().optional(),
  reason: z.string().optional(),
});

export const UpdateAbsenceSchema = z.object({
  justificationStatus: z.enum(['pending', 'justified', 'unjustified']).optional(),
  reviewNote: z.string().optional(),
  reason: z.string().optional(),
});

export const AbsenceFiltersSchema = z.object({
  employeeId: z.string().uuid().optional(),
  type: z.string().optional(),
  justificationStatus: z.enum(['pending', 'justified', 'unjustified']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateAbsenceInput = z.infer<typeof CreateAbsenceSchema>;
export type UpdateAbsenceInput = z.infer<typeof UpdateAbsenceSchema>;
export type AbsenceFiltersInput = z.infer<typeof AbsenceFiltersSchema>;
