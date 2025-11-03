//C:\Users\nazeer\Desktop\Exam-edit\Exam-portal\Exam-Portal\backend\models\ExamAttempt.js
import mongoose from "mongoose";

const examAttemptSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  examSessionId: { type: mongoose.Schema.Types.ObjectId, ref: "ExamSession", required: true },
  answers: [{
    questionId: mongoose.Schema.Types.ObjectId,
    selectedOption: String,
    changedAnswer: Boolean,
  }],
  totalMarks: Number,
  percentage: Number,
  pass: Boolean,
  submittedAt: { type: Date, default: Date.now },
  reason: { type: String, enum: ["manual", "violation", "timeout"], default: "manual" },
});

export default mongoose.model("ExamAttempt", examAttemptSchema);

