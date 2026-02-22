// models/Portfolio.js
import mongoose from "mongoose";

const portfolioSchema = new mongoose.Schema({
  developer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Developer",
    required: true,
    unique: true
  },
  personalInfo: { type: Object, default: {} },
  skills: { type: Object, default: {} },
  projects: { type: Array, default: [] },
  experience: { type: Array, default: [] },
  achievements: { type: Array, default: [] }
}, { timestamps: true });

export default mongoose.model("Portfolio", portfolioSchema);