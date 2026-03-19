import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import * as leavesService from './leaves.service';
import { CreateLeaveRequestSchema, ReviewLeaveSchema, LeaveFiltersSchema } from './leaves.schema';

export const getLeaveRequests = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const filters = LeaveFiltersSchema.parse(req.query);
  const result = await leavesService.getLeaveRequests(filters, req.user!.companyId);
  res.json({ status: 'success', data: result.items, pagination: result.pagination });
});

export const getLeaveRequestById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const request = await leavesService.getLeaveRequestById(req.params.id, req.user!.companyId);
  res.json({ status: 'success', data: request });
});

export const createLeaveRequest = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = CreateLeaveRequestSchema.parse(req.body);
  const request = await leavesService.createLeaveRequest(input, req.user!.companyId, req.user!.id);
  res.status(201).json({ status: 'success', data: request });
});

export const approveLeaveRequest = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = ReviewLeaveSchema.parse(req.body);
  const request = await leavesService.approveLeaveRequest(req.params.id, input, req.user!.companyId, req.user!.id);
  res.json({ status: 'success', data: request });
});

export const rejectLeaveRequest = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = ReviewLeaveSchema.parse(req.body);
  const request = await leavesService.rejectLeaveRequest(req.params.id, input, req.user!.companyId, req.user!.id);
  res.json({ status: 'success', data: request });
});

export const cancelLeaveRequest = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const request = await leavesService.cancelLeaveRequest(req.params.id, req.user!.companyId, req.user!.id);
  res.json({ status: 'success', data: request });
});

export const getBalances = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const year = parseInt(req.query.year as string) || new Date().getFullYear();
  const balance = await leavesService.getBalances(req.params.employeeId, year);
  res.json({ status: 'success', data: balance });
});

export const adjustBalance = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { leaveTypeId, year, credited } = req.body;
  await leavesService.adjustBalance(req.params.employeeId, leaveTypeId, year, credited, req.user!.companyId, req.user!.id);
  res.json({ status: 'success', message: 'Balance adjusted' });
});
