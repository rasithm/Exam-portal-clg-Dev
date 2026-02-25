// controllers/authController.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Student from '../models/Student.js';
import Session from '../models/Session.js';
import { v4 as uuidv4 } from 'uuid';

const signToken = (id, role) => jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });

export const adminLogin = async (req, res) => {
  try{
    const { email, password } = req.body;
    // --- Creator special login ---
    if (
      email === process.env.CREATOR_EMAIL &&
      password === process.env.CREATOR_PASSWORD
    ) {
      const token = signToken("creator", "creator");
      const sessionId = uuidv4();

      await Session.create({
        userId: "creator",
        role: "creator",
        sessionId,
        active: true,
        ip: req.ip,
        userAgent: req.headers["user-agent"]
      });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === "true",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
      });
      return res.json({ message: "Logged in", role: "creator", sessionId , token});
    }
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ message: 'Invalid credentials' });
    
    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    if (!admin.isActive) {
      return res.status(403).json({ message: "Your account has been disabled by developer." });
    }
    const token = signToken(admin._id.toString(), 'admin');

    // create session (single session handling)
    const sessionId = uuidv4();
    await Session.updateMany({ userId: admin._id.toString(), role: 'admin', sessionId, active:true },{ $set: { active: false } });

    // set HttpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax',
      maxAge: 24*60*60*1000
    });
    res.json({ message: 'Logged in', role: 'admin', sessionId });
  }catch(error){
    console.log(`Error in adminLogin ${error}`)
    res.status(500).json({error : "internel server error"})
  }
};

export const studentLogin = async (req, res) => {
  const { studentId, password } = req.body;
  // const change = await bcrypt.hash("malickbatcha134", 10);
  // console.log(change)
  const student = await Student.findOne({ rollNumber: studentId }).select("+password");
  if (!student.password || student.password.trim() === "") {
    console.error("Student record missing or empty password:", student.rollNumber);
    return res.status(400).json({ message: "Password not set. Please contact admin to reset your account." });
  }

  
  const match = await bcrypt.compare(String(password), String(student.password));
  if (!match) {
    return res.status(401).json({ message: "Password Mismatch" });
  }

  // Prevent login if the student already has an active exam session
  // const activeExam = await ExamSession.findOne({ student: user._id, active: true });
  // if (activeExam) {
  //   return res.status(403).json({ message: "Active exam session found. You cannot log in during an ongoing exam." });
  // }
  const token = signToken(student._id.toString(), 'student');
  const sessionId = uuidv4();
  await Session.updateMany({ userId: student._id.toString(), role: 'student', sessionId, active:true },{ $set: { active: false } });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    maxAge: 24*60*60*1000
  });
  res.json({ message: 'Logged in', role: 'student', sessionId });
};

export const adminLogout = async (req, res) => {
  try {
    // Clear session cookie and deactivate current session if available
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: "lax",
    });

    // Optionally deactivate session
    const token = req.cookies?.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      await Session.updateMany(
        { userId: decoded.id, role: decoded.role },
        { $set: { active: false } }
      );
    }

    return res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error in adminLogout:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const studentLogout = async (req, res) => {
  try {
    // Clear the JWT cookie safely
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: "lax",
    });

    // Deactivate the student's active session (if exists)
    const token = req.cookies?.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      await Session.updateMany(
        { userId: decoded.id, role: decoded.role },
        { $set: { active: false } }
      );
    }

    return res.json({ message: "Student logged out securely" });
  } catch (error) {
    console.error("Error in studentLogout:", error);
    res.status(500).json({ message: "Internal server error during logout" });
  }
};

export const getMe = async (req, res) => {
  res.json({
    authenticated: true,
    role: req.user.role,
  });
};



