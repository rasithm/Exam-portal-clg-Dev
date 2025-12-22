//C:\Users\nazeer\Desktop\Exam-edit\Exam-portal\Exam-Portal\backend\models\Notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
    message: { type: String, required: true },
    type: { type: String, default: "General" },
    link: { type: String, default: "" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
