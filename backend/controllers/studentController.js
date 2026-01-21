//C:\Users\nazeer\Desktop\Exam-edit\Exam-portal\Exam-Portal\backend\controllers\studentController.js
import Exam from "../models/Exam.js";
import Student from "../models/Student.js";
import ExamAttempt from "../models/ExamAttempt.js";
import CompilerExam from "../models/CompilerExam.js";
import CompilerExamAttempt from "../models/CompilerExamAttempt.js";
import ExamSession from "../models/ExamSession.js";


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

    
    


    for (const exam of allExams) {
      const start = new Date(exam.startDateTime);
      const end = new Date(exam.endDateTime);

      // const scoreEntry = Array.isArray(student.scores)
      //   ? student.scores.find(s => s.examId == exam._id.toString())
      //   : null;
      // const attempt = await ExamAttempt.findOne({
      //   student: student._id,
      //   exam: exam._id,
      // });

      const session = await ExamSession.findOne({
        student: student._id,
        exam: exam._id,
      }).sort({ createdAt: -1 });

      const attempt = session
        ? await ExamAttempt.findOne({
            student: student._id,
            examSessionId: session._id,
          })
        : null;



      const attempted = !!attempt && attempt.submittedAt;


      


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
        score: attempt?.totalMarks || 0,              // ✅ obtained marks
totalMarks: attempt?.maxMarks || exam.totalMarks || 100,
percentage: attempt?.percentage || 0,
pass: attempt?.pass || false,                 // ✅ boolean

certificateEligible: attempt?.certificateEligible || false,
certificateId: attempt?.certificateId || null,

isCompiler: false,
completedAt: attempt?.submittedAt || end,     // ✅ real submission time

      
        
        
        
        certificateType: "mcq",
        
        

      };


      if (status === "upcoming" || status === "active")
        upcomingExams.push(examObj);
      else completedExams.push(examObj);
    };

  

    // Fetch compiler exams for this student
    const compilerExams = await CompilerExam.find({
      createdBy: adminId,
      assignedStudents: { $in: [student._id] },
    }).sort({ startTime: 1 });

    

    for (const exam of compilerExams) {
      const start = new Date(exam.startTime);
      const end = new Date(exam.endTime);
      const now = new Date();

      const compilerAttempt = await CompilerExamAttempt.findOne({
        student: student._id,
        exam: exam._id,
      });

      let status;
      const attempted = !!compilerAttempt;

      if (attempted) status = "completed";
      else if (now < start) status = "upcoming";
      else if (now >= start && now <= end) status = "active";
      else status = "missed";

      const examObj = {
        id: exam._id,
        title: exam.title,
        description: exam.description || "",
        category: "coding",
        subject: exam.language,
        startDate: start.toISOString().split("T")[0],
        startTime: start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        endDate: end.toISOString().split("T")[0],
        endTime: end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        duration: exam.duration,

        status,
        score: compilerAttempt?.totalScore || 0,
        totalMarks: compilerAttempt?.maxScore || exam.totalMarks,
        percentage: compilerAttempt?.percentage || 0,
        pass: compilerAttempt?.pass || false,

        certificateEligible: compilerAttempt?.certificateEligible || false,
        certificateId: compilerAttempt?.certificateId || null,

        isCompiler: true,
        completedAt: compilerAttempt?.submittedAt || null,
      };

      if (status === "upcoming" || status === "active")
        upcomingExams.push(examObj);
      else
        completedExams.push(examObj);
    }



    


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



