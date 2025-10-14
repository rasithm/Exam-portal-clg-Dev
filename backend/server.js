// server.js
import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

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
