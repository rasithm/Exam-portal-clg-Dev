// controllers/compilerExamController.js
import CompilerExam from '../models/CompilerExam.js';
import CompilerQuestion from '../models/CompilerQuestion.js';
import Student from '../models/Student.js';
import { io } from '../sockets/socketManager.js';
import Exam from '../models/Exam.js';

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