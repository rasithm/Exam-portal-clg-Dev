//C:\Users\nazeer\Desktop\Exam-edit-security\Exam-Portal\backend\models\AdminEmailVerificationRequest.js
import mongoose from "mongoose";

const schema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
  },

  requestedEmail: {
    type: String,
    required: true,
  },

  otpHash: {
    type: String,
    required: true,
  },

  otpExpiresAt: {
    type: Date,
    required: true,
  },

  status: {
    type: String,
    enum: ["otp_sent", "verified"],
    default: "otp_sent",
  },
}, { timestamps: true });

export default mongoose.model("AdminEmailVerificationRequest", schema);
