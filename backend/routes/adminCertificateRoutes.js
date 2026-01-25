import express from "express";
import archiver from "archiver";
import { protect } from "../middlewares/auth.js";
import ExamAttempt from "../models/ExamAttempt.js";
import CompilerExamAttempt from "../models/CompilerExamAttempt.js";
import Exam from "../models/Exam.js";
import CompilerExam from "../models/CompilerExam.js";

const router = express.Router();

/* =================================================
   SUMMARY DATA FOR DASHBOARD
================================================= */
router.get("/summary", protect(["admin"]), async (req, res) => {
  try {

    /* ===============================
       ONLY CERTIFICATE ENABLED EXAMS
    =============================== */

    const mcqExams = await Exam.find({ generateCertificate: true }).lean();
    const compilerExams = await CompilerExam.find({ generateCertificate: true }).lean();

    const map = {};

    const initExam = (id, name, type, completedDate) => {
      map[id] = {
        examId: id.toString(),
        examName: name,
        examType: type,
        count: 0,
        lastDate: null,
        completedDate
      };
    };

    mcqExams.forEach(e =>
      initExam(e._id, e.examName, "MCQ", e.endDateTime)
    );

    compilerExams.forEach(e =>
      initExam(e._id, e.title, "Compiler", e.endTime)
    );

    /* ===============================
       COUNT REAL CERTIFICATES
    =============================== */

    const mcqAttempts = await ExamAttempt.find({
      certificateId: { $exists: true }
    })
      .populate({
        path: "examSessionId",
        populate: { path: "exam" }
      })
      .lean();

    mcqAttempts.forEach(a => {
      const id = a.examSessionId?.exam?._id?.toString();
      if (!map[id]) return;

      map[id].count++;

      if (
        !map[id].lastDate ||
        new Date(a.submittedAt) > new Date(map[id].lastDate)
      ) {
        map[id].lastDate = a.submittedAt;
      }
    });

    const compilerAttempts = await CompilerExamAttempt.find({
      certificateId: { $exists: true }
    })
      .populate("exam")
      .lean();

    compilerAttempts.forEach(a => {
      const id = a.exam?._id?.toString();
      if (!map[id]) return;

      map[id].count++;

      if (
        !map[id].lastDate ||
        new Date(a.submittedAt) > new Date(map[id].lastDate)
      ) {
        map[id].lastDate = a.submittedAt;
      }
    });

    /* ===============================
       SORT BY LAST ISSUE DATE DESC
    =============================== */

    const exams = Object.values(map)
      .sort((a, b) =>
        new Date(b.lastDate || 0) - new Date(a.lastDate || 0)
      );

    res.json({
      total: exams.reduce((s, e) => s + e.count, 0),
      mcq: exams.filter(e => e.examType === "MCQ").reduce((s, e) => s + e.count, 0),
      compiler: exams.filter(e => e.examType === "Compiler").reduce((s, e) => s + e.count, 0),
      exams
    });

  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});


/* =================================================
   DOWNLOAD ZIP
================================================= */
router.get("/:examId/zip", protect(["admin"]), async (req, res) => {
  const { examId } = req.params;

  const baseUrl = process.env.BASE_URL || `http://localhost:5000`;

  // const mcq = await ExamAttempt.find({ certificateEligible: true, certificateId: { $exists: true } });
  // const compiler = await CompilerExamAttempt.find({ certificateEligible: true, certificateId: { $exists: true } });

  // const all = [...mcq, ...compiler].filter(a => a.exam?.toString() === examId || a.examSessionId?.exam?.toString() === examId);
  /* ================= FETCH CORRECTLY ================= */

// MCQ
const mcq = await ExamAttempt.find({
  certificateId: { $exists: true },
})
  .populate({
    path: "examSessionId",
    populate: { path: "exam" },
  })
  .lean();

// Compiler
const compiler = await CompilerExamAttempt.find({
  certificateId: { $exists: true },
})
  .populate("exam")
  .lean();

/* ================= FILTER ================= */

const mcqFiltered = mcq.filter(
  (a) => a.examSessionId?.exam?._id?.toString() === examId
);

const compilerFiltered = compiler.filter(
  (a) => a.exam?._id?.toString() === examId
);

const all = [...mcqFiltered, ...compilerFiltered];

  res.attachment("certificates.zip");
  const archive = archiver("zip");
  archive.pipe(res);

  for (const a of all) {
    const r = await fetch(`${baseUrl}/api/public/certificate/${a.certificateId}/pdf`);
    const buf = Buffer.from(await r.arrayBuffer());
    archive.append(buf, { name: `${a.certificateId}.pdf` });
  }

  await archive.finalize();
});

export default router;
