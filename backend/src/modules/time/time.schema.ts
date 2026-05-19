import { z } from 'zod';

// 24-hour format validation (HH:MM)
const TimeFormat24H = z.string()
  .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid 24-hour format. Use HH:MM (00:00-23:59)')
  .describe('24-hour time format: HH:MM');

export const CreateTimeEntrySchema = z.object({
  employeeId: z.string().uuid(),
  date: z.string(),
  clockIn: TimeFormat24H.optional(),
  clockOut: TimeFormat24H.optional(),
  lunchOut: TimeFormat24H.optional(),
  lunchIn: TimeFormat24H.optional(),
  prayerOut: TimeFormat24H.optional(),
  prayerIn: TimeFormat24H.optional(),
  expectedHours: z.number().optional(),
  source: z.enum(['manual', 'system', 'import']).default('manual'),
  reason: z.string().optional(),
});

export const UpdateTimeEntrySchema = z.object({
  clockIn: TimeFormat24H.optional(),
  clockOut: TimeFormat24H.optional(),
  lunchOut: TimeFormat24H.optional(),
  lunchIn: TimeFormat24H.optional(),
  prayerOut: TimeFormat24H.optional(),
  prayerIn: TimeFormat24H.optional(),
  expectedHours: z.number().optional(),
  source: z.enum(['manual', 'system', 'import']).optional(),
  reason: z.string().optional(),
});

export const TimeActionSchema = z.object({
  action: z.enum(['morning-in', 'morning-out', 'lunch-out', 'lunch-in', 'prayer-out', 'prayer-in']),
  time: TimeFormat24H.optional(),
  employeeId: z.string().uuid().optional(),
  date: z.string().optional(),
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
