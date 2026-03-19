import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import * as publicHolidaysService from './publicHolidays.service';
import { CreatePublicHolidaySchema, UpdatePublicHolidaySchema } from './publicHolidays.schema';

export const getPublicHolidays = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const year = req.query.year ? parseInt(req.query.year as string) : undefined;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const result = await publicHolidaysService.getPublicHolidays(req.user!.companyId, year, page, limit);
  res.json({ status: 'success', data: result.items, pagination: result.pagination });
});

export const getPublicHolidayById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const holiday = await publicHolidaysService.getPublicHolidayById(req.params.id, req.user!.companyId);
  res.json({ status: 'success', data: holiday });
});

export const createPublicHoliday = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = CreatePublicHolidaySchema.parse(req.body);
  const holiday = await publicHolidaysService.createPublicHoliday(input, req.user!.companyId, req.user!.id);
  res.status(201).json({ status: 'success', data: holiday });
});

export const updatePublicHoliday = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = UpdatePublicHolidaySchema.parse(req.body);
  const holiday = await publicHolidaysService.updatePublicHoliday(req.params.id, input, req.user!.companyId, req.user!.id);
  res.json({ status: 'success', data: holiday });
});

export const deletePublicHoliday = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await publicHolidaysService.deletePublicHoliday(req.params.id, req.user!.companyId, req.user!.id);
  res.json({ status: 'success', message: 'Public holiday deleted successfully' });
});
