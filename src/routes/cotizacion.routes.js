import { Router } from 'express';
import { getAll, getOne, create, updateEstado, remove, generatePDF, getSolicitudesByCliente } from '../controllers/cotizacion.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticate);
router.get('/', authorize('ADMIN', 'CLIENTE'), getAll);
router.get('/solicitudes/:clienteId', authorize('ADMIN'), getSolicitudesByCliente);
router.get('/:id', authorize('ADMIN', 'CLIENTE'), getOne);
router.get('/:id/pdf', authorize('ADMIN', 'CLIENTE'), generatePDF);
router.post('/', authorize('ADMIN'), create);
router.put('/:id/estado', authorize('ADMIN', 'CLIENTE'), updateEstado);
router.delete('/:id', authorize('ADMIN'), remove);
export default router;
