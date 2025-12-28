import mongoose from "mongoose";

const passwordResetRequestSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: function () {
      return this.purpose !== "admin";
    }
  },
  rollNumber: {
    type: String,
    required: function () {
      return this.purpose !== "admin";
    }
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: function () {
      return this.purpose === "admin";
    }
  },
  requestedEmail: {
    type: String,
    required: true,
  },
  otpHash: String,
  otpExpiresAt: Date,
  status: {
    type: String,
    enum: ["pending_email_assign", "otp_sent", "verified", "completed", "rejected"],
    default: "otp_sent"
  },
  purpose: {
    type: String,
    enum: ["student_reset", "admin_reset", "admin_profile"],
    default: "student_reset"
  },
  attempts: { type: Number, default: 0 },
  used: { type: Boolean, default: false },
  oneTimeToken: String,
  adminAction: {
    approved: Boolean,
    by: String,
    at: Date,
    reason: String,
  },
  requestedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("PasswordResetRequest", passwordResetRequestSchema);

