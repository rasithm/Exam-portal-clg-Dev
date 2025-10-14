// controllers/studentController.js
import Exam from "../models/Exam.js";
import Student from "../models/Student.js";

export const getStudentDashboard = async (req, res) => {
  try {
    // ✅ Identify student from token
    const studentId = req.user.studentId || req.user.rollNumber;
    const collegeTag = req.user.collegeTag;

    // ✅ Fetch student profile
    const student = await Student.findOne({ studentId, collegeTag }).select("-password");
    if (!student) return res.status(404).json({ message: "Student not found" });

    // ✅ Find all exams assigned to this student
    const allExams = await Exam.find({
      collegeTag,
      assignStudents: { $in: [studentId] },
    }).sort({ startDateTime: 1 });

    const now = new Date();

    // ✅ Prepare upcoming exams
    const upcomingExams = allExams
      .filter((e) => new Date(e.startDateTime) > now)
      .map((e) => ({
        id: e._id,
        title: e.examName,
        subject: e.category || "General",
        date: e.startDateTime.toISOString().split("T")[0],
        time: new Date(e.startDateTime).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        duration: e.duration,
        status: "upcoming",
        description: e.instructions || "",
      }));

    // ✅ Prepare completed exams (use scores if available)
    const completedExams = (student.scores || [])
      .map((s) => {
        const exam = allExams.find((ex) => ex._id.toString() === s.examId);
        return exam
          ? {
              id: exam._id,
              title: exam.examName,
              subject: exam.category || "General",
              date: exam.endDateTime?.toISOString().split("T")[0] || "",
              score: s.score || 0,
              totalMarks: exam.totalMarks || 100,
              status: "completed",
            }
          : null;
      })
      .filter(Boolean);

    return res.json({
      student: {
        name: student.name,
        studentId: student.studentId,
        department: student.department || "N/A",
      },
      upcomingExams,
      completedExams,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({
      message: "Server error while loading dashboard",
      error: err.message,
    });
  }
};

