import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import * as documentsService from './documents.service';
import { GenerateDocumentSchema } from './documents.schema';

export const getDocuments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const result = await documentsService.getDocuments(req.user!.companyId, page, limit);
  res.json({ status: 'success', data: result.items, pagination: result.pagination });
});

export const getDocumentById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const doc = await documentsService.getDocumentById(req.params.id, req.user!.companyId);
  res.json({ status: 'success', data: doc });
});

export const generateDocument = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = GenerateDocumentSchema.parse(req.body);
  const doc = await documentsService.generateDocument(input, req.user!.companyId, req.user!.id);
  res.status(201).json({ status: 'success', data: doc });
});

export const downloadDocument = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const filePath = await documentsService.getDocumentFile(req.params.id, req.user!.companyId);
  res.download(filePath);
});
