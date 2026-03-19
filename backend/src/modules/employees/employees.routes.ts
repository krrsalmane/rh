import { Router } from 'express';
import * as employeesController from './employees.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { CreateEmployeeSchema, UpdateEmployeeSchema } from './employees.schema';
import rateLimit from 'express-rate-limit';

const employeesLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests to employees endpoint, please try again later.',
  },
});

const router = Router();
router.use(authenticate);
router.use(employeesLimiter);

// Static routes MUST come before parameterized routes
router.get('/departments', authorize('super_admin', 'hr_agent'), employeesController.getDepartments);

router.get('/', authorize('super_admin', 'hr_agent'), employeesController.getEmployees);
router.get('/:id', authorize('super_admin', 'hr_agent'), employeesController.getEmployeeById);
router.get('/:id/leave-balances', authorize('super_admin', 'hr_agent'), employeesController.getLeaveBalances);

router.post('/', authorize('super_admin', 'hr_agent'), validate(CreateEmployeeSchema), employeesController.createEmployee);
router.put('/:id', authorize('super_admin', 'hr_agent'), validate(UpdateEmployeeSchema), employeesController.updateEmployee);
router.delete('/:id', authorize('super_admin'), employeesController.deleteEmployee);

export default router;
