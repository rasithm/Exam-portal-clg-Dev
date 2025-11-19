//C:\Users\nazeer\Desktop\Exam-edit\Exam-portal\Exam-Portal\backend\routes\studentExamRoutes.js
import express from "express";
import { protect } from "../middlewares/auth.js";
import {
  startExam,
  saveAnswer,
  submitExam,
  recordEvent,
  getExam,
  getExamResult,
  getExamReport,
  exportExamReportXlsx,
  exportExamReportPdf,
  clearExamReview,
} from "../controllers/examController.js";

const router = express.Router();

// ✅ MATCHING FRONTEND ROUTES
router.post("/:examId/start", protect(["student"]), startExam);
router.get("/:examId", protect(["student"]), getExam);
router.post("/:examId/save", protect(["student"]), saveAnswer); 
router.post("/:examId/event", protect(["student"]), recordEvent);
router.post("/:examId/submit", protect(["student"]), submitExam);

router.get("/:examId/result", protect(["student"]), getExamResult);
router.post("/:examId/clear-review", protect(["student"]), clearExamReview);

router.get("/:examId/report", protect(["admin"]), getExamReport);
router.get("/:examId/report.xlsx", protect(["admin"]), exportExamReportXlsx);
router.get("/:examId/report.pdf", protect(["admin"]), exportExamReportPdf);


export default router;
