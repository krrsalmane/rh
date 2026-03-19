import { z } from 'zod';

export const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  category: z.string().optional(),
  language: z.string().default('fr'),
  body: z.string().min(1),
  variableSchema: z.array(z.object({
    key: z.string(),
    label: z.string(),
    type: z.enum(['text', 'date', 'number', 'select']),
    required: z.boolean().default(false),
    options: z.array(z.string()).optional(),
  })).optional(),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
});

export const UpdateTemplateSchema = CreateTemplateSchema.partial();

export const PatchTemplateStatusSchema = z.object({
  status: z.enum(['draft', 'active', 'archived']),
});

export type CreateTemplateInput = z.infer<typeof CreateTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof UpdateTemplateSchema>;
