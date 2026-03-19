import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import * as leaveTypesService from './leaveTypes.service';
import { CreateLeaveTypeSchema, UpdateLeaveTypeSchema } from './leaveTypes.schema';

export const getLeaveTypes = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const result = await leaveTypesService.getLeaveTypes(req.user!.companyId, page, limit);
  res.json({ status: 'success', data: result.items, pagination: result.pagination });
});

export const getLeaveTypeById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const lt = await leaveTypesService.getLeaveTypeById(req.params.id, req.user!.companyId);
  res.json({ status: 'success', data: lt });
});

export const createLeaveType = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = CreateLeaveTypeSchema.parse(req.body);
  const lt = await leaveTypesService.createLeaveType(input, req.user!.companyId, req.user!.id);
  res.status(201).json({ status: 'success', data: lt });
});

export const updateLeaveType = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = UpdateLeaveTypeSchema.parse(req.body);
  const lt = await leaveTypesService.updateLeaveType(req.params.id, input, req.user!.companyId, req.user!.id);
  res.json({ status: 'success', data: lt });
});

export const deleteLeaveType = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await leaveTypesService.deleteLeaveType(req.params.id, req.user!.companyId, req.user!.id);
  res.json({ status: 'success', message: 'Leave type deleted successfully' });
});
