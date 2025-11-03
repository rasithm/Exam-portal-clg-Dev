import Exam from "../models/Exam.js";
import Student from "../models/Student.js";

export const getStudentDashboard = async (req, res) => {
  try {
    // ✅ Identify student from token (based on rollNumber + admin)
    const rollNumber = req.user.rollNumber;
    const adminId = req.user.admin || req.user._id;

    // ✅ Fetch student profile
    const student = await Student.findOne({ rollNumber, admin: adminId }).select("-password");
    if (!student) return res.status(404).json({ message: "Student not found" });

    // ✅ Find all exams assigned to this student (by rollNumber)
    const allExams = await Exam.find({
      createdBy: adminId,
      assignStudents: { $in: [rollNumber] },
    }).sort({ startDateTime: 1 });

    const now = new Date();

    // ✅ Prepare upcoming exams
    // const upcomingExams = allExams
    //   .filter((e) => new Date(e.startDateTime) > now)
    //   .map((e) => ({
    //     id: e._id,
    //     title: e.examName,
    //     category : e.category || "General",
    //     subject: e.subcategory || "General",
    //     startDate: e.startDateTime ? e.startDateTime.toISOString().split("T")[0] : "",
    //     startTime: e.startDateTime
    //       ? new Date(e.startDateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    //       : "",
    //     endDate: e.endDateTime ? e.endDateTime.toISOString().split("T")[0] : "",
    //     endTime: e.endDateTime
    //       ? new Date(e.endDateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    //       : "",
    //     duration: e.duration || 0,
    //     status: "upcoming",
    //     description: e.instructions || "",
    //   }));
    const upcomingExams = allExams
    .filter((e) => {
      const start = new Date(e.startDateTime);
      const end = new Date(e.endDateTime);
      // Show if exam not ended yet
      return end > now;
    })
    .map((e) => {
      const start = new Date(e.startDateTime);
      const end = new Date(e.endDateTime);
      const status =
        now >= start && now <= end ? "active" : "upcoming";

      return {
        id: e._id,
        title: e.examName,
        category: e.category || "General",
        subject: e.subcategory || "General",
        startDate: e.startDateTime ? e.startDateTime.toISOString().split("T")[0] : "",
        startTime: e.startDateTime
          ? start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "",
        endDate: e.endDateTime ? e.endDateTime.toISOString().split("T")[0] : "",
        endTime: e.endDateTime
          ? end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "",
        duration: e.duration || 0,
        status,
        description: e.instructions || "",
      };
    });

    // ✅ Prepare completed exams
    const completedExams = (student.scores || [])
      .map((s) => {
        const exam = allExams.find((ex) => ex._id.toString() === s.examId);
        return exam
          ? {
              id: exam._id,
              title: exam.examName,
              subject: exam.category || "General",
              date: exam.endDateTime
                ? exam.endDateTime.toISOString().split("T")[0]
                : exam.startDateTime
                ? exam.startDateTime.toISOString().split("T")[0]
                : "",
              score: s.score || 0,
              totalMarks: exam.totalMarks || 100,
              status: "completed",
            }
          : null;
      })
      .filter(Boolean);

    // ✅ Respond with data
    return res.json({
      student: {
        name: student.name,
        studentId: student.rollNumber,
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


