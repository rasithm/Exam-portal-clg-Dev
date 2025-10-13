
// models/QuestionSet.js
import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: [String], validate: v => v.length === 4 },
  correctAnswer: { type: String, required: true },
  category: { type: String, required: true },
  subCategory: { type: String, required: true },
  mode: { type: String, enum: ["easy", "medium", "hard"], default: "easy" },
  verification: { type: String, enum: ["remove", ""], default: "" }
});

const questionSetSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  category: { type: String, required: true },
  subcategory: { type: String, required: true },
  sharedAdmins: [String],
  notes: String,
  questions: [questionSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
  collegeTag: String
}, { timestamps: true });

export default mongoose.model("QuestionSet", questionSetSchema);
