import { Router } from 'express';
import { getAll, getOne, create, update, remove } from '../controllers/orden.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticate);
router.get('/', authorize('ADMIN', 'TECNICO', 'CLIENTE'), getAll);
router.get('/:id', authorize('ADMIN', 'TECNICO', 'CLIENTE'), getOne);
router.post('/', authorize('ADMIN', 'CLIENTE'), create);
router.put('/:id', authorize('ADMIN', 'TECNICO'), update);
router.delete('/:id', authorize('ADMIN'), remove);
export default router;
