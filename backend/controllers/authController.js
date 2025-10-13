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
  const student = await Student.findOne({ rollNumber: studentId });
  if (!student) return res.status(401).json({ message: 'Invalid credentials' });
  const match = await bcrypt.compare(password, student.password);
  if (!match) return res.status(401).json({ message: 'Invalid credentials' });

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


