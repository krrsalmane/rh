import { z } from 'zod';

export const UpdateSettingsSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  address: z.string().optional(),
  logoUrl: z.string().url().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export type UpdateSettingsInput = z.infer<typeof UpdateSettingsSchema>;

export const CreateDepartmentSchema = z.object({
  name: z.string().min(1).max(255),
});

export type CreateDepartmentInput = z.infer<typeof CreateDepartmentSchema>;

