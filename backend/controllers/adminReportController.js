import Exam from "../models/Exam.js";
import CompilerExam from "../models/CompilerExam.js";
import ExamAttempt from "../models/ExamAttempt.js";
import CompilerExamAttempt from "../models/CompilerExamAttempt.js";
import ExcelJS from "exceljs";
import ExamSession from "../models/ExamSession.js";

/* ======================================================
   🔵 1. GET ALL EXAMS SUMMARY (for dashboard list)
   GET /api/admin/reports/summary
====================================================== */
export const getAllExamReportsSummary = async (req, res) => {
  try {
    const adminId = req.user._id;

    const mcqExams = await Exam.find({ createdBy: adminId });
    const compilerExams = await CompilerExam.find({ createdBy: adminId });

    const result = [];

    /* ---------- MCQ ---------- */
    for (const exam of mcqExams) {
      const sessions = await ExamSession.find({ exam: exam._id });
      const sessionIds = sessions.map(s => s._id);

      const attempts = await ExamAttempt.find({
        examSessionId: { $in: sessionIds }
      });


      if (!attempts.length) continue;

      const totalStudents = attempts.length;
      const avgPercentage =
        attempts.reduce((s, a) => s + (a.percentage || 0), 0) / totalStudents;

      const passCount = attempts.filter((a) => a.pass).length;

      result.push({
        examId: exam._id,
        examName: exam.examName,
        examType: "MCQ",
        totalStudents,
        avgPercentage: Number(avgPercentage.toFixed(2)),
        passRate: Number(((passCount / totalStudents) * 100).toFixed(2)),
        completedDate: exam.endDateTime,
      });
    }

    /* ---------- COMPILER ---------- */
    for (const exam of compilerExams) {
      const attempts = await CompilerExamAttempt.find({ exam: exam._id });

      if (!attempts.length) continue;

      const totalStudents = attempts.length;
      const avgPercentage =
        attempts.reduce((s, a) => s + (a.percentage || 0), 0) / totalStudents;

      const passCount = attempts.filter((a) => a.pass).length;

      result.push({
        examId: exam._id,
        examName: exam.title,
        examType: "Compiler",
        totalStudents,
        avgPercentage: Number(avgPercentage.toFixed(2)),
        passRate: Number(((passCount / totalStudents) * 100).toFixed(2)),
        completedDate: exam.endTime,
      });
    }
    result.sort((a,b)=> new Date(b.completedDate) - new Date(a.completedDate));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Summary fetch failed" });
  }
};

/* =========================================================
   UNIVERSAL ADMIN EXPORT
   GET /api/admin/reports/:examId/export.xlsx
========================================================= */
export const exportFullExamExcel = async (req, res) => {
  try {
    const { examId } = req.params;

    const mcqExam = await Exam.findById(examId);
    const compilerExam = await CompilerExam.findById(examId);

    if (!mcqExam && !compilerExam)
      return res.status(404).json({ message: "Exam not found" });

    const workbook = new ExcelJS.Workbook();

    /* ======================================================
       SHEET 1 — STUDENT SUMMARY
    ====================================================== */
    const summarySheet = workbook.addWorksheet("Student Summary");

    summarySheet.columns = [
      { header: "ReportId", key: "reportId", width: 20 },
      { header: "ExamId", key: "examId", width: 22 },
      { header: "ExamName", key: "examName", width: 25 },
      { header: "ExamType", key: "examType", width: 12 },

      { header: "StudentName", key: "name", width: 20 },
      { header: "RollNumber", key: "roll", width: 15 },
      { header: "Email", key: "email", width: 25 },
      { header: "Department", key: "dept", width: 18 },
      { header: "Year", key: "year", width: 8 },

      { header: "TotalQuestions", key: "totalQ" },
      { header: "Attempted", key: "attempted" },
      { header: "Correct", key: "correct" },
      { header: "Wrong", key: "wrong" },

      { header: "Score", key: "score" },
      { header: "MaxMarks", key: "max" },
      { header: "Percentage", key: "percent" },
      { header: "Pass", key: "pass" },

      { header: "TimeTakenSeconds", key: "time" },
      { header: "CertificateId", key: "cert" },
    ];

    const difficultySheet = workbook.addWorksheet("Difficulty Analysis");
    difficultySheet.columns = [
      { header: "Student", key: "name", width: 20 },
      { header: "Easy Correct", key: "easy" },
      { header: "Medium Correct", key: "medium" },
      { header: "Hard Correct", key: "hard" },
    ];

    const compilerSheet = workbook.addWorksheet("Compiler Details");
    compilerSheet.columns = [
      { header: "Student", key: "student", width: 20 },
      { header: "QuestionId", key: "qid", width: 22 },
      { header: "Testcases Passed", key: "passed" },
      { header: "Total Testcases", key: "total" },
      { header: "Score", key: "score" },
    ];

    let rows = [];

    /* ======================================================
       MCQ EXPORT
    ====================================================== */
    if (mcqExam) {
      const sessions = await ExamSession.find({ exam: examId });
      const sessionIds = sessions.map((s) => s._id);

      const attempts = await ExamAttempt.find({
        examSessionId: { $in: sessionIds },
      }).populate("student");

      for (const a of attempts) {
        const st = a.student;

        rows.push(a);

        summarySheet.addRow({
          reportId: `MCQ-${a._id.toString().slice(-6)}`,
          examId,
          examName: mcqExam.examName,
          examType: "MCQ",

          name: st?.name,
          roll: st?.rollNumber,
          email: st?.email,
          dept: st?.department,
          year: st?.year,

          totalQ: a.stats?.totalQuestions,
          attempted: a.stats?.attempted,
          correct: a.stats?.correct,
          wrong: a.stats?.wrong,

          score: a.totalMarks,
          max: a.maxMarks,
          percent: a.percentage?.toFixed(2),
          pass: a.pass ? "Yes" : "No",
          time: a.timeTakenSeconds,
          cert: a.certificateId || "",
        });

        difficultySheet.addRow({
          name: st?.name,
          easy: a.stats?.easyCorrect,
          medium: a.stats?.mediumCorrect,
          hard: a.stats?.hardCorrect,
        });
      }
    }

    /* ======================================================
       COMPILER EXPORT
    ====================================================== */
    if (compilerExam) {
      const attempts = await CompilerExamAttempt.find({ exam: examId })
        .populate("student submissions");

      for (const a of attempts) {
        const st = a.student;

        rows.push(a);

        summarySheet.addRow({
          reportId: `CMP-${a._id.toString().slice(-6)}`,
          examId,
          examName: compilerExam.title,
          examType: "Compiler",

          name: st?.name,
          roll: st?.rollNumber,
          email: st?.email,
          dept: st?.department,
          year: st?.year,

          totalQ: a.stats?.totalQuestions,
          attempted: a.stats?.attempted,
          correct: a.stats?.passed,
          wrong: a.stats?.failed,

          score: a.totalScore,
          max: a.maxScore,
          percent: a.percentage?.toFixed(2),
          pass: a.pass ? "Yes" : "No",
          time: 0,
          cert: a.certificateId || "",
        });

        for (const sub of a.submissions) {
          compilerSheet.addRow({
            student: st?.name,
            qid: sub.questionId,
            passed: sub.results?.filter(r => r.passed).length,
            total: sub.results?.length,
            score: sub.score,
          });
        }
      }
    }

    /* ======================================================
       SHEET — EXAM SUMMARY
    ====================================================== */
    const statsSheet = workbook.addWorksheet("Exam Summary");

    const total = rows.length;
    const passed = rows.filter((r) => r.pass).length;

    statsSheet.addRow(["Total Students", total]);
    statsSheet.addRow(["Pass Count", passed]);
    statsSheet.addRow(["Pass Rate %", ((passed / total) * 100).toFixed(2)]);

    /* ======================================================
       SEND
    ====================================================== */
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=exam_${examId}_report.xlsx`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Export failed" });
  }
};

import Student from "../models/Student.js";

/* =========================================================
   ADMIN → SINGLE STUDENT REPORT (MCQ or COMPILER)
   GET /api/admin/reports/:examId/student/:studentId/report
========================================================= */
export const getAdminStudentReport = async (req, res) => {
  try {
    const { examId, studentId } = req.params;

    const mcqExam = await Exam.findById(examId);
    const compilerExam = await CompilerExam.findById(examId);

    if (!mcqExam && !compilerExam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    /* =========================
       MCQ REPORT
    ========================= */
    if (mcqExam) {
      return res.json({
        type: "MCQ",
        redirectUrl: `/student/exam/report/${examId}?adminPreview=true&studentId=${studentId}`,
      });
    }

    /* =========================
       COMPILER REPORT
    ========================= */
    if (compilerExam) {
      return res.json({
        type: "COMPILER",
        redirectUrl: `/student/exam/compiler/${examId}/report?adminPreview=true&studentId=${studentId}`,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Report load failed" });
  }
};

export const exportSingleStudentExcel = async (req, res) => {
  const { examId, studentId } = req.params;

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Student Report");

  sheet.columns = [
    { header: "Name", key: "name" },
    { header: "Roll", key: "roll" },
    { header: "Score", key: "score" },
    { header: "Percentage", key: "percent" },
    { header: "Pass", key: "pass" },
  ];

  const session = await ExamSession.findOne({ exam: examId, student: studentId });

  const attempt = await ExamAttempt.findOne({ examSessionId: session._id }).populate("student");

  sheet.addRow({
    name: attempt.student.name,
    roll: attempt.student.rollNumber,
    score: attempt.totalMarks,
    percent: attempt.percentage,
    pass: attempt.pass ? "Yes" : "No",
  });

  res.setHeader("Content-Disposition", "attachment; filename=student.xlsx");
  await workbook.xlsx.write(res);
  res.end();
};

export const getAdminStudentReportData = async (req, res) => {
  try {
    const { examId, studentId } = req.params;

    const mcqExam = await Exam.findById(examId);
    const compilerExam = await CompilerExam.findById(examId);

    const student = await Student.findById(studentId).select(
      "name rollNumber department year profileImage collegeName"
    );

    if (!student)
      return res.status(404).json({ message: "Student not found" });

    /* ===================================================
       MCQ FORMAT  (MATCH EXACT student API SHAPE)
    =================================================== */
    if (mcqExam) {
      const session = await ExamSession.findOne({
        exam: examId,
        student: studentId,
      });

      const attempt = await ExamAttempt.findOne({
        examSessionId: session?._id,
      });

      if (!attempt)
        return res.status(404).json({ message: "Report not available" });

      const stats = attempt.stats || {};

      return res.json({
        reportId: `RPT-${attempt._id.toString().slice(-6).toUpperCase()}`,

        student: {
          name: student.name,
          id: student.rollNumber,
          batch: `${student.department} - Year ${student.year}`,
          examDate: session.startTime.toLocaleDateString("en-IN"),
          photoUrl: student.profileImage || "",
        },

        exam: {
          examName: mcqExam.examName,
          totalQs: stats.totalQuestions,
          correct: stats.correct,
          wrong: stats.wrong,
          totalMarks: attempt.totalMarks,
          maxMarks: attempt.maxMarks,
        },

        proctoring: {
          cheatingCount: session.violations || 0,
          cheatingReason:
            attempt.reason === "violation"
              ? "Proctoring violation detected"
              : "None",
        },
      });
    }

    /* ===================================================
       COMPILER FORMAT (MATCH compiler student API)
    =================================================== */
    if (compilerExam) {
      const attempt = await CompilerExamAttempt.findOne({
        exam: examId,
        student: studentId,
      });

      if (!attempt)
        return res.status(404).json({ message: "Report not available" });

      return res.json({
        reportId: `COMP-RPT-${attempt._id.toString().slice(-6).toUpperCase()}`,

        student: {
          name: student.name,
          id: student.rollNumber,
          batch: `${student.department} - Year ${student.year}`,
          examDate: attempt.submittedAt
            ?.toISOString()
            .split("T")[0],
          photoUrl: student.profileImage || "",
        },

        exam: {
          examName: compilerExam.title,
          totalQs: attempt.stats?.totalQuestions,
          correct: attempt.stats?.passed,
          wrong: attempt.stats?.failed,
          totalMarks: attempt.totalScore,
          maxMarks: attempt.maxScore,
        },

        proctoring: {
          cheatingCount:
            attempt.reason === "violation" ? 1 : 0,
          cheatingReason:
            attempt.reason === "violation"
              ? "Violation detected"
              : "None",
        },
      });
    }

    return res.status(404).json({ message: "Exam not found" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load report" });
  }
};





