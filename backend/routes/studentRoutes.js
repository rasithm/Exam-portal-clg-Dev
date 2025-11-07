//Exam-portal\Exam-Portal\backend\routes\studentRoutes.js
import express from "express";
import { protect } from "../middlewares/auth.js";
import Student from "../models/Student.js";
import Exam from "../models/Exam.js";
import {getStudentDashboard} from "../controllers/studentController.js"
import { getProfile, updateProfile, updatePassword } from "../controllers/studentProfileController.js";
import { uploadProfile } from "../middlewares/upload.js";

const router = express.Router();


router.get("/dashboard", protect(["student"]), getStudentDashboard);

// 🧾 Fetch logged-in student profile
router.get("/profile", protect(["student"]), getProfile);

// 📝 Update student profile (with optional image)
router.put("/profile", protect(["student"]), uploadProfile.single("profileImage"), updateProfile);

// 🔒 Update password
router.put("/profile/password", protect(["student"]), updatePassword);

export default router;
