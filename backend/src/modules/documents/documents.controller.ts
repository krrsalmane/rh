import { Request, Response } from 'express';
import fs from 'fs';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import * as documentsService from './documents.service';
import { GenerateDocumentSchema, DocumentFiltersSchema } from './documents.schema';

export const getDocuments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const filters = DocumentFiltersSchema.parse(req.query);
  const result = await documentsService.getDocuments(req.user!.companyId, filters);
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

export const streamDocumentPDF = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { filePath, filename } = await documentsService.getDocumentFile(req.params.id, req.user!.companyId);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

export const downloadDocument = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { filePath, filename } = await documentsService.getDocumentFile(req.params.id, req.user!.companyId);
  res.download(filePath, filename);
});

export const archiveDocument = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const doc = await documentsService.archiveDocument(req.params.id, req.user!.companyId, req.user!.id);
  res.json({ status: 'success', data: doc });
});

export const deleteDocument = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await documentsService.deleteDocument(req.params.id, req.user!.companyId, req.user!.id);
  res.json({ status: 'success', message: 'Document deleted successfully' });
});
