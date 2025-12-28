//C:\Users\nazeer\Desktop\Exam-edit\Exam-portal\Exam-Portal\backend\controllers\forgotController.js
import Student from "../models/Student.js";
import PasswordResetRequest from "../models/PasswordResetRequest.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { sendOtpMail } from "../services/mailer.js";

const OTP_TTL_MIN = 10; // minutes
const MAX_REQUESTS_WINDOW = 3; // max OTP sends per 30 minutes
const REQUEST_WINDOW_MIN = 30; // minutes

// nodemailer transporter (use env)
// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST,
//   port: Number(process.env.EMAIL_PORT || 587),
//   secure: process.env.EMAIL_SECURE === "true",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// const sendEmail = async (to, subject, html) => {
//   await transporter.sendMail({
//     to,
//     from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
//     subject,
//     html,
//   });
// };

const generateOTP = () => {
  return ("" + Math.floor(100000 + Math.random() * 900000)); // 6-digit
};

export const requestStudentReset = async (req, res) => {
  try {
    const { regNo, email } = req.body;
    if (!regNo || !email) return res.status(400).json({ message: "regNo and email required" });

    const student = await Student.findOne({ rollNumber: regNo });
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Rate-limit: count recent requests for this rollNumber
    const windowStart = new Date(Date.now() - REQUEST_WINDOW_MIN * 60 * 1000);
    const recentCount = await PasswordResetRequest.countDocuments({
      rollNumber: regNo,
      requestedAt: { $gte: windowStart },
    });
    if (recentCount >= MAX_REQUESTS_WINDOW) {
      return res.status(429).json({ message: "Too many reset requests. Please wait and try later." });
    }

    // If student has an assigned email and it matches, go OTP flow
    if (student.email && student.email.toLowerCase().trim() === String(email).toLowerCase().trim()) {
      const otp = generateOTP();
      const otpHash = await bcrypt.hash(otp, 10);
      const expires = new Date(Date.now() + OTP_TTL_MIN * 60 * 1000);

      const reqDoc = await PasswordResetRequest.create({
        student: student._id,
        rollNumber: regNo,
        requestedEmail: email.trim(),
        otpHash,
        otpExpiresAt: expires,
        status: "otp_sent",
      });

      // send email
      const link = `${process.env.FRONTEND_URL}/reset/verify?req=${reqDoc._id}`;
      const html = `<p>Your password reset code is <strong>${otp}</strong>.</p>
                    <p>It expires in ${OTP_TTL_MIN} minutes.</p>
                    <p>If you didn't request this, ignore this message.</p>
                    <p><small>Or click to verify: <a href="${link}">${link}</a></small></p>`;

      await sendOtpMail(email.trim(), "ExamPortal Password Reset OTP", html);

      return res.json({ message: "OTP sent to registered email", requestId: reqDoc._id });
    }

    // If student email missing or does not match -> create pending assignment request
    const existingPending = await PasswordResetRequest.findOne({
      rollNumber: regNo,
      status: "pending_email_assign",
      requestedEmail: email.trim(),
    });

    if (existingPending) {
      // Already pending: don't spam admin
      return res.status(200).json({ message: "A request is already pending admin approval" });
    }

    const pending = await PasswordResetRequest.create({
      student: student._id,
      rollNumber: regNo,
      requestedEmail: email.trim(),
      status: "pending_email_assign",
    });

    // TODO: notify admins (via socket or DB notifications)
    // Example: io?.emit("emailAssignRequest", { id: pending._id, rollNumber: regNo, email });

    return res.json({ message: "Request recorded and forwarded to admin for approval", requestId: pending._id });
  } catch (err) {
    console.error("requestStudentReset error", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { requestId, otp } = req.body;
    if (!requestId || !otp) return res.status(400).json({ message: "requestId and otp required" });

    const reqDoc = await PasswordResetRequest.findById(requestId);
    if (!reqDoc) return res.status(404).json({ message: "Request not found" });
    if (reqDoc.status !== "otp_sent") return res.status(400).json({ message: "Request not in otp_sent state" });
    if (reqDoc.used) return res.status(400).json({ message: "Request already used" });
    if (new Date() > new Date(reqDoc.otpExpiresAt)) return res.status(410).json({ message: "OTP expired" });

    // check attempts
    if ((reqDoc.attempts || 0) >= 5) {
      reqDoc.status = "rejected";
      await reqDoc.save();
      return res.status(429).json({ message: "Too many attempts. Request rejected." });
    }

    const ok = await bcrypt.compare(String(otp), reqDoc.otpHash || "");
    if (!ok) {
      reqDoc.attempts = (reqDoc.attempts || 0) + 1;
      await reqDoc.save();
      return res.status(401).json({ message: "Invalid OTP" });
    }

    // mark verified and set one-time token
    reqDoc.verified = true;
    reqDoc.status = "verified";
    reqDoc.used = false;
    // create a one-time token (JWT) valid for short time (15 minutes)
    const token = jwt.sign({ reqId: reqDoc._id.toString() }, process.env.JWT_SECRET, { expiresIn: "15m" });
    reqDoc.oneTimeToken = token;
    await reqDoc.save();

    return res.json({ message: "OTP verified", oneTimeToken: token, requestId: reqDoc._id });
  } catch (err) {
    console.error("verifyOtp error", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const completeReset = async (req, res) => {
  try {
    const { requestId, newPassword, oneTimeToken } = req.body;
    if (!requestId || !newPassword || !oneTimeToken) return res.status(400).json({ message: "requestId, newPassword and token required" });

    // verify token
    try {
      const decoded = jwt.verify(oneTimeToken, process.env.JWT_SECRET);
      if (decoded.reqId !== requestId) return res.status(401).json({ message: "Invalid token" });
    } catch (err) {
      return res.status(401).json({ message: "Token invalid or expired" });
    }

    const reqDoc = await PasswordResetRequest.findById(requestId);
    if (!reqDoc) return res.status(404).json({ message: "Request not found" });
    if (!reqDoc.verified) return res.status(400).json({ message: "Request not verified" });
    if (reqDoc.used) return res.status(400).json({ message: "Request already used" });

    // validate password strength on server side
    if (newPassword.length < 8 || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      return res.status(400).json({ message: "Password must be >=8 characters and include lowercase and number" });
    }

    const student = await Student.findById(reqDoc.student);
    if (!student) return res.status(404).json({ message: "Student not found" });

    student.password = await bcrypt.hash(newPassword, 10);
    await student.save();

    reqDoc.used = true;
    reqDoc.status = "completed";
    await reqDoc.save();

    // optionally invalidate sessions (Session model)
    // await Session.updateMany({ userId: student._id.toString(), role: 'student' }, { $set: { active: false } });

    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("completeReset error", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Admin endpoints
export const listEmailAssignRequests = async (req, res) => {
  try {
    const pending = await PasswordResetRequest.find({ status: "pending_email_assign" }).populate("student", "name rollNumber email");
    return res.json({ pending });
  } catch (err) {
    console.error("listEmailAssignRequests", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const adminApproveEmailAssign = async (req, res) => {
  try {
    const { requestId, approve, reason } = req.body; // approve: boolean
    if (!requestId) return res.status(400).json({ message: "requestId required" });

    const reqDoc = await PasswordResetRequest.findById(requestId);
    if (!reqDoc) return res.status(404).json({ message: "Request not found" });

    if (approve) {
      // attach email to student
      const student = await Student.findById(reqDoc.student);
      student.email = reqDoc.requestedEmail;
      await student.save();

      reqDoc.status = "otp_sent"; // now send otp automatically
      reqDoc.adminAction = { approved: true, by: req.user?.email || "admin", at: new Date(), reason: reason || "" };

      // generate OTP and send (same as above)
      const otp = generateOTP();
      reqDoc.otpHash = await bcrypt.hash(otp, 10);
      reqDoc.otpExpiresAt = new Date(Date.now() + OTP_TTL_MIN * 60 * 1000);

      await reqDoc.save();

      // send email to newly assigned email
      const html = `<p>Your requested email has been attached to the student account.</p>
                    <p>Your OTP: <strong>${otp}</strong></p>
                    <p>It expires in ${OTP_TTL_MIN} minutes.</p>`;
      await sendOtpMail(reqDoc.requestedEmail, "ExamPortal: Email attached & OTP", html);

      return res.json({ message: "Email assigned and OTP sent to student email" });
    } else {
      reqDoc.status = "rejected";
      reqDoc.adminAction = { approved: false, by: req.user?.email || "admin", at: new Date(), reason: reason || "" };
      await reqDoc.save();
      return res.json({ message: "Request rejected" });
    }
  } catch (err) {
    console.error("adminApproveEmailAssign error", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const requestAdminReset = async (req, res) => {
  const { email, personalEmail } = req.body;

  const admin = await Admin.findOne({ email, personalEmail });
  if (!admin) return res.status(404).json({ message: "No matching admin" });

  const otp = generateOTP();
  const otpHash = await bcrypt.hash(otp, 10);

  await PasswordResetRequest.create({
    admin: admin._id,
    requestedEmail: personalEmail,
    otpHash,
    otpExpiresAt: new Date(Date.now() + 10 * 60000),
    status: "otp_sent",
  });

  await sendOtpMail(personalEmail, "Admin Password Reset OTP", `<p>Your OTP: ${otp}</p>`);
  res.json({ message: "OTP sent" });
};

export const verifyAdminOtp = async (req, res) => {
  const { email, otp } = req.body;

  const reqDoc = await PasswordResetRequest.findOne({
    _id: requestId,
    purpose: "admin_profile",
    status: "otp_sent"
  });


  if (!reqDoc) return res.status(400).json({ message: "No OTP request" });

  if (new Date() > reqDoc.otpExpiresAt) return res.status(410).json({ message: "OTP expired" });

  const ok = await bcrypt.compare(String(otp), reqDoc.otpHash);
  if (!ok) return res.status(401).json({ message: "Invalid OTP" });

  const token = jwt.sign({ reqId: reqDoc._id.toString() }, process.env.JWT_SECRET, { expiresIn: "15m" });

  reqDoc.oneTimeToken = token;
  reqDoc.status = "verified";
  await reqDoc.save();

  return res.json({ message: "OTP verified", oneTimeToken: token, requestId: reqDoc._id });
};


