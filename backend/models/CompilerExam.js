// models/CompilerExam.js
import mongoose from 'mongoose';


const CompilerExamSchema = new mongoose.Schema({
  title: { type: String, required: true },
  language: { type: String, required: true }, // now dynamic via controller validation
  duration: { type: Number, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  description: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  totalMarks: { type: Number, required: true },
  questionCount: { type: Number, required: true },
  perQuestionMark: { type: Number, required: true },
  generateCertificate: { type: Boolean, default: false },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CompilerQuestion' }],
  published: { type: Boolean, default: false },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  createdAt: { type: Date, default: Date.now }
});



export default mongoose.model('CompilerExam', CompilerExamSchema);