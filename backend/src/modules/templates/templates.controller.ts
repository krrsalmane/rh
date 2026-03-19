import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import * as templatesService from './templates.service';
import { CreateTemplateSchema, UpdateTemplateSchema, PatchTemplateStatusSchema } from './templates.schema';

export const getTemplates = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const result = await templatesService.getTemplates(req.user!.companyId, page, limit);
  res.json({ status: 'success', data: result.items, pagination: result.pagination });
});

export const getTemplateById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const template = await templatesService.getTemplateById(req.params.id, req.user!.companyId);
  res.json({ status: 'success', data: template });
});

export const createTemplate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = CreateTemplateSchema.parse(req.body);
  const template = await templatesService.createTemplate(input, req.user!.companyId, req.user!.id);
  res.status(201).json({ status: 'success', data: template });
});

export const updateTemplate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = UpdateTemplateSchema.parse(req.body);
  const template = await templatesService.updateTemplate(req.params.id, input, req.user!.companyId, req.user!.id);
  res.json({ status: 'success', data: template });
});

export const patchTemplateStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { status } = PatchTemplateStatusSchema.parse(req.body);
  const template = await templatesService.patchTemplateStatus(req.params.id, status, req.user!.companyId, req.user!.id);
  res.json({ status: 'success', data: template });
});

export const deleteTemplate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await templatesService.deleteTemplate(req.params.id, req.user!.companyId, req.user!.id);
  res.json({ status: 'success', message: 'Template deleted successfully' });
});
