// controllers/compilerExamController.js
import CompilerExam from '../models/CompilerExam.js';
import CompilerQuestion from '../models/CompilerQuestion.js';
import Student from '../models/Student.js';
import { io } from '../sockets/socketManager.js';
import Exam from '../models/Exam.js';
import crypto from "crypto";
import CompilerAttemptLog from "../models/CompilerAttemptLog.js";

import StudentCodeSubmission from '../models/StudentCodeSubmission.js';
import { submitToJudge0 } from '../services/judge0Service.js';
import ExamSession from '../models/ExamSession.js';


import CompilerExamAttempt from "../models/CompilerExamAttempt.js";

const EXEC_TIMEOUT_MS = 120000; // 2 minutes

export const runCode = async (req, res) => {
  try {
    const { sourceCode, language, customInput = "" } = req.body;

    if (!sourceCode?.trim()) {
      return res.status(400).json({ message: "Source code is required" });
    }

    const languageId = mapLanguageToId(language);
    const resultPromise = submitToJudge0({ sourceCode, languageId, stdin: customInput });

    const result = await Promise.race([
      resultPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Execution timed out after 2 minutes")), EXEC_TIMEOUT_MS)
      )
    ]);

    const combinedOutput = [result.compile_output, result.stdout, result.stderr]
      .filter(Boolean)
      .join("\n");

    return res.status(200).json({
      output: combinedOutput,
      success: !result.stderr && !result.compile_output,
      time: result.time,
    });
  } catch (err) {
    console.error("Run code error:", err);
    return res.status(500).json({ message: err.message || "Execution failed" });
  }
};


const mapLanguageToId = (lang) => {
  const languageMap = {
    Python: 71,
    JavaScript: 63,
    Java: 62,
    'C++': 54,
    C: 50,
    'C#': 51,
    Go: 60,
    Rust: 73,
    Ruby: 72,
    Kotlin: 78,
    TypeScript: 74,
    SQL: 82
  };
  if (!languageMap[lang]) {
    throw new Error(`Unsupported language: ${lang}`);
  }
  return languageMap[lang] || 71; // default Python
};



// Line: ADD NEW FUNCTION IN CONTROLLER
export const runAllAndEvaluate = async (req, res) => {
  try {
    const {
      
      examId,
      questionId,
      sourceCode,
      language,
      violationDetected = false
    } = req.body;
    const studentId = req.user._id;
    const student = await Student.findById(studentId);
    const question = await CompilerQuestion.findById(questionId);
    if (!student || !question) return res.status(404).json({ message: "Invalid student or question" });

    // const attemptsUsed = await StudentCodeSubmission.countDocuments({ student: studentId, question: questionId });
    const attemptsUsed = await CompilerAttemptLog.countDocuments({ studentId, examId, questionId });


    const maxAttempts = question.attemptLimit || 3;

    if (attemptsUsed >= maxAttempts) {
      return res.status(403).json({ message: "Attempt limit exceeded" });
    }

    const langId = mapLanguageToId(language);
    const testCaseResults = [];
    let passedWeight = 0;
    let passedCount = 0;
    let rawOutput = "";

    for (let i = 0; i < question.testCases.length; i++) {
      const tc = question.testCases[i];
      const { stdout, stderr, compile_output } = await submitToJudge0({
        sourceCode,
        languageId: langId,
        stdin: tc.inputs.join("\n"),
      });

      const out = [compile_output, stdout, stderr].filter(Boolean).join("\n");
      const passed = stdout?.trim() === tc.expectedOutput?.trim();


      if (passed) passedWeight += Number(tc.weight) || 1;
      if (passed) passedCount++;

      rawOutput += `Test Case ${i + 1} (${passed ? "✓" : "✗"}): ${stdout?.trim() || out.trim()}\n`;


      testCaseResults.push({
        inputs: tc.inputs,
        expectedOutput: tc.expectedOutput,
        actualOutput: stdout?.trim() || "",
        passed,
      });

    }

    // Normalize weights
    const weights = question.testCases.map(tc => Number(tc.weight) || 0);
    let totalWeight = weights.reduce((a, b) => a + b, 0);

    // If no weights defined, distribute equally
    if (totalWeight === 0) {
      totalWeight = question.testCases.length;
      passedWeight = passedCount;
    }

    // Ensure marks exists
    const maxMarks = Number(question.marks) || 0;

    // Prevent NaN
    const percent = totalWeight > 0 ? (passedWeight / totalWeight) * 100 : 0;
    const score = Math.round((percent / 100) * maxMarks);


    // const isLastAttempt = attemptsUsed + 1 >= maxAttempts;

    // const shouldAutoSubmit =
    //   isLastAttempt || (question.evaluationMode === "strict" && percent === 100)


      // (question.strict && percent === 100)
      //  || 
      // (!question.strict && percent >= 60);
    // const isLastAttempt = attemptsUsed === maxAttempts;
    const isLastAttempt = attemptsUsed + 1 === maxAttempts;

    const isStrict = question.evaluationMode === "strict";

    const shouldAutoSubmit = (isStrict && percent === 100) || (!isStrict && percent >= 60) || isLastAttempt;



    const existing = await StudentCodeSubmission.findOne({ studentId, examId, questionId });

    if (existing && existing.autoSubmitted === false) {
      return res.json({
        testCasesResult: testCaseResults,
        passedCount,
        totalCases: question.testCases.length,
        mark: existing.score,
        percent,
        autoSubmit: true,
        // violation: false,
        rawOutput,
      });
    }

    await CompilerAttemptLog.create({
      studentId,
      examId,
      questionId,
      attemptNo: attemptsUsed + 1
    });


    const submission = {
      studentId,
      examId,
      questionId,
      language,
      code: sourceCode,
      results: testCaseResults.map(tc => ({
        inputs: tc.inputs,
        expectedOutput: tc.expectedOutput,
        actualOutput: tc.actualOutput || "",
        passed: tc.passed,
      })),
      score,
      status: percent === 100 ? "passed" : percent >= 60 ? "partial" : "failed",
      attempts: attemptsUsed + 1,
      autoSubmitted: shouldAutoSubmit,
      violationDetected,
    };

    if (!Number.isFinite(score)) {
      console.error("Invalid score computed:", { passedWeight, totalWeight, maxMarks });
      return res.status(500).json({ message: "Internal scoring error" });
    }

    if (shouldAutoSubmit) {
      await StudentCodeSubmission.findOneAndUpdate(
        { studentId, examId, questionId },
        { $set: submission },
        { upsert: true, new: true }
      );


    }



    return res.json({
      testCasesResult: testCaseResults,
      passedCount,
      totalCases: question.testCases.length,
      mark: score,
      percent,
      autoSubmit: shouldAutoSubmit,
      isLastAttempt,
      violation: violationDetected,
      rawOutput,
    });

  } catch (err) {
    console.error("Run All Error:", err);
    res.status(500).json({ message: "Server error during test execution" });
  }
};

export const manualSubmit = async (req, res) => {
  try {
    const { examId, questionId, code, results } = req.body;
    const studentId = req.user._id;
    const existing = await StudentCodeSubmission.findOne({ studentId, examId, questionId });
    if (existing) return res.status(409).json({ message: "Already submitted" });

    if (!results || Object.keys(results).length === 0) {
      return res.status(400).json({ message: "Run evaluation first" });
    }

    const question = await CompilerQuestion.findById(questionId);
    if (!question) return res.status(404).json({ message: "Question not found" });
    const attemptsUsed = await CompilerAttemptLog.countDocuments({ studentId, examId, questionId });

    let passedWeight = 0;
    let totalWeight = 0;

    question.testCases.forEach((tc, i) => {
      const w = Number(tc.weight) || 1;
      totalWeight += w;
      if (results[i]?.status === "passed") passedWeight += w;
    });

    const percent = totalWeight > 0 ? (passedWeight / totalWeight) * 100 : 0;
    const score = Math.round((percent / 100) * question.marks);

    const submission = await StudentCodeSubmission.create({
      studentId,
      examId,
      questionId,
      code,
      results: Object.values(results),
      score,
      attempts: attemptsUsed,
      status: percent === 100 ? "passed" : percent >= 60 ? "partial" : "failed",
      autoSubmitted: false,
    });

    res.json({ message: "Submission saved", submission });

  } catch (err) {
    console.error("Manual submit error:", err);
    res.status(500).json({ message: "Failed to submit" });
  }
};


export const endCompilerExam = async (req, res) => {
  try {
    const { examId, reason = "manual",violations = {} } = req.body;
    if (typeof reason !== "string") reason = "manual";
    const studentId = req.user._id;

    const exam = await CompilerExam.findById(examId).populate("questions");
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const submissions = await StudentCodeSubmission.find({ studentId, examId });

    


    // ❗ Manual requires all submitted
    if (reason === "manual" && submissions.length !== exam.questions.length) {
      return res.status(400).json({ message: "All questions not completed" });
    }

    

    // ⚠ TIME / VIOLATION → auto fail missing
    if (reason === "time" || reason === "violation") {
      const submittedIds = new Set(submissions.map(s => s.questionId.toString()));

      const missing = exam.questions.filter(q => !submittedIds.has(q._id.toString()));

      for (const q of missing) {
        await StudentCodeSubmission.create({
          studentId,
          examId,
          questionId: q._id,
          code: "",
          results: [],
          score: 0,
          status: "failed",
          autoSubmitted: true,
          reason
        });
      }
    }

    const finalSubs = await StudentCodeSubmission.find({ studentId, examId });

    const maxScore = exam.questions.reduce((a, q) => a + (q.marks || 0), 0);
    const totalScore = finalSubs.reduce((a, s) => a + (s.score || 0), 0);
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const pass = percentage >= 40;

    const stats = {
      totalQuestions: exam.questions.length,
      attempted: finalSubs.length,
      passed: finalSubs.filter(s => s.status === "passed").length,
      partial: finalSubs.filter(s => s.status === "partial").length,
      failed: finalSubs.filter(s => s.status === "failed").length,
    };

    const certificateEnabled = exam.generateCertificate === true;
    let certificateId = null;
    // if (certificateEnabled && pass) certificateId = `CERT:CMP-${crypto.randomUUID()}`;
     if (certificateEnabled && pass){
      const shortSession = session._id.toString().slice(-6).toUpperCase();
      const random = Math.random().toString(36).slice(-4).toUpperCase();
      certificateId = `CERT:CMP-${shortSession}-${random}`;
    }

    if (reason === "time") reason = "timeout";

    const attempt = await CompilerExamAttempt.findOneAndUpdate(
      { student: studentId, exam: examId },
      {
        student: studentId,
        exam: examId,
        submissions: finalSubs.map(s => s._id),
        totalScore,
        maxScore,
        percentage,
        pass,
        reason,
        submittedAt: new Date(),
        certificateEligible: certificateEnabled && pass,
        certificateId,
        stats,
        violationDetails: {
          tabSwitchCount: violations.tabSwitchCount || 0,
          fullscreenExitCount: violations.fullscreenExitCount || 0,
          devToolCount: violations.devToolCount || 0,
          shortcutCount: violations.shortcutCount || 0,
          violationReason: violations.violationReason || null,
        },
      },
      { upsert: true, new: true }
    );

    // await Student.findByIdAndUpdate(studentId, {
    //   $push: { scores: { examId, score: totalScore, percentage, date: new Date() } },
    // });
    await Student.findOneAndUpdate(
      { _id: studentId, "scores.examId": { $ne: examId } },
      {
        $push: {
          scores: {
            examId,
            score: totalScore,
            percentage,
            date: new Date()
          }
        }
      }
    );


    await ExamSession.updateOne(
      { student: studentId, exam: examId, active: true },
      { $set: { active: false } }
    );

    // 🧹 cleanup logs
    await CompilerAttemptLog.deleteMany({ studentId, examId });

    return res.json({ message: "Exam ended", attempt });

  } catch (err) {
    console.error("End Compiler Exam Error:", err);
    res.status(500).json({ message: "Failed to end exam" });
  }
};






export const getCompilerExamStatus = async (req, res) => {
  const { examId } = req.params;
  const studentId = req.user._id;

  const submissions = await StudentCodeSubmission.find({ studentId, examId });

  return res.json({
    completedQuestionIds: submissions.map(s => s.questionId.toString()),
  });
};







export const getCompilerExamById = async (req, res) => {
  try {
    const examId = req.params.examId;


    const exam = await CompilerExam.findById(examId)
      .populate({
      path: 'questions',
      select: '-__v',
    })
    .select("-createdBy -__v");


    if (!exam) {
     return res.status(404).json({ message: "Exam not found" });
    }


    // Return questions sorted by _id or creation order
    exam.questions.sort((a, b) => a.createdAt - b.createdAt);


    return res.json({ exam });
  } catch (err) {
        console.error("Error fetching compiler exam by ID:", err);
        return res.status(500).json({ message: "Failed to load exam" });
    }
}


export const getCompilerExamResult = async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.user._id;

    const attempt = await CompilerExamAttempt.findOne({ student: studentId, exam: examId })
      .populate("exam")
      .populate({
        path: "submissions",
        populate: { path: "questionId" }
      });

    if (!attempt) {
      return res.status(404).json({ message: "Result not found" });
    }


    const student = await Student.findById(studentId);

    const submissions = attempt.submissions.map(s => ({
      questionId: s.questionId._id,
      title: s.questionId.title,
      shortDescription: s.questionId.shortDescription,
      longDescription: s.questionId.longDescription,
      language: s.language || attempt.exam.language || "unknown",
      code: s.code || null,
      results: s.results || null,
      score: s.score,
      maxScore: s.questionId.marks,
      status: s.status,
      attempts: s.attempts,
      autoSubmitted: s.autoSubmitted,
      violationDetected: s.violationDetected,
      submittedAt: s.submittedAt,
      isDeleted: !s.code || !s.results,
    }));

    const session = await ExamSession.findOne({
      student: studentId,
      exam: examId
    }).sort({ startTime: 1 }); // earliest session


    return res.json({
      student: {
        id: student._id,
        name: student.name,
        rollNumber: student.rollNumber,
        email: student.email,
        department: student.department,
        year: student.year,
        collegeName: student.collegeName,
        profileImage: student.profileImage,
      },
      exam: {
        id: attempt.exam._id,
        title: attempt.exam.title,
        language: attempt.exam.language,
        duration: attempt.exam.duration,
        totalMarks: attempt.maxScore,
        questionCount: attempt.exam.questionCount,
        perQuestionMark: attempt.exam.perQuestionMark,
        generateCertificate: attempt.exam.generateCertificate,
        startTime: attempt.startedAt,
        endTime: attempt.submittedAt,
      },
      totalScore: attempt.totalScore,
      maxScore: attempt.maxScore,
      percentage: attempt.percentage,
      pass: attempt.pass,
      reason: attempt.reason,
      violationDetails: attempt.violationDetails || null,
      startedAt: session?.startTime || attempt.submittedAt,
      submittedAt: attempt.submittedAt,
      stats: attempt.stats,
      certificateEligible: attempt.certificateEligible,
      certificateId: attempt.certificateId,
      submissions,
      reviewCompleted: false,
    });

  } catch (err) {
    console.error("Result fetch error:", err);
    res.status(500).json({ message: "Failed to load result" });
  }
};



export const getStudentCompilerReportCard = async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.user._id;

    // 1. Get attempt
    const attempt = await CompilerExamAttempt.findOne({
      student: studentId,
      exam: examId,
    }).populate("exam");

    if (!attempt) {
      return res.status(404).json({ message: "Report not found" });
    }

    // 2. Get student
    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // 3. Build response EXACTLY as frontend expects
    return res.json({
      reportId: `COMP-RPT-${attempt._id.toString().slice(-6).toUpperCase()}`,

      student: {
        name: student.name,
        id: student.rollNumber,
        rollNumber: student.rollNumber,
        department: student.department,
        year: student.year,
        collegeName: student.collegeName,
        examDate: attempt.submittedAt
          ? attempt.submittedAt.toISOString().split("T")[0]
          : "",
        photoUrl: student.profileImage || "",
      },

      exam: {
        examName: attempt.exam.title,
        language: attempt.exam.language,
        duration: attempt.exam.duration,
        totalQuestions: attempt.stats.totalQuestions,
        attempted: attempt.stats.attempted,
        passed: attempt.stats.passed,
        partial: attempt.stats.partial,
        failed: attempt.stats.failed,
        totalMarks: attempt.totalScore,
        maxMarks: attempt.maxScore,
      },

      proctoring: {
        cheatingCount: attempt.reason === "violation" ? 1 : 0,
        cheatingReason:
          attempt.reason === "violation"
            ? "Violation detected during exam"
            : "None",
        violationDetails: attempt.violationDetails || null,
      },

      certificateEligible: attempt.certificateEligible,
      certificateId: attempt.certificateId || null,
    });
  } catch (err) {
    console.error("Compiler report error:", err);
    res.status(500).json({ message: "Failed to load report" });
  }
};







