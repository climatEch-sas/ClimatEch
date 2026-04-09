import { Router } from 'express';
import { getAll, getOne, create, update, remove, getMisOrdenes } from '../controllers/tecnico.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticate);
router.get('/', authorize('ADMIN', 'CLIENTE'), getAll);
router.get('/mis-ordenes', authorize('TECNICO'), getMisOrdenes);
router.get('/:id', authorize('ADMIN'), getOne);
router.post('/', authorize('ADMIN'), create);
router.put('/:id', authorize('ADMIN', 'TECNICO'), update);
router.delete('/:id', authorize('ADMIN'), remove);
export default router;
