// backend/models/Student.js
import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true }, // owner admin
  rollNumber: { type: String, required: true },
  name: { type: String, required: true },
  password: { type: String, required: true, select: false },
  email: { type: String, required: true },
  department: { type: String, default: "" },
  year: { type: String, default: "" },
  whatsapp_no: { type: String, required: true },
  phone_no: { type: String, required: true },
  profileImage: { type: String, default: "" },
  isProfileUpdated: { type: Boolean, default: false },
  dateOfBirth: { type: String, default: ""  },
  collegeName: { type: String, default: ""  },
  academicYear: { type: String, default: ""  },
  github: { type: String, default: "" },
  leetcode: { type: String, default: "" },
  domain: {
    type: String,
    enum: ["Technical", "Coding", "Aptitude", "Core", "HR"],
    default: "Technical",
  },
  scores: [
    {
      examId: { type: String },
      score: { type: Number },
      percentage: { type: Number },
      date: { type: Date }
    }
  ],

}, { timestamps: true });

studentSchema.index({ admin: 1, rollNumber: 1 }, { unique: true });

export default mongoose.model("Student", studentSchema);

