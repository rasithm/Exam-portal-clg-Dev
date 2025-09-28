// C:\Users\nazeer\Downloads\Exam-portal\Exam-portal\backend\models\Exam.js
import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  type: { type: String, enum: ["mcq", "descriptive", "coding"], required: true },
  question: { type: String, required: true },
  options: [String],              // for MCQ
  correctAnswer: String,          // index or text
  maxWords: Number,               // for descriptive
  language: String                // for coding
});

const examSchema = new mongoose.Schema({
  title: { type: String, required: true },
  duration: { type: Number, default: 120 }, // in minutes
  collegeTag: { type: String, required: true }, // link to admin’s college
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
  questions: [questionSchema],
}, { timestamps: true });

export default mongoose.model("Exam", examSchema);
