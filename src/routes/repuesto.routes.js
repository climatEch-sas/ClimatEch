import { Router } from 'express';
import { getAll, create, update, remove } from '../controllers/repuesto.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticate);
router.get('/', authorize('ADMIN', 'TECNICO'), getAll);
router.post('/', authorize('ADMIN'), create);
router.put('/:id', authorize('ADMIN'), update);
router.delete('/:id', authorize('ADMIN'), remove);
export default router;
