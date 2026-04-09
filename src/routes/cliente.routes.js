import { Router } from 'express';
import { getAll, getOne, create, update, remove } from '../controllers/cliente.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticate);
router.get('/', authorize('ADMIN'), getAll);
router.get('/:id', authorize('ADMIN'), getOne);
router.post('/', authorize('ADMIN'), create);
router.put('/:id', authorize('ADMIN'), update);
router.delete('/:id', authorize('ADMIN'), remove);
export default router;
