
// backend/models/ExamEvent.js
import mongoose from "mongoose";

const examEventSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true }, // ✅ renamed
  examSessionId: { type: mongoose.Schema.Types.ObjectId, ref: "ExamSession", required: true },
  eventType: { type: String, enum: ["fullscreen_exit", "tab_switch"], required: true },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("ExamEvent", examEventSchema);
