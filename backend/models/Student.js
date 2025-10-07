
// models/Student.js
import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true }, // owner admin
  rollNumber: { type: String, required: true },
  name: { type: String },
  password: { type: String, required: true },
  email: { type: String },
  department: { type: String },
  year: { type: String },
  whatsapp_no: { type: String },
  phone_no: { type: String },
  domain: { type: String, enum: ['Technical','Coding','Aptitude','Core','HR'], default: 'Technical' },
  scores: [{ examId: String, score: Number, date: Date }]
}, { timestamps: true });

// composite unique index: one admin cannot create duplicate rollNumbers
studentSchema.index({ admin: 1, rollNumber: 1 }, { unique: true });

export default mongoose.model('Student', studentSchema);
