//C:\Users\nazeer\Desktop\Exam-edit\Exam-portal\Exam-Portal\backend\controllers\forgotController.js
import Student from "../models/Student.js";
import PasswordResetRequest from "../models/PasswordResetRequest.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { sendOtpMail } from "../services/mailer.js";
import Admin from "../models/Admin.js";

const OTP_TTL_MIN = 10; // minutes
const MAX_REQUESTS_WINDOW = 5; // max OTP sends per 30 minutes
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

    const student = await Student.findOne({ rollNumber: regNo });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const inputEmail = email.toLowerCase().trim();

    // ✅ student HAS email
    if (student.email) {
      if (student.email.toLowerCase().trim() !== inputEmail) {
        return res.status(400).json({
          message: "Email does not match registered email"
        });
      }

      const otp = generateOTP();
      const otpHash = await bcrypt.hash(otp, 10);

      const reqDoc = await PasswordResetRequest.create({
        student: student._id,
        rollNumber: regNo,
        requestedEmail: inputEmail,
        otpHash,
        otpExpiresAt: new Date(Date.now() + 10 * 60000),
        status: "otp_sent",
        verified: false
      });

      // await sendOtpMail(inputEmail, "OTP Code", `<b>${otp}</b>`);
      await sendOtpMail(
        inputEmail,
        "Reset Your Password – Exam Portal",
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          
          <h2 style="color: #2c3e50;">Reset Your Password – Exam Portal</h2>
          
          <p>Hi ${student.name || "Student"},</p>
          
          <p>
            We received a request to reset the password for your account associated with 
            <strong>${inputEmail}</strong>.
          </p>
          
          <p>Use the OTP below to reset your password:</p>
          
          <div style="background:#f4f6f8; padding:15px; text-align:center; border-radius:8px; margin:20px 0;">
            <h1 style="letter-spacing:5px; color:#26aa61;">🔐 ${otp}</h1>
          </div>
          
          <p>⏳ This OTP will expire in 30 minutes for security purposes.</p>
          
          <p>
            If you didn't request a password reset, you can safely ignore this email.
            Your password will remain unchanged.
          </p>
          
          <p style="margin-top:30px;">
            Regards,<br>
            <strong>Exam Portal Team</strong>
          </p>
          
        </div>
        `
      );


      return res.json({ requestId: reqDoc._id });
    }

    // ✅ NO EMAIL
    return res.json({
      noEmail: true
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
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

    if (!requestId || !newPassword || !oneTimeToken)
      return res.status(400).json({ message: "Missing data" });

    // ✅ verify token first
    const decoded = jwt.verify(oneTimeToken, process.env.JWT_SECRET);
    if (decoded.reqId !== requestId)
      return res.status(401).json({ message: "Invalid token" });

    // ✅ fetch request doc FIRST
    const reqDoc = await PasswordResetRequest.findById(requestId);

    // ✅ now safe to log
    // console.log("requestId:", requestId);
    // console.log("doc:", reqDoc);

    if (!reqDoc)
      return res.status(404).json({ message: "Request not found" });

    if (!reqDoc.verified)
      return res.status(400).json({ message: "Request not verified" });

    if (reqDoc.used)
      return res.status(400).json({ message: "Already used" });

    // password validation
    if (newPassword.length < 8)
      return res.status(400).json({ message: "Password too weak" });

    const student = await Student.findById(reqDoc.student);
    if (!student)
      return res.status(404).json({ message: "Student not found" });

    student.password = await bcrypt.hash(newPassword, 10);
    await student.save();

    reqDoc.used = true;
    reqDoc.status = "completed";
    await reqDoc.save();

    res.json({ message: "Password updated successfully" });

  } catch (err) {
    console.error("completeReset error:", err);
    res.status(500).json({ message: "Server error" });
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

// export const requestAdminReset = async (req, res) => {
//   const { email, personalEmail } = req.body;

//   const admin = await Admin.findOne({ email, personalEmail });
//   if (!admin) return res.status(404).json({ message: "No matching admin" });

//   const otp = generateOTP();
//   const otpHash = await bcrypt.hash(otp, 10);

//   await PasswordResetRequest.create({
//     admin: admin._id,
//     requestedEmail: personalEmail,
//     otpHash,
//     otpExpiresAt: new Date(Date.now() + 10 * 60000),
//     status: "otp_sent",
//   });

//   await sendOtpMail(personalEmail, "Admin Password Reset OTP", `<p>Your OTP: ${otp}</p>`);
//   res.json({ message: "OTP sent" });
// };

export const requestAdminReset = async (req, res) => {
  try {
    const { email, personalEmail } = req.body;

    if (!email || !personalEmail)
      return res.status(400).json({ message: "Both emails required" });

    const admin = await Admin.findOne({
      email: email.trim().toLowerCase(),
      personalEmail: personalEmail.trim().toLowerCase(),
    });

    if (!admin)
      return res.status(404).json({ message: "No matching admin found" });

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);

    const reqDoc = await PasswordResetRequest.create({
      admin: admin._id,
      requestedEmail: personalEmail,
      otpHash,
      otpExpiresAt: new Date(Date.now() + OTP_TTL_MIN * 60 * 1000),
      status: "otp_sent",
    });

    // await sendOtpMail(
    //   personalEmail,
    //   "Admin Password Reset OTP",
    //   `<p>Your OTP is <b>${otp}</b></p>`
    // );
    await sendOtpMail(
      personalEmail,
      "Admin Password Reset Request – Exam Portal",
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <h2 style="color:#c0392b;">Admin Password Reset Request – Exam Portal</h2>
        
        <p>Dear ${admin.name || "Administrator"},</p>
        
        <p>
          A password reset request has been received for your Administrator account 
          on <strong>Exam Portal</strong>.
        </p>
        
        <p>Use the OTP below to reset your password:</p>
        
        <div style="background:#fff5f5; padding:15px; text-align:center; border-radius:8px; margin:20px 0;">
          <h1 style="letter-spacing:5px; color:#e74c3c;">🔐 ${otp}</h1>
        </div>
        
        <p>⏳ This OTP will expire in 15 minutes for security purposes.</p>
        
        <p>
          If you did not request this reset, please immediately contact your 
          system administrator or IT team, as your account may be at risk.
        </p>
        
        <p style="margin-top:30px;">
          Regards,<br>
          <strong>Exam Portal System Team</strong>
        </p>
        
      </div>
      `
    );


    res.json({
      message: "OTP sent",
      requestId: reqDoc._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


// export const verifyAdminOtp = async (req, res) => {
//   const { email, otp } = req.body;

//   const reqDoc = await PasswordResetRequest.findOne({
//     _id: requestId,
//     purpose: "admin_profile",
//     status: "otp_sent"
//   });


//   if (!reqDoc) return res.status(400).json({ message: "No OTP request" });

//   if (new Date() > reqDoc.otpExpiresAt) return res.status(410).json({ message: "OTP expired" });

//   const ok = await bcrypt.compare(String(otp), reqDoc.otpHash);
//   if (!ok) return res.status(401).json({ message: "Invalid OTP" });

//   const token = jwt.sign({ reqId: reqDoc._id.toString() }, process.env.JWT_SECRET, { expiresIn: "15m" });

//   reqDoc.oneTimeToken = token;
//   reqDoc.status = "verified";
//   await reqDoc.save();

//   return res.json({ message: "OTP verified", oneTimeToken: token, requestId: reqDoc._id });
// };
export const verifyAdminOtp = async (req, res) => {
  try {
    const { requestId, otp } = req.body;

    const reqDoc = await PasswordResetRequest.findById(requestId);

    if (!reqDoc)
      return res.status(404).json({ message: "Request not found" });

    if (reqDoc.status !== "otp_sent")
      return res.status(400).json({ message: "Invalid state" });

    if (new Date() > reqDoc.otpExpiresAt)
      return res.status(410).json({ message: "OTP expired" });

    const ok = await bcrypt.compare(String(otp), reqDoc.otpHash);

    if (!ok)
      return res.status(401).json({ message: "Invalid OTP" });

    const token = jwt.sign(
      { reqId: reqDoc._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    reqDoc.status = "verified";
    reqDoc.oneTimeToken = token;

    await reqDoc.save();

    res.json({
      message: "OTP verified",
      oneTimeToken: token,
      requestId: reqDoc._id,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


export const completeAdminReset = async (req, res) => {
  try {
    const { requestId, newPassword, oneTimeToken } = req.body;

    if (!requestId || !newPassword || !oneTimeToken)
      return res.status(400).json({ message: "Missing data" });

    const decoded = jwt.verify(oneTimeToken, process.env.JWT_SECRET);

    if (decoded.reqId !== requestId)
      return res.status(401).json({ message: "Invalid token" });

    const reqDoc = await PasswordResetRequest.findById(requestId);

    if (!reqDoc || !reqDoc.admin)
      return res.status(404).json({ message: "Invalid request" });

    if (reqDoc.used)
      return res.status(400).json({ message: "Already used" });

    if (newPassword.length < 8)
      return res.status(400).json({ message: "Password too weak" });

    const admin = await Admin.findById(reqDoc.admin);

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    reqDoc.used = true;
    reqDoc.status = "completed";
    await reqDoc.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
