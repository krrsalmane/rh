import { Router } from 'express';
import * as dashboardController from './dashboard.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

router.get('/', authenticate, dashboardController.getDashboard);

export default router;
