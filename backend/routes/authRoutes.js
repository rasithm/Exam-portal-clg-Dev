// routes/authRoutes.js
import express from 'express';
import { adminLogin, studentLogin , adminLogout , studentLogout , getMe } from '../controllers/authController.js';
import { rateLimiterStrict } from '../middlewares/rateLimiter.js';
import { protect } from "../middlewares/auth.js";
const router = express.Router();

router.post('/admin/login' ,adminLogin);
router.post('/student/login', studentLogin);
router.post("/admin/logout", adminLogout);
router.post("/student/logout", studentLogout);
router.get("/me", protect(["admin", "student", "creator"]), getMe);

export default router;
