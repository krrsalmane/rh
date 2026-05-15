import { z } from 'zod';

export const VariableSchemaItem = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['text', 'date', 'number', 'currency', 'select', 'textarea']),
  required: z.boolean().default(false),
  autoFill: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  defaultValue: z.string().optional(),
});

export const CreateTemplateSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100),
  category: z.enum(['contract', 'attestation', 'letter', 'custom']),
  language: z.enum(['fr', 'ar', 'en', 'de']).default('fr'),
  body: z.string().min(10, 'Le contenu doit contenir au moins 10 caractères'),
  bodyTranslations: z.record(z.enum(['fr', 'ar', 'en', 'de']), z.string()).optional(),
  variableSchema: z.array(VariableSchemaItem).default([]),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
});

export const UpdateTemplateSchema = CreateTemplateSchema.partial();

export const PatchTemplateStatusSchema = z.object({
  status: z.enum(['draft', 'active', 'archived']),
});

export const TemplateFiltersSchema = z.object({
  status: z.enum(['draft', 'active', 'archived']).optional(),
  category: z.enum(['contract', 'attestation', 'letter', 'custom']).optional(),
  language: z.enum(['fr', 'ar', 'en', 'de']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type VariableSchemaType = z.infer<typeof VariableSchemaItem>;
export type CreateTemplateInput = z.infer<typeof CreateTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof UpdateTemplateSchema>;
export type TemplateFiltersInput = z.infer<typeof TemplateFiltersSchema>;
