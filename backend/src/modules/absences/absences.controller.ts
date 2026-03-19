import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import * as absencesService from './absences.service';
import { CreateAbsenceSchema, AbsenceFiltersSchema } from './absences.schema';

export const getAbsences = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const filters = AbsenceFiltersSchema.parse(req.query);
  const result = await absencesService.getAbsences(filters, req.user!.companyId);
  res.json({ status: 'success', data: result.items, pagination: result.pagination });
});

export const getAbsenceById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const absence = await absencesService.getAbsenceById(req.params.id, req.user!.companyId);
  res.json({ status: 'success', data: absence });
});

export const createAbsence = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = CreateAbsenceSchema.parse(req.body);
  const absence = await absencesService.createAbsence(input, req.user!.companyId, req.user!.id);
  res.status(201).json({ status: 'success', data: absence });
});

export const justifyAbsence = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const reviewNote = req.body.reviewNote || '';
  const files = req.files as Express.Multer.File[] | undefined;
  const attachments = files ? files.map(f => f.path) : [];
  const absence = await absencesService.justifyAbsence(req.params.id, reviewNote, attachments, req.user!.companyId, req.user!.id);
  res.json({ status: 'success', data: absence });
});

export const markUnjustified = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { reviewNote } = req.body;
  const absence = await absencesService.markUnjustified(req.params.id, reviewNote || '', req.user!.companyId, req.user!.id);
  res.json({ status: 'success', data: absence });
});

export const deleteAbsence = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await absencesService.deleteAbsence(req.params.id, req.user!.companyId, req.user!.id);
  res.json({ status: 'success', message: 'Absence deleted successfully' });
});

export const getAnalytics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { startDate, endDate } = req.query as Record<string, string>;
  const analytics = await absencesService.getAnalytics(req.user!.companyId, startDate, endDate);
  res.json({ status: 'success', data: analytics });
});
