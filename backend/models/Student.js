// models/Student.js
import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  rollNumber: { type: String, required: true, unique: true },
  name: { type: String },
  password: { type: String, required: true },
  email: { type: String },
  domain: { type: String, enum: ['Technical','Coding','Aptitude','Core','HR'], default: 'Technical' },
  scores: [{ examId: String, score: Number, date: Date }]
}, { timestamps: true });

export default mongoose.model('Student', studentSchema);
