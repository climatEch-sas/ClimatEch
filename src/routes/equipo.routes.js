import { Router } from 'express';
import { getAll, getOne, create, update, remove } from '../controllers/equipo.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticate);
router.get('/', authorize('ADMIN', 'TECNICO', 'CLIENTE'), getAll);
router.get('/:id', authorize('ADMIN', 'TECNICO'), getOne);
// CLIENTE puede registrar su propio equipo
router.post('/', authorize('ADMIN', 'CLIENTE'), create);
router.put('/:id', authorize('ADMIN'), update);
router.delete('/:id', authorize('ADMIN'), remove);
export default router;
