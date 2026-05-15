import { Router } from 'express';
import * as workSchedulesController from './workSchedules.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { CreateWorkScheduleSchema, UpdateWorkScheduleSchema } from './workSchedules.schema';

const router = Router();
router.use(authenticate);

router.get('/', authorize('super_admin', 'hr_agent'), workSchedulesController.getWorkSchedules);
router.get('/:id', authorize('super_admin', 'hr_agent'), workSchedulesController.getWorkScheduleById);
router.post('/', authorize('super_admin', 'hr_agent'), validate(CreateWorkScheduleSchema), workSchedulesController.createWorkSchedule);
router.put('/:id', authorize('super_admin', 'hr_agent'), validate(UpdateWorkScheduleSchema), workSchedulesController.updateWorkSchedule);
router.delete('/:id', authorize('super_admin'), workSchedulesController.deleteWorkSchedule);

export default router;
