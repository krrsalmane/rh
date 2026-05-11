import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import * as tasksService from './tasks.service';
import { CreateTaskSchema, UpdateTaskSchema, TaskFiltersSchema } from './tasks.schema';

export const getTasks = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const filters = TaskFiltersSchema.parse(req.query);
  const result = await tasksService.getTasks(filters, req.user!);
  res.json({ status: 'success', data: result.items, pagination: result.pagination });
});

export const getTaskById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const task = await tasksService.getTaskById(req.params.id, req.user!);
  res.json({ status: 'success', data: task });
});

export const createTask = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = CreateTaskSchema.parse(req.body);
  const task = await tasksService.createTask(input, req.user!);
  res.status(201).json({ status: 'success', data: task });
});

export const updateTask = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = UpdateTaskSchema.parse(req.body);
  const task = await tasksService.updateTask(req.params.id, input, req.user!);
  res.json({ status: 'success', data: task });
});

export const deleteTask = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await tasksService.deleteTask(req.params.id, req.user!);
  res.json({ status: 'success', message: 'Task deleted successfully' });
});
