// server.js
// import dotenv from 'dotenv';
// dotenv.config();
import 'dotenv/config';

import express from 'express';
import http from 'http';


import connectDB from './config/db.js';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

import creatorRoutes from './routes/creatorRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { initSocket } from './sockets/socketManager.js';
import { protect } from "./middlewares/auth.js";
import examRoutes from "./routes/examRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import studentRoutes from "./routes/studentRoutes.js"
import studentExamRoutes from "./routes/studentExamRoutes.js";
import publicCertificateRoutes from "./routes/publicCertificateRoutes.js";
import forgotRoutes from './routes/forgotRoutes.js';
import compilerExamRoutes from './routes/compilerExamRouter.js'
import studentCompilerExamRouter from './routes/studentCompilerExamRouter.js'
import adminCertificateRoutes from "./routes/adminCertificateRoutes.js";
import adminReportRoutes from "./routes/adminReportRoutes.js";

import developerRoutes from "./routes/developerRoutes.js";

import feedbackRoutes from "./routes/feedbackRoutes.js"


// import { initSocket } from "./sockets/socketManager.js";
const app = express();
const server = http.createServer(app);



// Middlewares
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

const limiter = rateLimit({ windowMs: 60*1000, max: 100 });
app.use(limiter);

// Routes
app.use('/api/creator', creatorRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin',protect(['admin', 'creator']) ,adminRoutes);
app.use("/api/admin/exams", examRoutes);
app.use("/api/admin/questions", protect(["admin"]), questionRoutes);
app.use("/api/student", protect(["student"]), studentRoutes);
app.use("/api/student/exams", protect(["student"]), studentExamRoutes);
app.use("/api/public/certificate", publicCertificateRoutes);
app.use('/api/forgot', forgotRoutes);
app.use("/api/admin/compilerExams", compilerExamRoutes);
app.use("/api/student/compiler-exams", studentCompilerExamRouter);
app.use("/api/admin/certificates", adminCertificateRoutes);
app.use("/api/admin/reports", adminReportRoutes);

app.use("/api/developer", developerRoutes);
app.use("/api/feedback", feedbackRoutes);
// basic health
app.get('/api/health', (req,res) => res.json({ ok: true }));
// Error handler (last middleware)
app.use((err, req, res, next) => {
  console.error("Unexpected error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

let io;
// DB + sockets
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  io = initSocket(server, process.env.FRONTEND_URL || 'http://localhost:5173');
  server.listen(PORT, () => console.log(`Server running on ${PORT}`));
}).catch(err => {
  console.error('DB connection failed', err);
  process.exit(1);
});


export {io};
