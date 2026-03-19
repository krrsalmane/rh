import { z } from 'zod';

export const GenerateDocumentSchema = z.object({
  templateId: z.string().uuid(),
  employeeId: z.string().uuid(),
  formData: z.record(z.string(), z.unknown()).default({}),
});

export type GenerateDocumentInput = z.infer<typeof GenerateDocumentSchema>;
