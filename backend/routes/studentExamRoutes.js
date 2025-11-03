//C:\Users\nazeer\Desktop\Exam-edit\Exam-portal\Exam-Portal\backend\routes\studentExamRoutes.js
import express from "express";
import { protect } from "../middlewares/auth.js";
import {
  startExam,
  saveAnswer,
  submitExam,
  recordEvent,
  getExam
} from "../controllers/examController.js";

const router = express.Router();

// ✅ MATCHING FRONTEND ROUTES
router.post("/:examId/start", protect(["student"]), startExam);
router.get("/:examId", protect(["student"]), getExam);
router.post("/:examId/save", protect(["student"]), saveAnswer); 
router.post("/:examId/submit", protect(["student"]), submitExam);
router.post("/:examId/event", protect(["student"]), recordEvent);

export default router;
