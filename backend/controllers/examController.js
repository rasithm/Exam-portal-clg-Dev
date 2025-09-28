// C:\Users\nazeer\Downloads\Exam-portal\Exam-portal\backend\controllers\examController.js
import Exam from "../models/Exam.js";
import { io } from "../sockets/socketManager.js";

// Create exam
export const createExam = async (req, res) => {
  try {
    const { title, duration, questions } = req.body;

    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can create exams" });
    }

    const exam = await Exam.create({
      title,
      duration,
      questions,
      collegeTag: req.user.collegeTag,
      createdBy: req.user.id,
    });

    // Notify only this admin's students via socket.io
    io.to(`college_${req.user.collegeTag}`).emit("examCreated", {
      examId: exam._id,
      title: exam.title,
    });

    res.json({ message: "Exam created successfully", examId: exam._id });
  } catch (error) {
    console.error("Error creating exam:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get exams for a student (filtered by collegeTag)
export const getExamsForStudent = async (req, res) => {
  try {
    const collegeTag = req.user.collegeTag; // comes from student login
    const exams = await Exam.find({ collegeTag }).select("title duration createdAt");

    res.json(exams);
  } catch (error) {
    console.error("Error fetching exams:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get single exam (with questions)
export const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) return res.status(404).json({ message: "Exam not found" });
    if (exam.collegeTag !== req.user.collegeTag) {
      return res.status(403).json({ message: "Not allowed to access this exam" });
    }

    res.json(exam);
  } catch (error) {
    console.error("Error fetching exam:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
