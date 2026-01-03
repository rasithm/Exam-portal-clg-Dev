// controllers/compilerExamController.js
import CompilerExam from '../models/CompilerExam.js';
import CompilerQuestion from '../models/CompilerQuestion.js';
import Student from '../models/Student.js';
import { io } from '../sockets/socketManager.js';
import Exam from '../models/Exam.js';

// Dynamic language config (fetched from Judge0 or a config file)
const allowedLanguages = [
  'C', 'C++', 'Java', 'Python', 'JavaScript', 'C#', 'Go', 'Ruby', 'Rust', 'Kotlin'
];

export const createCompilerExam = async (req, res) => {
  try {
    const {
      title,
      language,
      duration,
      startTime,
      endTime,
      description = '',
      questionCount,
      totalMarks,
      generateCertificate = false,
      assignedRegNos = []
    } = req.body;

    // Input Validation
    if (!title || !language || !duration || !startTime || !endTime || !questionCount || !totalMarks) {
      return res.status(400).json({ message: 'All required fields must be filled' });
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length > 120) {
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

    // Validate dates
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format for startDateTime or endDateTime." });
    }

    if (start < now) {
      return res.status(400).json({ message: "Start time cannot be in the past." });
    }
    if (end <= start) {
      return res.status(400).json({ message: "End time must be after start time." });
    }

    const existingExam = await CompilerExam.findOne({
      title: new RegExp(`^${trimmedTitle}$`, 'i'),
      createdBy: req.user._id
    });
    const existingExamMcq = await Exam.findOne({
        examName: new RegExp(`^${trimmedTitle}$`, "i"),
        createdBy: req.user._id
    });
    if (existingExam || existingExamMcq) {
        return res.status(400).json({ message: "Exam name already exists for this admin/college." });
    }
   

    // Find students by regno under this admin
    // const students = await Student.find({
    //   regno: { $in: assignedRegNos },
    //   createdBy: req.user._id
    // }).select('_id regno');

    // const assignedStudentIds = students.map(s => s._id);
    // const allStudents = await Student.find({ admin: req.user._id }).select("rollNumber");
    // const students = allStudents.map(s => s.rollNumber.toString().trim());
    // const students = await Student.find({
    //     rollNumber: { $in: assignedRegNos.map(r => r.trim()) },
    //     admin: req.user._id
    // }).select("_id");

    // const assignedStudentIds = students.map(s => s._id);
    const allStudents = await Student.find({ admin: req.user._id }).select("rollNumber _id");
    // const assignedStudentIds = allStudents
    // .filter((s) => assignedRegNos.includes(s.rollNumber))
    // .map((s) => s._id);
    const assignedStudentIds = assignedRegNos.length
    ? allStudents.filter(s => assignedRegNos.includes(s.rollNumber)).map(s => s._id)
    : allStudents.map(s => s._id);



    // const allStudents = await Student.find({ admin: req.user._id }).select("rollNumber _id");
    // const assignedStudentIds = allStudents
    // .filter((s) => assignedRegNos.includes(s.rollNumber))
    // .map((s) => s._id);


    const perQuestionMark = Math.floor(totalMarks / questionCount);

    const newExam = await CompilerExam.create({
      title: trimmedTitle,
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

    io?.emit('newCompilerExamCreated', {
      examId: newExam._id,
      title: newExam.title,
      createdBy: req.user._id
    });

    return res.status(201).json({
      message: 'Compiler exam created successfully.',
      examId: newExam._id,
      assignedCount: assignedStudentIds.length
    });
  } catch (err) {
    console.error('Compiler Exam Create Error:', err);
    return res.status(500).json({ message: 'Server error creating compiler exam' });
  }
};

export const addCompilerQuestion = async (req, res) => {
  try {
    
    const { examId } = req.params;
    const {
      title,
      shortDescription ,
      longDescription,
      inputFormat ,
      outputFormat,
      sampleInput ,
      sampleOutput ,
      testCases,
      evaluationMode = 'strict',
      matchType = 'exact',
      marks,
      attemptLimit ,
      timeLimit = 3000,
      memoryLimit = 128
    } = req.body;

    if (!title || !shortDescription || !longDescription ||!inputFormat || !outputFormat || !sampleInput || !sampleOutput ||!testCases || !Array.isArray(testCases) || testCases.length === 0) {
      return res.status(400).json({ message: 'Missing or invalid question fields.' });
    }

    const exam = await CompilerExam.findById(examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const titleExists = await CompilerQuestion.findOne({
      exam: examId,
      title: title.trim()
    });
    if (titleExists) {
      return res.status(409).json({ message: 'Question title already exists in this exam' });
    }
    if (!attemptLimit || attemptLimit < 1) {
      return res.status(400).json({ message: 'Attempt limit must be at least 1' });
    }

    for (const tc of testCases) {
      if (!Array.isArray(tc.inputs) || tc.inputs.length === 0 || typeof tc.expectedOutput !== 'string') {
        return res.status(400).json({ message: 'Each test case must have inputs[] and expectedOutput' });
      }
    }

    const newQuestion = await CompilerQuestion.create({
      exam: examId,
      title: title.trim(),
      shortDescription,
      longDescription,
      inputFormat,
      outputFormat,
      sampleInput,
      sampleOutput,
      testCases,
      evaluationMode,
      matchType,
      marks: marks || exam.perQuestionMark,
      attemptLimit,
      timeLimit,
      memoryLimit
    });

    await CompilerExam.findByIdAndUpdate(examId, {
      $push: { questions: newQuestion._id }
    });

    return res.status(201).json({
      message: 'Question added to compiler exam',
      questionId: newQuestion._id
    });
  } catch (err) {
    console.error('Add Compiler Question Error:', err);
    return res.status(500).json({ message: 'Server error adding compiler question' });
  }
};



