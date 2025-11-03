// routes/authRoutes.js
import express from 'express';
import { adminLogin, studentLogin , adminLogout , studentLogout } from '../controllers/authController.js';
import { rateLimiterStrict } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.post('/admin/login' ,adminLogin);
router.post('/student/login', studentLogin);
router.post("/admin/logout", adminLogout);
router.post("/student/logout", studentLogout);

export default router;
