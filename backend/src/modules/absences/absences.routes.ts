import { Router } from 'express';
import * as absencesController from './absences.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { upload } from '../../middleware/upload';
import { CreateAbsenceSchema } from './absences.schema';

const router = Router();
router.use(authenticate);

router.get('/', authorize('super_admin', 'hr_agent', 'manager', 'employee'), absencesController.getAbsences);
router.get('/analytics', authorize('super_admin', 'hr_agent', 'manager'), absencesController.getAnalytics);
router.get('/:id', authorize('super_admin', 'hr_agent', 'manager'), absencesController.getAbsenceById);
router.post('/', authorize('super_admin', 'hr_agent', 'manager'), validate(CreateAbsenceSchema), absencesController.createAbsence);
router.put('/:id/justify', authorize('super_admin', 'hr_agent'), upload.array('attachments', 5), absencesController.justifyAbsence);
router.put('/:id/unjustify', authorize('super_admin', 'hr_agent'), absencesController.markUnjustified);
router.delete('/:id', authorize('super_admin'), absencesController.deleteAbsence);

export default router;
