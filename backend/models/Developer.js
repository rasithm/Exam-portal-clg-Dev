// models/Developer.js
import mongoose from "mongoose";

const developerSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  password: { type: String, required: true, select: false },
  role: { type: String, default: "developer" }
}, { timestamps: true });

export default mongoose.model("Developer", developerSchema);