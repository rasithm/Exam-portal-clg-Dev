// models/Admin.js
import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  collegeName: String,
  collegeTag: String,
  department: String
}, { timestamps: true });

export default mongoose.model('Admin', adminSchema);
