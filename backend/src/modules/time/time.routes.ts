import { Router } from 'express';
import * as timeController from './time.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { CreateTimeEntrySchema, UpdateTimeEntrySchema } from './time.schema';

const router = Router();
router.use(authenticate);

router.get('/', authorize('super_admin', 'hr_agent', 'manager', 'employee'), timeController.getTimeEntries);
router.get('/summary', authorize('super_admin', 'hr_agent', 'manager', 'employee'), timeController.getTimeSummary);
router.get('/:id', authorize('super_admin', 'hr_agent', 'manager', 'employee'), timeController.getTimeEntryById);
router.post('/', authorize('super_admin', 'hr_agent'), validate(CreateTimeEntrySchema), timeController.createTimeEntry);
router.put('/:id', authorize('super_admin', 'hr_agent'), validate(UpdateTimeEntrySchema), timeController.updateTimeEntry);
router.delete('/:id', authorize('super_admin'), timeController.deleteTimeEntry);

export default router;
