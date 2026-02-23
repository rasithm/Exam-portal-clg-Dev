import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  pageUrl: String,
  type: String,
  message: { type: String, required: true },
  screenshot: String,

  lastVisitedPages: [String],
  screenSize: String,
  deviceType: String,
  os: String,
  browser: String,
  timestamp: Date,
}, { timestamps: true });

export default mongoose.model("Feedback", feedbackSchema);