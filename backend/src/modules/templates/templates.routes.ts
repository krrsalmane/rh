import { Router } from 'express';
import * as templatesController from './templates.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { CreateTemplateSchema, UpdateTemplateSchema, PatchTemplateStatusSchema } from './templates.schema';

const router = Router();
router.use(authenticate);

// Static routes first
router.get('/active', authorize('super_admin', 'hr_agent'), templatesController.getActiveTemplates);

router.get('/', authorize('super_admin', 'hr_agent'), templatesController.getTemplates);
router.get('/:id', authorize('super_admin', 'hr_agent'), templatesController.getTemplateById);
router.post('/', authorize('super_admin', 'hr_agent'), validate(CreateTemplateSchema), templatesController.createTemplate);
router.put('/:id', authorize('super_admin', 'hr_agent'), validate(UpdateTemplateSchema), templatesController.updateTemplate);
router.patch('/:id/status', authorize('super_admin', 'hr_agent'), validate(PatchTemplateStatusSchema), templatesController.patchTemplateStatus);
router.delete('/:id', authorize('super_admin'), templatesController.deleteTemplate);

export default router;
