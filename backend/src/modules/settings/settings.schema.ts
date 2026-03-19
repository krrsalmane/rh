import { z } from 'zod';

export const UpdateSettingsSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  address: z.string().optional(),
  logoUrl: z.string().url().optional(),
});

export type UpdateSettingsInput = z.infer<typeof UpdateSettingsSchema>;
