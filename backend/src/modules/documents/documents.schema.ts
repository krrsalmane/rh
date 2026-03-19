import { z } from 'zod';

export const GenerateDocumentSchema = z.object({
  templateId: z.string().uuid(),
  employeeId: z.string().uuid(),
  formData: z.record(z.string(), z.unknown()).default({}),
  language: z.enum(['fr', 'ar', 'en', 'de']).optional(),
});

export const DocumentFiltersSchema = z.object({
  employeeId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
  status: z.enum(['generated', 'archived', 'deleted']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type GenerateDocumentInput = z.infer<typeof GenerateDocumentSchema>;
export type DocumentFiltersInput = z.infer<typeof DocumentFiltersSchema>;
