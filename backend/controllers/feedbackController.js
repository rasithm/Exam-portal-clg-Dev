import Feedback from "../models/Feedback.js";
import nodemailer from "nodemailer";

export const submitFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.create(req.body);

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false,
        auth: {
            user: process.env.EMAIL_FROM,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailContent = `
New Feedback Received:

Name: ${feedback.name}
Email: ${feedback.email}
Type: ${feedback.type}
Page URL: ${feedback.pageUrl}
Message: ${feedback.message}

Last 5 Pages:
${feedback.lastVisitedPages?.join("\n")}

Screen: ${feedback.screenSize}
Device: ${feedback.deviceType}
OS: ${feedback.os}
Browser: ${feedback.browser}
Time: ${feedback.timestamp}
`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: "mohamedrasith134@gmail.com, examportal134@gmail.com",
      subject: "New Feedback Received",
      text: mailContent,
    });

    res.status(200).json({ message: "Feedback stored & email sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error submitting feedback" });
  }
};