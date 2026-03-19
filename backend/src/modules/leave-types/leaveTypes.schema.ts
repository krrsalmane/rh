import { z } from 'zod';

export const CreateLeaveTypeSchema = z.object({
  name: z.string().min(1).max(100),
  annualDays: z.number().int().nonnegative().optional(),
  accrualRule: z.string().optional(),
  carryOverMax: z.number().int().nonnegative().default(0),
  requiresApproval: z.boolean().default(true),
});

export const UpdateLeaveTypeSchema = CreateLeaveTypeSchema.partial();

export type CreateLeaveTypeInput = z.infer<typeof CreateLeaveTypeSchema>;
export type UpdateLeaveTypeInput = z.infer<typeof UpdateLeaveTypeSchema>;
