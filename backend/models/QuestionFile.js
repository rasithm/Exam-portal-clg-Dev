//C:\Users\nazeer\Downloads\Exam-portal\Exam-portal\backend\models\QuestionFile.js
import mongoose from 'mongoose';

const QuestionFileSchema = new mongoose.Schema({
  fileName: String,
  category: String,
  subCategory: String,
  uploaderEmail: String,
  approvedBy: String,
  questionCount: Number,
  approvedAt: Date,
}, { timestamps: true });

export default mongoose.model('QuestionFile', QuestionFileSchema);
