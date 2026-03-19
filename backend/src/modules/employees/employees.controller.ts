import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import * as employeesService from './employees.service';
import { CreateEmployeeSchema, UpdateEmployeeSchema, EmployeeFiltersSchema } from './employees.schema';

export const getEmployees = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const filters = EmployeeFiltersSchema.parse(req.query);
  const result = await employeesService.getEmployees(filters, req.user!.companyId);
  res.json({ status: 'success', data: result.items, pagination: result.pagination });
});

export const getEmployeeById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const employee = await employeesService.getEmployeeById(req.params.id, req.user!.companyId);
  res.json({ status: 'success', data: employee });
});

export const createEmployee = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = CreateEmployeeSchema.parse(req.body);
  const employee = await employeesService.createEmployee(input, req.user!.companyId, req.user!.id);
  res.status(201).json({ status: 'success', data: employee });
});

export const updateEmployee = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = UpdateEmployeeSchema.parse(req.body);
  const employee = await employeesService.updateEmployee(req.params.id, input, req.user!.companyId, req.user!.id);
  res.json({ status: 'success', data: employee });
});

export const deleteEmployee = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await employeesService.deleteEmployee(req.params.id, req.user!.companyId, req.user!.id);
  res.json({ status: 'success', message: 'Employee deleted successfully' });
});

export const deactivateEmployee = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const employee = await employeesService.deactivateEmployee(req.params.id, req.user!.companyId, req.user!.id);
  res.json({ status: 'success', data: employee });
});
