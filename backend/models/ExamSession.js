// backend/models/ExamSession.js
import mongoose from "mongoose";

const examSessionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
  active: { type: Boolean, default: true },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  violations: { type: Number, default: 0 },
  sessionToken: { type: String, required: true },

  // ✅ store question order so it doesn’t reshuffle every refresh
  shuffledQuestions: [{ type: mongoose.Schema.Types.ObjectId }],
});

export default mongoose.model("ExamSession", examSessionSchema);
