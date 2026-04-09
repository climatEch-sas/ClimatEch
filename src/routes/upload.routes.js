import { Router } from 'express';
import { upload, uploadImage } from '../controllers/upload.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();
router.post('/image', authenticate, upload.single('image'), uploadImage);
export default router;
