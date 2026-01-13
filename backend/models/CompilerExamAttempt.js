// models/CompilerExamAttempt.js
import mongoose from "mongoose";

const CompilerExamAttemptSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: "CompilerExam" },

  submissions: [{ type: mongoose.Schema.Types.ObjectId, ref: "StudentCodeSubmission" }],

  totalScore: Number,
  maxScore: Number,
  percentage: Number,
  pass: Boolean,

  reason: { type: String, enum: ["manual", "timeout", "violation"], default: "manual" },

  startedAt: Date,
  submittedAt: Date,

  stats: {
    totalQuestions: Number,
    attempted: Number,
    passed: Number,
    partial: Number,
    failed: Number,
  },

  certificateEligible: Boolean,
  certificateId: String,
});

CompilerExamAttemptSchema.index({ student: 1, exam: 1 }, { unique: true });

export default mongoose.model("CompilerExamAttempt", CompilerExamAttemptSchema);
