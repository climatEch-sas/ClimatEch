import { Router } from 'express';
import { getMetrics, getTecnicoDashboard, getClienteDashboard } from '../controllers/dashboard.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticate);
router.get('/admin', authorize('ADMIN'), getMetrics);
router.get('/tecnico', authorize('TECNICO'), getTecnicoDashboard);
router.get('/cliente', authorize('CLIENTE'), getClienteDashboard);
export default router;
