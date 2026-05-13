import { Router } from 'express';
import * as documentsController from './documents.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { GenerateDocumentSchema } from './documents.schema';

const router = Router();
router.use(authenticate);

router.get('/', authorize('super_admin', 'hr_agent'), documentsController.getDocuments);
router.post('/generate', authorize('super_admin', 'hr_agent'), validate(GenerateDocumentSchema), documentsController.generateDocument);
router.get('/available-templates', authorize('super_admin', 'hr_agent'), documentsController.listAvailableTemplates);
router.get('/template-content/:type/:lang', authorize('super_admin', 'hr_agent'), documentsController.getRawTemplateContent);

router.get('/:id', authorize('super_admin', 'hr_agent'), documentsController.getDocumentById);
router.get('/:id/pdf', authorize('super_admin', 'hr_agent'), documentsController.streamDocumentPDF);
router.get('/:id/download', authorize('super_admin', 'hr_agent'), documentsController.downloadDocument);
router.patch('/:id/archive', authorize('super_admin', 'hr_agent'), documentsController.archiveDocument);
router.delete('/:id', authorize('super_admin'), documentsController.deleteDocument);

export default router;
