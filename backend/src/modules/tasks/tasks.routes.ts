import { Router } from 'express';
import * as tasksController from './tasks.controller';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { CreateTaskSchema, UpdateTaskSchema } from './tasks.schema';

const router = Router();

// All authenticated users can see tasks (filtered by role in service)
router.get('/', authorize('super_admin', 'hr_agent', 'manager', 'employee'), tasksController.getTasks);
router.get('/:id', authorize('super_admin', 'hr_agent', 'manager', 'employee'), tasksController.getTaskById);

// Creation restricted to Admin, HR, and Managers
router.post('/', authorize('super_admin', 'hr_agent', 'manager'), validate(CreateTaskSchema), tasksController.createTask);

// Updates allowed for Admin, HR, Manager; Employees can update status of their own tasks
router.put('/:id', authorize('super_admin', 'hr_agent', 'manager', 'employee'), validate(UpdateTaskSchema), tasksController.updateTask);

// Deletion restricted to Admin, HR, and Managers
router.delete('/:id', authorize('super_admin', 'hr_agent', 'manager'), tasksController.deleteTask);

export default router;
