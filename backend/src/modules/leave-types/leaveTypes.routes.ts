import { Router } from 'express';
import * as leaveTypesController from './leaveTypes.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { CreateLeaveTypeSchema, UpdateLeaveTypeSchema } from './leaveTypes.schema';

const router = Router();
router.use(authenticate);

router.get('/', authorize('super_admin', 'hr_agent', 'manager', 'employee'), leaveTypesController.getLeaveTypes);
router.get('/:id', authorize('super_admin', 'hr_agent'), leaveTypesController.getLeaveTypeById);
router.post('/', authorize('super_admin', 'hr_agent'), validate(CreateLeaveTypeSchema), leaveTypesController.createLeaveType);
router.put('/:id', authorize('super_admin', 'hr_agent'), validate(UpdateLeaveTypeSchema), leaveTypesController.updateLeaveType);
router.delete('/:id', authorize('super_admin'), leaveTypesController.deleteLeaveType);

export default router;
