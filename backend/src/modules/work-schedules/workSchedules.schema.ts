import { z } from 'zod';

export const CreateWorkScheduleSchema = z.object({
  name: z.string().min(1).max(100),
  weeklyHours: z.number().positive().optional(),
  dailyHours: z.number().positive().optional(),
  workDays: z.array(z.number().int().min(0).max(6)).optional(),
  breakMinutes: z.number().int().nonnegative().default(60),
  isRotating: z.boolean().default(false),
});

export const UpdateWorkScheduleSchema = CreateWorkScheduleSchema.partial();

export type CreateWorkScheduleInput = z.infer<typeof CreateWorkScheduleSchema>;
export type UpdateWorkScheduleInput = z.infer<typeof UpdateWorkScheduleSchema>;
