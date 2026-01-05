// controllers/compilerExamController.js
import CompilerExam from '../models/CompilerExam.js';
import CompilerQuestion from '../models/CompilerQuestion.js';
import Student from '../models/Student.js';
import { io } from '../sockets/socketManager.js';
import Exam from '../models/Exam.js';

import StudentCodeSubmission from '../models/StudentCodeSubmission.js';
import { submitToJudge0 } from '../services/judge0Service.js';

const EXEC_TIMEOUT_MS = 120000; // 2 minutes

export const runCodeWithCustomInput = async (req, res) => {
  try {
    const { sourceCode, language, customInput = '' } = req.body;

    if (!sourceCode?.trim()) {
      return res.status(400).json({ message: 'Source code is required' });
    }

    const languageId = mapLanguageToId(language);
    const resultPromise = submitToJudge0({ sourceCode, languageId, stdin: customInput });

    const result = await Promise.race([
      resultPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Execution timed out')), EXEC_TIMEOUT_MS)
      )
    ]);

    if (result.stderr || result.compile_output) {
      return res.status(200).json({
        output: result.stderr || result.compile_output,
        success: false
      });
    }

    return res.status(200).json({
      output: result.stdout || '',
      success: true
    });
  } catch (err) {
    console.error('Run code error:', err);
    return res.status(500).json({ message: err.message || 'Execution failed' });
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


export const evaluateCodeSubmission = async (req, res) => {
  try {
    const { examId, questionId } = req.params;
    const { code, language, studentInput } = req.body;
    const studentId = req.user._id;

    const question = await CompilerQuestion.findById(questionId);
    if (!question) return res.status(404).json({ message: "Question not found" });

    // Use language map or Judge0 language IDs
    const languageId = getJudge0LanguageId(language);
    const results = [];

    for (let tc of question.testCases) {
      const input = (tc.inputs || []).join('\n');

      const judgeRes = await submitToJudge0({
        sourceCode: code,
        languageId,
        stdin: input,
      });

      const passed = judgeRes.stdout?.trim() === tc.expectedOutput?.trim();
      results.push({
        inputs: tc.inputs,
        expectedOutput: tc.expectedOutput,
        actualOutput: judgeRes.stdout,
        passed,
      });
    }

    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    const mode = question.evaluationMode || 'strict';

    let status = 'failed';
    if (mode === 'strict') {
      status = passedCount === totalCount ? 'passed' : 'failed';
    } else {
      status = (passedCount / totalCount) >= 0.6 ? 'passed' : 'failed';
    }

    await StudentCodeSubmission.findOneAndUpdate(
      { studentId, examId, questionId },
      {
        studentId,
        examId,
        questionId,
        code,
        language,
        results,
        status,
        score: status === 'passed' ? question.marks : 0,
      },
      { upsert: true }
    );

    return res.json({ message: "Code submitted", status, results });
  } catch (err) {
    console.error("Judge0 submit error", err);
    return res.status(500).json({ message: "Execution failed" });
  }
};

const getJudge0LanguageId = (lang) => {
  const map = {
    Python: 71,
    JavaScript: 63,
    Java: 62,
    'C++': 54,
    C: 50,
  };
  return map[lang] || 71;
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

