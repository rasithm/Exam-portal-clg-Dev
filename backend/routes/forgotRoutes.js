import express from "express";
import {
  requestStudentReset,
  verifyOtp,
  completeReset,
  listEmailAssignRequests,
  adminApproveEmailAssign,
} from "../controllers/forgotController.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

// student initiate reset (public; allow unauthenticated)
router.post("/student/request", requestStudentReset);

// verify otp
router.post("/student/verify-otp", verifyOtp);

// complete reset (requires token created after OTP verification)
router.post("/student/complete", completeReset);

// admin: list pending email assign requests (protected admin)
router.get("/admin/pending-email-requests", protect(["admin"]), listEmailAssignRequests);

// admin: approve/reject assignment
router.post("/admin/answer-email-request", protect(["admin"]), adminApproveEmailAssign);

export default router;
