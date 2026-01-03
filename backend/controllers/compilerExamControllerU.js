
// controllers/compilerExamController.js
import CompilerExam from '../models/CompilerExam.js';
import CompilerQuestion from '../models/CompilerQuestion.js';
import Student from '../models/Student.js';
import { io } from '../sockets/socketManager.js';
import Exam from '../models/Exam.js';

const allowedLanguages = [
  'C', 'C++', 'Java', 'Python', 'JavaScript', 'C#', 'Go', 'Ruby', 'Rust', 'Kotlin'
];

export const createExamWithQuestions = async (req, res) => {
  try {
    const {
      title, language, duration, startTime, endTime, description = "",
      questionCount, totalMarks, generateCertificate = false,
      assignedRegNos = [],
      questions = []
    } = req.body;

    if (!title || !language || !duration || !startTime || !endTime || !questionCount || !totalMarks) {
      return res.status(400).json({ message: 'All exam fields are required' });
    }

    if (title.trim().length > 120) {
      return res.status(400).json({ message: 'Title too long (max 120 chars)' });
    }

    if (!allowedLanguages.includes(language)) {
      return res.status(400).json({ message: 'Unsupported language selected' });
    }

    if (duration < 5 || duration > 300) {
      return res.status(400).json({ message: 'Duration must be between 5 and 300 minutes' });
    }

    if (questionCount < 1 || questionCount > 100) {
      return res.status(400).json({ message: 'Invalid question count (1–100)' });
    }

    if (totalMarks < 10 || totalMarks > 1000) {
      return res.status(400).json({ message: 'Total marks must be between 10 and 1000' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid start or end time" });
    }
    if (start < now || end <= start) {
      return res.status(400).json({ message: "Invalid exam timing" });
    }

    const exists = await CompilerExam.findOne({ title: new RegExp(`^${title.trim()}$`, 'i'), createdBy: req.user._id });
    const existsMcq = await Exam.findOne({ examName: new RegExp(`^${title.trim()}$`, 'i'), createdBy: req.user._id });
    if (exists || existsMcq) {
      return res.status(400).json({ message: "Exam title already used" });
    }

    const allStudents = await Student.find({ admin: req.user._id }).select("rollNumber _id");
    const assignedStudentIds = assignedRegNos.length
      ? allStudents.filter(s => assignedRegNos.includes(s.rollNumber)).map(s => s._id)
      : allStudents.map(s => s._id);

    if (questions.length !== questionCount) {
      return res.status(400).json({ message: "Question count mismatch" });
    }

    for (const [index, q] of questions.entries()) {
      if (!q.title?.trim() || !q.shortDescription || !q.longDescription || !q.inputFormat || !q.outputFormat || !q.sampleInput || !q.sampleOutput) {
        return res.status(400).json({ message: `Missing fields in question ${index + 1}` });
      }

      if (!q.attemptLimit || q.attemptLimit < 1) {
        return res.status(400).json({ message: `Attempt limit must be at least 1 for question ${index + 1}` });
      }

      if (!q.memoryLimit || q.memoryLimit < 32 || q.memoryLimit > 1024) {
        return res.status(400).json({ message: `Memory limit must be between 32MB and 1024MB in question ${index + 1}` });
      }

      if (!Array.isArray(q.testCases) || q.testCases.length === 0) {
        return res.status(400).json({ message: `Question ${index + 1} must have test cases` });
      }

      for (const [i, tc] of q.testCases.entries()) {
        if (!Array.isArray(tc.inputs) || tc.inputs.filter(inp => inp?.trim() !== "").length === 0 || !tc.expectedOutput?.trim()) {
          return res.status(400).json({ message: `Invalid test case ${i + 1} in question ${index + 1}` });
        }
      }

      const duplicateTitle = questions.filter((qq, j) => j !== index && qq.title?.trim() === q.title?.trim()).length;
      if (duplicateTitle > 0) {
        return res.status(409).json({ message: `Duplicate question title found: ${q.title}` });
      }
    }

    const perQuestionMark = Math.floor(totalMarks / questionCount);

    const newExam = await CompilerExam.create({
      title: title.trim(),
      language,
      duration,
      startTime,
      endTime,
      description,
      createdBy: req.user._id,
      totalMarks,
      questionCount,
      perQuestionMark,
      generateCertificate,
      assignedStudents: assignedStudentIds,
      published: false,
      status: 'draft'
    });

    const questionDocs = await CompilerQuestion.insertMany(questions.map(q => ({
      ...q,
      exam: newExam._id,
      title: q.title.trim(),
      shortDescription : q.shortDescription,
      longDescription : q.longDescription,
      inputFormat : q.inputFormat,
      outputFormat : q.outputFormat,
      sampleInput : q.sampleInput,
      sampleOutput : q.sampleOutput,
      marks: q.marks || perQuestionMark,
      testCases : q.testCases,
      attemptLimit : q.attemptLimit,
      timeLimit: q.timeLimit || 3000,
      memoryLimit: q.memoryLimit || 128,
      evaluationMode: q.evaluationMode || 'strict',
      matchType: q.matchType || 'exact'
    })));

    newExam.questions = questionDocs.map(q => q._id);
    await newExam.save();

    io?.emit('newCompilerExamCreated', {
      examId: newExam._id,
      title: newExam.title,
      createdBy: req.user._id
    });

    return res.status(201).json({ message: "Exam and questions saved", examId: newExam._id });
  } catch (err) {
    console.error("Unified compiler exam creation failed:", err);
    return res.status(500).json({ message: "Server error during exam creation" });
  }
};


export const getStudentCompilerExams = async (req, res) => {
  try {
    const studentId = req.user._id;

    const exams = await CompilerExam.find({
      assignedStudents: studentId,
      published: true,
    })
      .sort({ startTime: 1 })
      .select("title language description startTime endTime duration totalMarks status");

    res.json({ compilerExams: exams });
  } catch (err) {
    console.error("Error fetching compiler exams for student:", err);
    res.status(500).json({ message: "Failed to fetch compiler exams" });
  }
};
