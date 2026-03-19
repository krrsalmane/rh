import { Router } from 'express';
import * as employeesController from './employees.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { CreateEmployeeSchema, UpdateEmployeeSchema } from './employees.schema';

const router = Router();
router.use(authenticate);

router.get('/', authorize('super_admin', 'hr_agent', 'manager'), employeesController.getEmployees);
router.get('/:id', authorize('super_admin', 'hr_agent', 'manager', 'employee'), employeesController.getEmployeeById);
router.post('/', authorize('super_admin', 'hr_agent'), validate(CreateEmployeeSchema), employeesController.createEmployee);
router.put('/:id', authorize('super_admin', 'hr_agent'), validate(UpdateEmployeeSchema), employeesController.updateEmployee);
router.patch('/:id/deactivate', authorize('super_admin', 'hr_agent'), employeesController.deactivateEmployee);
router.delete('/:id', authorize('super_admin'), employeesController.deleteEmployee);

export default router;
