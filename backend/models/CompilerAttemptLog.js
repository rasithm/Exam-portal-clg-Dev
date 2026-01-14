// models/CompilerAttemptLog.js
import mongoose from "mongoose";

const CompilerAttemptLogSchema = new mongoose.Schema({
  studentId: mongoose.Schema.Types.ObjectId,
  examId: mongoose.Schema.Types.ObjectId,
  questionId: mongoose.Schema.Types.ObjectId,
  attemptNo: Number,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("CompilerAttemptLog", CompilerAttemptLogSchema);
