//C:\Users\nazeer\Desktop\Exam-edit\Exam-portal\Exam-Portal\backend\controllers\adminProfileController.js
import Admin from "../models/Admin.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { sendOtpMail } from "../services/mailer.js";
import PasswordResetRequest from "../models/PasswordResetRequest.js";

const OTP_TTL = 10 * 60 * 1000; // 10 min

// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST,
//   port: Number(process.env.EMAIL_PORT || 587),
//   secure: process.env.EMAIL_SECURE === "true",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// const sendMail = async (to, otp) => {
//   const html = `
//     <p>Your verification code is <b>${otp}</b></p>
//     <p>This code expires in 10 minutes.</p>
//     <p>If you did not request this, please ignore.</p>
//   `;

//   await transporter.sendMail({
//     from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
//     to,
//     subject: "ExamPortal Email Verification OTP",
//     html,
//   });
// };


export const getAdminProfile = async (req, res) => {
  const admin = await Admin.findById(req.user._id).select("-password");
  res.json(admin);
};





export const requestEmailVerification = async (req, res) => {
  const { personalEmail } = req.body;

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = await bcrypt.hash(otp, 10);

  const reqDoc = await PasswordResetRequest.create({
    admin: req.user._id,
    requestedEmail: personalEmail,
    otpHash,
    otpExpiresAt
    : new Date(Date.now() + 10 * 60000),
    status: "otp_sent",
    purpose: "admin-profile"
  });

  await sendOtpMail(
    personalEmail,
    "ExamPortal Email Verification OTP",
    `<p>Your verification code is <b>${otp}</b></p>`
  );

  res.json({ message: "OTP sent", requestId: reqDoc._id });
};


// export const verifyEmailOtp = async (req, res) => {
//   const { otp } = req.body;

//   if (!req.user.emailOtpHash) return res.status(400).json({ message: "No OTP request" });
//   if (Date.now() > req.user.emailOtpExpires) return res.status(410).json({ message: "OTP expired" });

//   const ok = await bcrypt.compare(otp, req.user.emailOtpHash);
//   if (!ok) return res.status(401).json({ message: "Invalid OTP" });

//   req.user.personalEmailVerified = true;
//   req.user.emailOtpHash = undefined;
//   req.user.emailOtpExpires = undefined;
//   console.log("Verifying OTP for admin:", req.user._id);
//   console.log("Stored hash:", req.user.emailOtpHash);

//   await req.user.save();

//   res.json({ message: "Email verified" });
// };
export const verifyAdminOtp = async (req, res) => {
  const { requestId, otp } = req.body;

  const reqDoc = await PasswordResetRequest.findById(requestId);
  if (!reqDoc || reqDoc.status !== "otp_sent") return res.status(400).json({ message: "No OTP request" });

  if (new Date() > reqDoc.otpExpiresAt) return res.status(410).json({ message: "OTP expired" });

  const ok = await bcrypt.compare(String(otp), reqDoc.otpHash);
  if (!ok) return res.status(401).json({ message: "Invalid OTP" });

  reqDoc.status = "verified";
  await reqDoc.save();

  return res.json({ message: "OTP verified", requestId });
};


export const updateAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both current and new password are required" });
    }

    // Validation: new password rules
    const isValid =
      newPassword.length >= 8 &&
      /[a-z]/.test(newPassword) &&
      /\d/.test(newPassword) && /[A-Z]/.test(newPassword);

    if (!isValid) {
      return res.status(400).json({
        message: "New password must be 8+ characters, include a lowercase letter and a number"
      });
    }

    const admin = await Admin.findById(req.user._id).select("+password");
    if (!admin) {
      return res.status(404).json({ message: "Student not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("updatePassword error:", err);
    res.status(500).json({ message: "Failed to change password" });
  }
};

// export const updateAdminProfile = async (req, res) => {
//   try {
//     const admin = await Admin.findById(req.user._id);
//     if (!admin) return res.status(404).json({ message: "Admin not found" });

//     const { name, phone_no, whatsapp_no, personalEmailVerified } = req.body;

//     if (!name || !phone_no || !whatsapp_no)
//       return res.status(400).json({ message: "Missing required fields" });

//     admin.name = name.trim();
//     admin.adminPhone_no = phone_no.trim();
//     admin.adminWhatsapp_no = whatsapp_no.trim();

//     if (req.file) admin.profileImage = req.file.path;

//     await admin.save();
//     res.json({ message: "Profile updated", admin });
//   } catch (err) {
//     console.error("updateAdminProfile error:", err);
//     res.status(500).json({ message: "Update failed" });
//   }
// };
export const updateAdminProfile = async (req, res) => {
  const admin = await Admin.findById(req.user._id);
  if (!admin) return res.status(404).json({ message: "Admin not found" });

  if (!admin.personalEmailVerified)
    return res.status(403).json({ message: "Verify email first" });

  const { name, phone_no, whatsapp_no  , personalEmail} = req.body;

  if (!name || !phone_no)
    return res.status(400).json({ message: "Missing required fields" });

  admin.name = name;
  admin.adminPhone_no = phone_no;
  admin.adminWhatsapp_no = whatsapp_no;
  if(personalEmail) admin.personalEmail = personalEmail;

  if (req.file) admin.profileImage = req.file.path;

  await admin.save();
  res.json({ message: "Profile updated", admin });
};





