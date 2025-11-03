//C:\Users\nazeer\Desktop\Exam-edit\Exam-portal\Exam-Portal\backend\models\ExamEvent.js
import mongoose from "mongoose";

const examEventSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  examSessionId: { type: mongoose.Schema.Types.ObjectId, ref: "ExamSession", required: true },
  eventType: { type: String, enum: ["fullscreen_exit", "tab_switch"], required: true },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("ExamEvent", examEventSchema);
