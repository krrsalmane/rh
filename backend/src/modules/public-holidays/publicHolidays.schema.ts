import { z } from 'zod';

export const CreatePublicHolidaySchema = z.object({
  name: z.string().min(1).max(255),
  date: z.string(),
  year: z.number().int(),
});

export const UpdatePublicHolidaySchema = CreatePublicHolidaySchema.partial();

export type CreatePublicHolidayInput = z.infer<typeof CreatePublicHolidaySchema>;
export type UpdatePublicHolidayInput = z.infer<typeof UpdatePublicHolidaySchema>;
