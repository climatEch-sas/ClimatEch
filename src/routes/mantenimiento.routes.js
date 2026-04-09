import { Router } from 'express';
import { create, getByOrden, completar, update } from '../controllers/mantenimiento.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticate);
router.get('/orden/:ordenId', authorize('ADMIN', 'TECNICO', 'CLIENTE'), getByOrden);
router.post('/', authorize('ADMIN', 'TECNICO'), create);
router.put('/:id', authorize('ADMIN', 'TECNICO'), update);
router.post('/completar', authorize('ADMIN', 'TECNICO'), completar);
export default router;
