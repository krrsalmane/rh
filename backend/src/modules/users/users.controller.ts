import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import * as usersService from './users.service';

export const getUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const filters = {
    search: req.query.search as string | undefined,
    role: req.query.role as string | undefined,
    isActive: req.query.isActive as string | undefined,
  };
  const result = await usersService.getUsers(req.user!.companyId, filters, page, limit);
  res.json({ status: 'success', data: result.items, pagination: result.pagination });
});

export const getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await usersService.getUserById(req.params.id, req.user!.companyId);
  res.json({ status: 'success', data: user });
});

export const createUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await usersService.createUser(req.body, req.user!.companyId, req.user!.id);
  res.status(201).json({ status: 'success', data: user });
});

export const updateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await usersService.updateUser(req.params.id, req.body, req.user!.companyId, req.user!.id);
  res.json({ status: 'success', data: user });
});

export const deactivateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await usersService.deactivateUser(req.params.id, req.user!.companyId, req.user!.id);
  res.json({ status: 'success', data: user });
});

export const reactivateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await usersService.reactivateUser(req.params.id, req.user!.companyId, req.user!.id);
  res.json({ status: 'success', data: user });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await usersService.resetPassword(req.params.id, req.user!.companyId, req.user!.id);
  res.json({ status: 'success', data: result });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await usersService.deleteUser(req.params.id, req.user!.companyId, req.user!.id);
  res.json({ status: 'success', message: 'Utilisateur supprimé avec succès' });
});
