import { Router } from 'express';
import * as documentsController from './documents.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { GenerateDocumentSchema } from './documents.schema';

const router = Router();
router.use(authenticate);

router.get('/', authorize('super_admin', 'hr_agent', 'manager', 'employee'), documentsController.getDocuments);
router.get('/:id', authorize('super_admin', 'hr_agent'), documentsController.getDocumentById);
router.post('/generate', authorize('super_admin', 'hr_agent'), validate(GenerateDocumentSchema), documentsController.generateDocument);
router.get('/:id/download', authorize('super_admin', 'hr_agent', 'manager', 'employee'), documentsController.downloadDocument);

export default router;
