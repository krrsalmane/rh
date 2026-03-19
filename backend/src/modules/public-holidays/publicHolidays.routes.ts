import { Router } from 'express';
import * as publicHolidaysController from './publicHolidays.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { CreatePublicHolidaySchema, UpdatePublicHolidaySchema } from './publicHolidays.schema';

const router = Router();
router.use(authenticate);

router.get('/', authorize('super_admin', 'hr_agent', 'manager', 'employee'), publicHolidaysController.getPublicHolidays);
router.get('/:id', authorize('super_admin', 'hr_agent'), publicHolidaysController.getPublicHolidayById);
router.post('/', authorize('super_admin', 'hr_agent'), validate(CreatePublicHolidaySchema), publicHolidaysController.createPublicHoliday);
router.put('/:id', authorize('super_admin', 'hr_agent'), validate(UpdatePublicHolidaySchema), publicHolidaysController.updatePublicHoliday);
router.delete('/:id', authorize('super_admin'), publicHolidaysController.deletePublicHoliday);

export default router;
