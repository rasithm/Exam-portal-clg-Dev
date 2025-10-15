//Exam-portal\Exam-Portal\backend\routes\studentRoutes.js
import express from "express";
import { protect } from "../middlewares/auth.js";
import Student from "../models/Student.js";
import Exam from "../models/Exam.js";
import {getStudentDashboard} from "../controllers/studentController.js"

const router = express.Router();

// ✅ Student dashboard API
// router.get("/dashboard", protect(["student"]), async (req, res) => {
//   try {
//     const student = await Student.findById(req.user._id).select("-password");
//     if (!student) return res.status(404).json({ message: "Student not found" });

//     const allExams = await Exam.find({ assignStudents: { $in: [student.rollNumber] } });

//     const now = new Date();

//     const upcomingExams = allExams.filter((e) => new Date(e.startDateTime) > now);
//     const completedExams = student.scores.map((s) => {
//       const exam = allExams.find((ex) => ex._id.toString() === s.examId);
//       return exam
//         ? {
//             id: exam._id,
//             title: exam.examName,
//             subject: exam.subcategory,
//             date: exam.startDateTime.toISOString().split("T")[0],
//             score: s.score,
//             totalMarks: exam.totalMarks || 100,
//             status: "completed",
//           }
//         : null;
//     }).filter(Boolean);

//     res.json({
//       student,
//       upcomingExams,
//       completedExams,
//     });
//   } catch (err) {
//     console.error("Dashboard fetch error:", err);
//     res.status(500).json({ message: "Error loading dashboard", error: err.message });
//   }
// });

router.get("/dashboard", protect(["student"]), getStudentDashboard);

export default router;
