//C:\Users\nazeer\Desktop\Exam-edit\Exam-portal\Exam-Portal\backend\models\ExamSession.js
import mongoose from "mongoose";

const examSessionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
  active: { type: Boolean, default: true },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  violations: { type: Number, default: 0 },
  sessionToken: { type: String, required: true },
});

export default mongoose.model("ExamSession", examSessionSchema);