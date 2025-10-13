// C:\Users\nazeer\Downloads\Exam-portal\Exam-portal\backend\routes\examRoutes.js
import express from "express";
import { protect } from "../middlewares/auth.js";
import { createExam, getExams } from "../controllers/examController.js";

const router = express.Router();

// Admin creates exam
router.post("/create", protect(["admin"]), createExam);
router.get("/list", protect(["admin"]), getExams);
// Student fetches exams
// router.get("/list", protect(["student"]), getExamsForStudent);

// Student fetches one exam
// router.get("/:id", protect(["student"]), getExamById);

export default router;
