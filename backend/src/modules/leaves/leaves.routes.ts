import { Router } from 'express';
import * as leavesController from './leaves.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { CreateLeaveRequestSchema } from './leaves.schema';

const router = Router();
router.use(authenticate);

router.get('/', authorize('super_admin', 'hr_agent', 'manager', 'employee'), leavesController.getLeaveRequests);
router.get('/balance/:employeeId', authorize('super_admin', 'hr_agent', 'manager', 'employee'), leavesController.getBalances);
router.get('/:id', authorize('super_admin', 'hr_agent', 'manager', 'employee'), leavesController.getLeaveRequestById);
router.post('/', authorize('super_admin', 'hr_agent', 'manager', 'employee'), validate(CreateLeaveRequestSchema), leavesController.createLeaveRequest);
router.put('/:id/approve', authorize('super_admin', 'hr_agent', 'manager'), leavesController.approveLeaveRequest);
router.put('/:id/reject', authorize('super_admin', 'hr_agent', 'manager'), leavesController.rejectLeaveRequest);
router.put('/:id/cancel', authorize('super_admin', 'hr_agent', 'manager', 'employee'), leavesController.cancelLeaveRequest);
router.put('/balance/:employeeId/adjust', authorize('super_admin', 'hr_agent'), leavesController.adjustBalance);

export default router;
