import { Router } from 'express';
import { createTestData } from './test.controller';

const router = Router();

// Create test data for leave requests (no auth required for testing)
router.post('/create-test-data', createTestData);

export default router;
