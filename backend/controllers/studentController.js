import Exam from "../models/Exam.js";
import Student from "../models/Student.js";

export const getStudentDashboard = async (req, res) => {
  try {
    const rollNumber = req.user.rollNumber;
    const adminId = req.user.admin || req.user._id;

    // Step 1 — Fetch student
    const student = await Student.findOne({ rollNumber, admin: adminId })
      .select("-password -__v");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Step 2 — Fetch exams assigned to this student
    const allExams = await Exam.find({
      createdBy: adminId,
      assignStudents: { $in: [rollNumber] },
    }).sort({ startDateTime: 1 });

    const now = new Date();

    const upcomingExams = [];
    const completedExams = [];

    allExams.forEach(exam => {
      const start = new Date(exam.startDateTime);
      const end = new Date(exam.endDateTime);

      const scoreEntry = student.scores?.find(
        s => s.examId === exam._id.toString()
      );

      const attempted = !!scoreEntry;

      const status =
        now < start
          ? "upcoming"
          : now >= start && now <= end
          ? "active"
          : attempted
          ? "completed"
          : "missed";

      const examObj = {
        id: exam._id,
        title: exam.examName,
        description: exam.instructions || "",
        category: exam.category || "General",
        subject: exam.subcategory || "General",
        startDate: start.toISOString().split("T")[0],
        startTime: start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        endDate: end.toISOString().split("T")[0],
        endTime: end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        duration: exam.duration,
        status,
        score: scoreEntry?.score || 0,
        totalMarks: exam.totalMarks || 100,
      };

      if (status === "upcoming" || status === "active")
        upcomingExams.push(examObj);
      else completedExams.push(examObj);
    });

    // Step 3 — Return dashboard data
    return res.json({
      student: {
        name: student.name,
        studentId: student.rollNumber,
        department: student.department,
        email: student.email,
        phone_no: student.phone_no,
        whatsapp_no: student.whatsapp_no,
        dateOfBirth: student.dateOfBirth,
        collegeName: student.collegeName,
        academicYear: student.academicYear,
        year: student.year,
        profileImage: student.profileImage,
        isProfileUpdated: student.isProfileUpdated,
      },
      upcomingExams,
      completedExams,
    });

  } catch (err) {
    console.error("Dashboard error:", err);
    return res.status(500).json({
      message: "Server error while loading dashboard",
      error: err.message,
    });
  }
};



