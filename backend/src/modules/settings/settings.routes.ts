import { Router } from 'express';
import * as settingsController from './settings.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();
router.use(authenticate);

router.get('/', authorize('super_admin', 'hr_agent'), settingsController.getSettings);
router.put('/', authorize('super_admin'), settingsController.updateSettings);

export default router;
