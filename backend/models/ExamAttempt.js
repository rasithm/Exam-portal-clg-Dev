// backend/models/ExamAttempt.js
import mongoose from "mongoose";

// backend/models/ExamAttempt.js

const examAttemptSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  examSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ExamSession",
    required: true,
  },
  answers: [
    {
      questionId: mongoose.Schema.Types.ObjectId,
      selectedOption: String,   // OPTION TEXT
      changedAnswer: Boolean,
    },
  ],
  totalMarks: Number,   // obtained marks
  maxMarks: Number,     // total possible marks for this attempt
  percentage: Number,
  pass: Boolean,
  submittedAt: { type: Date, default: Date.now },
  reason: {
    type: String,
    enum: ["manual", "violation", "timeout"],
    default: "manual",
  },

  certificateEligible: { type: Boolean, default: false },
  reviewCompleted: { type: Boolean, default: false },

  // ✅ NEW
  certificateId: { type: String, unique: true, sparse: true },

  // ✅ For student development reports
  stats: {
    totalQuestions: Number,
    attempted: Number,
    correct: Number,
    wrong: Number,
    easyCorrect: Number,
    mediumCorrect: Number,
    hardCorrect: Number,
  },
});

examAttemptSchema.index({ examSessionId: 1, student: 1 });

export default mongoose.model("ExamAttempt", examAttemptSchema);





