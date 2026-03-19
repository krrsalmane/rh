import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import * as auditLogsRepository from './auditLogs.repository';

export const getAuditLogs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const filters = {
    entity: req.query.entity as string | undefined,
    action: req.query.action as string | undefined,
    userId: req.query.userId as string | undefined,
    startDate: req.query.startDate as string | undefined,
    endDate: req.query.endDate as string | undefined,
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 20,
  };
  const result = await auditLogsRepository.findAll(filters, req.user!.companyId);
  res.json({ status: 'success', data: result.items, pagination: result.pagination });
});
