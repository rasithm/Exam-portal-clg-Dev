// backend/routes/examRoutes.js
import express from "express";
import { protect } from "../middlewares/auth.js";
import {requireVerifiedAdmin} from "../middlewares/requireVerifiedAdmin.js";
import {
  createExam,
  listExams
           // may be used for admin force-close (not exposed to student here)
} from "../controllers/examController.js";

const router = express.Router();

/* ────────────────────────────────────────────────
   ✅ ADMIN ROUTES
   ──────────────────────────────────────────────── */
router.post("/create", protect(["admin"]), requireVerifiedAdmin,createExam);
router.get("/list", protect(["admin"]), listExams);



export default router;


