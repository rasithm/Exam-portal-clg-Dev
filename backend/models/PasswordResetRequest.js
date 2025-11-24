import mongoose from "mongoose";

const passwordResetSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  rollNumber: { type: String, required: true }, // convenience
  requestedEmail: { type: String, required: true },
  otpHash: { type: String },            // hashed OTP
  otpExpiresAt: { type: Date },
  verified: { type: Boolean, default: false }, // OTP verified / admin approved
  used: { type: Boolean, default: false },
  status: { type: String, enum: ["pending", "otp_sent", "verified", "completed", "pending_email_assign", "rejected"], default: "pending" },
  attempts: { type: Number, default: 0 }, // OTP verification attempts
  requestedAt: { type: Date, default: Date.now },
  adminAction: {
    approved: Boolean,
    by: String,
    at: Date,
    reason: String,
  },
  oneTimeToken: { type: String }, // short token to allow reset after OTP verification
});

passwordResetSchema.index({ rollNumber: 1 });
passwordResetSchema.index({ requestedEmail: 1 });
passwordResetSchema.index({ requestedAt: 1 });

export default mongoose.model("PasswordResetRequest", passwordResetSchema);
