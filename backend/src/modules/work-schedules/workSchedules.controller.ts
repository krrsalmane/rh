import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import * as workSchedulesService from './workSchedules.service';
import { CreateWorkScheduleSchema, UpdateWorkScheduleSchema } from './workSchedules.schema';

export const getWorkSchedules = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const result = await workSchedulesService.getWorkSchedules(req.user!.companyId, page, limit);
  res.json({ status: 'success', data: result.items, pagination: result.pagination });
});

export const getWorkScheduleById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const schedule = await workSchedulesService.getWorkScheduleById(req.params.id, req.user!.companyId);
  res.json({ status: 'success', data: schedule });
});

export const createWorkSchedule = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = CreateWorkScheduleSchema.parse(req.body);
  const schedule = await workSchedulesService.createWorkSchedule(input, req.user!.companyId, req.user!.id);
  res.status(201).json({ status: 'success', data: schedule });
});

export const updateWorkSchedule = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = UpdateWorkScheduleSchema.parse(req.body);
  const schedule = await workSchedulesService.updateWorkSchedule(req.params.id, input, req.user!.companyId, req.user!.id);
  res.json({ status: 'success', data: schedule });
});

export const deleteWorkSchedule = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await workSchedulesService.deleteWorkSchedule(req.params.id, req.user!.companyId, req.user!.id);
  res.json({ status: 'success', message: 'Work schedule deleted successfully' });
});
