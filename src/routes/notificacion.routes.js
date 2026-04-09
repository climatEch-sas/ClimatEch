import { Router } from 'express';
import { getMias, marcarLeida, marcarTodasLeidas, crear } from '../controllers/notificacion.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', getMias);
router.patch('/leer-todas', marcarTodasLeidas);
router.patch('/:id/leer', marcarLeida);
router.post('/', authorize('ADMIN'), crear);

export default router;