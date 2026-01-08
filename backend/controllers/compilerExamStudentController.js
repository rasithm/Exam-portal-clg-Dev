// controllers/compilerExamController.js
import CompilerExam from '../models/CompilerExam.js';
import CompilerQuestion from '../models/CompilerQuestion.js';
import Student from '../models/Student.js';
import { io } from '../sockets/socketManager.js';
import Exam from '../models/Exam.js';

import StudentCodeSubmission from '../models/StudentCodeSubmission.js';
import { submitToJudge0 } from '../services/judge0Service.js';

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

    const attemptsUsed = await StudentCodeSubmission.countDocuments({ student: studentId, question: questionId });
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


    const shouldAutoSubmit =
      (question.strict && percent === 100) || (!question.strict && percent >= 60);

    const existing = await StudentCodeSubmission.findOne({ studentId, examId, questionId });

    if (existing && existing.autoSubmitted === false) {
      return res.json({
        testCasesResult: testCaseResults,
        passedCount,
        totalCases: question.testCases.length,
        mark: existing.score,
        percent,
        autoSubmit: true,
        violation: false,
        rawOutput,
      });
    }



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

    if (shouldAutoSubmit || violationDetected) {
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
      violation: violationDetected,
      rawOutput,
    });

  } catch (err) {
    console.error("Run All Error:", err);
    res.status(500).json({ message: "Server error during test execution" });
  }
};

// Line: ADD BELOW runAllTestCases
export const manualSubmit = async (req, res) => {
  try {
    const { examId, questionId } = req.body;
    const studentId = req.user._id;

    const existing = await StudentCodeSubmission.findOne({ studentId,examId, questionId ,autoSubmitted: false });
    if (existing) return res.status(409).json({ message: "Already submitted" });

    const lastEval = await StudentCodeSubmission.findOne({ studentId, examId, questionId });

    if (!lastEval) return res.status(400).json({ message: "Run evaluation first" });
    // if (lastEval.autoSubmitted) return res.status(409).json({ message: "Already submitted" });
    if (lastEval.autoSubmitted === false) return res.status(409).json({ message: "Already submitted" });



    if (!lastEval) return res.status(400).json({ message: "Run evaluation first" });

    lastEval.autoSubmitted = false;
    await lastEval.save();
    await Student.findByIdAndUpdate(studentId, {
      $push: {
        scores: {
          examId,
          score: submission.score,
          percentage: submission.score > 0 ? (submission.score / (submission.score || 1)) * 100 : 0, // safe fallback
          date: new Date(),
        },
      },
    });


    res.status(200).json({ message: "Submission confirmed", submission: lastEval });
  } catch (err) {
    console.error("Submit Error:", err);
    res.status(500).json({ message: "Failed to submit" });
  }
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

