//C:\Users\nazeer\Desktop\Exam-edit\Exam-portal\Exam-Portal\backend\services\mailer.js
import nodemailer from "nodemailer";

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (!process.env.EMAIL_HOST) {
    throw new Error("EMAIL_HOST missing — dotenv not loaded");
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  transporter.verify((error, success) => {
    if (error) {
      console.error("SMTP Error:", error);
    } else {
      console.log("SMTP Server is ready");
    }
  });

  return transporter;
};

export const sendOtpMail = async (to, subject, html) => {
  const t = getTransporter();
  return t.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
};

