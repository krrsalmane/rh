import { z } from 'zod';

const DAY_NAME_TO_NUMBER: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const WorkDaySchema = z.preprocess((value) => {
  if (typeof value === 'string') {
    const normalized = value.toLowerCase().trim();
    return DAY_NAME_TO_NUMBER[normalized] ?? Number(value);
  }
  return value;
}, z.number().int().min(0).max(6));

export const CreateWorkScheduleSchema = z.object({
  name: z.string().min(1).max(100),
  weeklyHours: z.number().positive().optional(),
  dailyHours: z.number().positive().optional(),
  workDays: z.array(WorkDaySchema).optional(),
  breakMinutes: z.number().int().nonnegative().default(60),
  isRotating: z.boolean().default(false),
});

export const UpdateWorkScheduleSchema = CreateWorkScheduleSchema.partial();

export type CreateWorkScheduleInput = z.infer<typeof CreateWorkScheduleSchema>;
export type UpdateWorkScheduleInput = z.infer<typeof UpdateWorkScheduleSchema>;
