import { z } from 'zod';

export const CreateLeaveRequestSchema = z.object({
  employeeId: z.string().uuid(),
  leaveTypeId: z.string().uuid(),
  startDate: z.string(),
  endDate: z.string(),
  workingDays: z.number().int().positive().optional(),
});

export const ReviewLeaveSchema = z.object({
  approvalNote: z.string().optional(),
});

export const LeaveFiltersSchema = z.object({
  employeeId: z.string().uuid().optional(),
  leaveTypeId: z.string().uuid().optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'cancelled']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateLeaveRequestInput = z.infer<typeof CreateLeaveRequestSchema>;
export type ReviewLeaveInput = z.infer<typeof ReviewLeaveSchema>;
export type LeaveFiltersInput = z.infer<typeof LeaveFiltersSchema>;
