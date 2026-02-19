//C:\Users\nazeer\Desktop\Exam-edit\Exam-portal\Exam-Portal\backend\controllers\adminProfileController.js
import Admin from "../models/Admin.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { sendOtpMail } from "../services/mailer.js";
import PasswordResetRequest from "../models/PasswordResetRequest.js";
import AdminEmailVerificationRequest from "../models/AdminEmailVerificationRequest.js";
import cloudinary from "../config/cloudinary.js"; // adjust path
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
  const admin = await Admin.findById(req.user._id).select("-password");

  if (!personalEmail)
    return res.status(400).json({ message: "Email required" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = await bcrypt.hash(otp, 10);

  const doc = await AdminEmailVerificationRequest.create({
    admin: req.user._id,
    requestedEmail: personalEmail,
    otpHash,
    otpExpiresAt: new Date(Date.now() + 10 * 60000),
    status: "otp_sent",
  });

  // await sendOtpMail(
  //   personalEmail,
  //   "Admin Email Verification OTP",
  //   `<p>Your OTP is <b>${otp}</b></p>`
  // );
  await sendOtpMail(
  personalEmail,
  "Your OTP Code – Exam Portal",
  `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <h2 style="color:#2c3e50;">Your OTP Code – Exam Portal</h2>
    
    <p>Dear ${admin.name || "Administrator"},</p>
    
    <p>Your One-Time Password (OTP) for <strong>Exam Portal</strong> is:</p>
    
    <div style="background:#eef6ff; padding:15px; text-align:center; border-radius:8px; margin:20px 0;">
      <h1 style="letter-spacing:5px; color:#2980b9;">🔐 ${otp}</h1>
    </div>
    
    <p>⏳ This OTP is valid for 10 minutes only.</p>
    
    <p>
      Do not share this OTP with anyone, including our support team.
    </p>
    
    <p>
      If you did not request this OTP, please contact your IT team immediately.
    </p>
    
    <p style="margin-top:30px;">
      Regards,<br>
      <strong>Exam Portal Team</strong>
    </p>
    
  </div>
  `
);


  res.json({ requestId: doc._id });
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

  const doc = await AdminEmailVerificationRequest.findById(requestId);

  if (!doc) return res.status(400).json({ message: "Invalid request" });

  if (doc.status !== "otp_sent")
    return res.status(400).json({ message: "Already verified" });

  if (new Date() > doc.otpExpiresAt)
    return res.status(410).json({ message: "OTP expired" });

  const ok = await bcrypt.compare(otp, doc.otpHash);
  if (!ok) return res.status(401).json({ message: "Invalid OTP" });

  doc.status = "verified";
  await doc.save();

  // ✅ mark admin verified
  await Admin.findByIdAndUpdate(doc.admin, {
    personalEmailVerified: true,
    personalEmail: doc.requestedEmail,
  });

  res.json({ message: "OTP verified" });
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

  const { name, phone_no, whatsapp_no, personalEmail } = req.body || {};

  if (!name || !phone_no)
    return res.status(400).json({ message: "Missing required fields" });

  admin.name = name;
  admin.adminPhone_no = phone_no;
  admin.adminWhatsapp_no = whatsapp_no;
  if(personalEmail) admin.personalEmail = personalEmail;

 



  if (req.file) {
    // await cloudinary.uploader.destroy(oldPublicId)
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "exam-portal/admins",
    });

    admin.profileImage = result.secure_url;
  }


  await admin.save();
  res.json({ message: "Profile updated", admin });
};





