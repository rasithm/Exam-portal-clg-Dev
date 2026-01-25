import express from "express";
import { protect } from "../middlewares/auth.js";
import { getAllExamReportsSummary,exportFullExamExcel , getAdminStudentReport, getAdminStudentReportData,exportSingleStudentExcel} from "../controllers/adminReportController.js";

const router = express.Router();

router.get("/summary", protect(["admin"]), getAllExamReportsSummary);

router.get("/:examId/export.xlsx", protect(["admin"]), exportFullExamExcel);
router.get("/:examId/student/:studentId/report", protect(["admin"]), getAdminStudentReport);
router.get("/:examId/student/:studentId/export.xlsx", protect(["admin"]), exportSingleStudentExcel);
router.get(
  "/:examId/student/:studentId/report-data",
  protect(["admin"]),
  getAdminStudentReportData
);

export default router;
