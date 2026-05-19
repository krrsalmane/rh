import { z } from 'zod';

export const CreateTimeEntrySchema = z.object({
  employeeId: z.string().uuid(),
  date: z.string(),
  clockIn: z.string().optional(),
  clockOut: z.string().optional(),
  lunchOut: z.string().optional(),
  lunchIn: z.string().optional(),
  expectedHours: z.number().optional(),
  source: z.enum(['manual', 'system', 'import']).default('manual'),
  reason: z.string().optional(),
});

export const UpdateTimeEntrySchema = z.object({
  clockIn: z.string().optional(),
  clockOut: z.string().optional(),
  lunchOut: z.string().optional(),
  lunchIn: z.string().optional(),
  expectedHours: z.number().optional(),
  source: z.enum(['manual', 'system', 'import']).optional(),
  reason: z.string().optional(),
});

export const TimeEntryFiltersSchema = z.object({
  employeeId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  managerId: z.string().uuid().optional(),
  format: z.enum(['csv', 'pdf']).optional(),
});

export type CreateTimeEntryInput = z.infer<typeof CreateTimeEntrySchema>;
export type UpdateTimeEntryInput = z.infer<typeof UpdateTimeEntrySchema>;
export type TimeEntryFiltersInput = z.infer<typeof TimeEntryFiltersSchema>;
