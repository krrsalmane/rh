import { Router } from 'express';
import * as auditLogsController from './auditLogs.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();
router.use(authenticate);

router.get('/', authorize('super_admin'), auditLogsController.getAuditLogs);

export default router;
