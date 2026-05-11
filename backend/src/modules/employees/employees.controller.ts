import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import * as employeesService from './employees.service';
import { CreateEmployeeSchema, UpdateEmployeeSchema, EmployeeFiltersSchema } from './employees.schema';

export const getEmployees = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const filters = EmployeeFiltersSchema.parse(req.query);
  const result = await employeesService.getEmployees(filters, req.user!);
  res.json({ status: 'success', data: result.items, pagination: result.pagination });
});

export const getEmployeeById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { employee, leaveBalances } = await employeesService.getEmployeeById(req.params.id, req.user!);
  res.json({ status: 'success', data: { ...employee, leaveBalances } });
});

export const createEmployee = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = CreateEmployeeSchema.parse(req.body);
  const employee = await employeesService.createEmployee(input, req.user!);
  res.status(201).json({ status: 'success', data: employee });
});

export const updateEmployee = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = UpdateEmployeeSchema.parse(req.body);
  const employee = await employeesService.updateEmployee(req.params.id, input, req.user!);
  res.json({ status: 'success', data: employee });
});

export const deleteEmployee = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await employeesService.deleteEmployee(req.params.id, req.user!);
  res.json({ status: 'success', message: 'Employee deleted successfully' });
});

export const getDepartments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const departments = await employeesService.getDepartments(req.user!);
  res.json({ status: 'success', data: departments });
});

export const getLeaveBalances = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const balances = await employeesService.getLeaveBalances(req.params.id, req.user!);
  res.json({ status: 'success', data: balances });
});
