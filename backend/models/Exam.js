
// backend/models/Exam.js
import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  type: { type: String, enum: ["mcq", "descriptive", "coding"], required: true },
  question: { type: String, required: true },
  options: [String],
  correctAnswer: String,
  maxWords: Number,
  language: String,
  mode: { type: String, enum: ["easy", "medium", "hard"], required: true },
  marks: { type: Number, default: 1 }
});

const examSchema = new mongoose.Schema({
  examName: { type: String, required: true },
  fileName: String,
  category: String,
  subcategory: { type: String, required: true },
  questionSets: [{ type: mongoose.Schema.Types.ObjectId, ref: "QuestionSet" }],
  questions: [questionSchema],
  totalMarks: Number,
  questionCount: Number,
  startDateTime: Date,
  endDateTime: Date,
  duration: Number,
  assignStudents: [String],
  reassignedStudents: [String],
  reassignAllowed: Boolean,
  instructions: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
  collegeTag: String,

  // ✅ NEW
  negativeMarkingEnabled: { type: Boolean, default: true },
  generateCertificate: { type: Boolean, default: false },
  sameMarkForAll: { type: Boolean, default: false },
  markPerQuestion: Number,
  easyMarkPerQuestion: Number,
  mediumMarkPerQuestion: Number,
  hardMarkPerQuestion: Number,
}, { timestamps: true });

export default mongoose.model("Exam", examSchema);
