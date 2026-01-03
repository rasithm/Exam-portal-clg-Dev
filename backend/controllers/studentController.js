//C:\Users\nazeer\Desktop\Exam-edit\Exam-portal\Exam-Portal\backend\controllers\studentController.js
import Exam from "../models/Exam.js";
import Student from "../models/Student.js";
import ExamAttempt from "../models/ExamAttempt.js";
import CompilerExam from "../models/CompilerExam.js";

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

      const scoreEntry = Array.isArray(student.scores)
        ? student.scores.find(s => s.examId == exam._id.toString())
        : null;


      const attempted = !!scoreEntry;

      

      let status;

      if (attempted) {
        status = "completed";
      } else if (now < start) {
        status = "upcoming";
      } else if (now >= start && now <= end) {
        status = "active";
      } else {
        status = "missed";
      }

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
        percentage: scoreEntry?.percentage || 0,
        pass: (scoreEntry?.percentage || 0) >= 40,
      };


      if (status === "upcoming" || status === "active")
        upcomingExams.push(examObj);
      else completedExams.push(examObj);
    });

  

    // Fetch compiler exams for this student
    const compilerExams = await CompilerExam.find({
      createdBy: adminId,
      assignedStudents: { $in: [student._id] },
    }).sort({ startTime: 1 });

    compilerExams.forEach(exam => {
      const start = new Date(exam.startTime);
      const end = new Date(exam.endTime);
      const now = new Date();

      let status;
      const attempted = exam.submissions?.some(sub => sub.student.toString() === student._id.toString());

      if (attempted) {
        status = "completed";
      } else if (now < start) {
        status = "upcoming";
      } else if (now >= start && now <= end) {
        status = "active";
      } else {
        status = "missed";
      }

      const examObj = {
        id: exam._id,
        title: exam.title,
        description: exam.description || "",
        category: "coding", // to filter in frontend
        subject: exam.language,
        startDate: start.toISOString().split("T")[0],
        startTime: start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        endDate: end.toISOString().split("T")[0],
        endTime: end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        duration: exam.duration,
        status,
        score: 0, // compiler score logic placeholder
        totalMarks: exam.totalMarks,
        percentage: 0, // placeholder for future
        isCompiler: true
      };

      if (status === "upcoming" || status === "active")
        upcomingExams.push(examObj);
      else
        completedExams.push(examObj);
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



