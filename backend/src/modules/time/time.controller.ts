import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import * as timeService from './time.service';
import { CreateTimeEntrySchema, UpdateTimeEntrySchema, TimeEntryFiltersSchema } from './time.schema';

export const getTimeEntries = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const filters = TimeEntryFiltersSchema.parse(req.query);
  const result = await timeService.getTimeEntries(filters, req.user!);
  res.json({ status: 'success', data: result.items, pagination: result.pagination });
});

export const getTimeEntryById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const entry = await timeService.getTimeEntryById(req.params.id, req.user!);
  res.json({ status: 'success', data: entry });
});

export const createTimeEntry = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = CreateTimeEntrySchema.parse(req.body);
  const entry = await timeService.createTimeEntry(input, req.user!);
  res.status(201).json({ status: 'success', data: entry });
});

export const updateTimeEntry = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = UpdateTimeEntrySchema.parse(req.body);
  const entry = await timeService.updateTimeEntry(req.params.id, input, req.user!);
  res.json({ status: 'success', data: entry });
});

export const deleteTimeEntry = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await timeService.deleteTimeEntry(req.params.id, req.user!);
  res.json({ status: 'success', message: 'Time entry deleted successfully' });
});

export const getTimeSummary = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { employeeId, startDate, endDate } = req.query as Record<string, string>;
  const summary = await timeService.getTimeSummary(employeeId, startDate, endDate, req.user!);
  res.json({ status: 'success', data: summary });
});
