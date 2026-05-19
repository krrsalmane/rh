import { Router } from 'express';
import * as timeController from './time.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { CreateTimeEntrySchema, UpdateTimeEntrySchema, TimeActionSchema } from './time.schema';

const router = Router();
router.use(authenticate);

router.get('/', authorize('super_admin', 'hr_agent', 'manager', 'employee'), timeController.getTimeEntries);
router.get('/summary', authorize('super_admin', 'hr_agent', 'manager', 'employee'), timeController.getTimeSummary);
router.get('/export', authorize('super_admin', 'hr_agent', 'manager', 'employee'), timeController.exportTimeEntries);
router.get('/:id', authorize('super_admin', 'hr_agent', 'manager', 'employee'), timeController.getTimeEntryById);
router.post('/clock-in', authorize('employee'), timeController.clockIn);
router.post('/clock-out', authorize('employee'), timeController.clockOut);
router.post('/time-action', authorize('super_admin', 'hr_agent', 'manager', 'employee'), validate(TimeActionSchema), timeController.recordTimeAction);
router.post('/generate-defaults', authorize('super_admin', 'hr_agent'), timeController.generateDefaultTimeEntries);
router.post('/', authorize('super_admin', 'hr_agent'), validate(CreateTimeEntrySchema), timeController.createTimeEntry);
router.put('/:id', authorize('super_admin', 'hr_agent'), validate(UpdateTimeEntrySchema), timeController.updateTimeEntry);
router.delete('/:id', authorize('super_admin'), timeController.deleteTimeEntry);

export default router;
