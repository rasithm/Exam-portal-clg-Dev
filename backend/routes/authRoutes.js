// routes/authRoutes.js
import express from 'express';
import { adminLogin, studentLogin } from '../controllers/authController.js';
import { rateLimiterStrict } from '../middlewares/rateLimiter.js';
const router = express.Router();

router.post('/admin/login' ,adminLogin);
router.post('/student/login', studentLogin);

export default router;
