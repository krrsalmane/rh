import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import * as settingsService from './settings.service';
import { UpdateSettingsSchema, CreateDepartmentSchema } from './settings.schema';

export const getSettings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const settings = await settingsService.getCompanySettings(req.user!.companyId);
  res.json({ status: 'success', data: settings });
});

export const updateSettings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = UpdateSettingsSchema.parse(req.body);
  const settings = await settingsService.updateCompanySettings(input, req.user!.companyId, req.user!.id);
  res.json({ status: 'success', data: settings });
});

export const getDepartments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const departments = await settingsService.getDepartments(req.user!.companyId);
  res.json({ status: 'success', data: departments });
});

export const createDepartment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = CreateDepartmentSchema.parse(req.body);
  const department = await settingsService.createDepartment(input, req.user!.companyId, req.user!.id);
  res.json({ status: 'success', data: department });
});

export const deleteDepartment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const result = await settingsService.deleteDepartment(id, req.user!.companyId, req.user!.id);
  res.json(result);
});

