import { Router } from 'express';
import * as usersController from './users.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { CreateUserSchema, UpdateUserSchema } from './users.schema';

const router = Router();
router.use(authenticate);

router.get('/', authorize('super_admin'), usersController.getUsers);
router.get('/:id', authorize('super_admin'), usersController.getUserById);
router.post('/', authorize('super_admin'), validate(CreateUserSchema), usersController.createUser);
router.put('/:id', authorize('super_admin'), validate(UpdateUserSchema), usersController.updateUser);
router.patch('/:id/deactivate', authorize('super_admin'), usersController.deactivateUser);
router.patch('/:id/reactivate', authorize('super_admin'), usersController.reactivateUser);
router.patch('/:id/reset-password', authorize('super_admin'), usersController.resetPassword);
router.delete('/:id', authorize('super_admin'), usersController.deleteUser);

export default router;
