// C:\Users\nazeer\Downloads\Exam-portal\Exam-portal\backend\models\Exam.js
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
  startDateTime: Date,
  endDateTime: Date,
  duration: Number,
  assignStudents: [String],
  reassignAllowed: Boolean,
  instructions: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
  collegeTag: String,
}, { timestamps: true });


export default mongoose.model("Exam", examSchema);
