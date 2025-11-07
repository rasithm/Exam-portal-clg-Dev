// controllers/creatorController.js
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import bcrypt from 'bcrypt';

export const creatorLogin = async (req, res) => {
  const { email, password } = req.body;
  if (email !== process.env.CREATOR_EMAIL || password !== process.env.CREATOR_PASSWORD) {
    return res.status(401).json({ message: 'Invalid creator credentials' });
  }
  
  const token = jwt.sign({ role: 'creator', email }, process.env.JWT_SECRET, { expiresIn: '10m' });
  res.json({ token });
};

export const createFirstAdmin = async (req, res) => {
  try {
    const auth = req.headers.authorization?.split(' ')[1];
    if (!auth) return res.status(401).json({ message: 'Creator token required' });

    let decoded;
    try {
      decoded = jwt.verify(auth, process.env.JWT_SECRET);
      if (decoded.role !== 'creator') return res.status(403).json({ message: 'Forbidden' });
    } catch {
      return res.status(401).json({ message: 'Invalid creator token' });
    }

    const { collegeName, collegeTag, adminEmail, adminPassword } = req.body;

    // Strong email pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Strong password check
    if (adminPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }
    if (!/[A-Z]/.test(adminPassword) || !/[a-z]/.test(adminPassword) || !/[0-9]/.test(adminPassword)) {
      return res.status(400).json({ message: "Password must include uppercase, lowercase, and number" });
    }

    // Check if admin already exists
    // const exists = await Admin.findOne({ collegeTag });
    // if (exists) return res.status(400).json({ message: 'Admin already exists for this college' });

    const hashed = await bcrypt.hash(adminPassword, 10);
    const admin = await Admin.create({
      email: adminEmail,
      password: hashed,
      collegeName,
      collegeTag,
      role: "admin"
    });

    res.json({ message: 'Admin created successfully', adminId: admin._id });
  } catch (error) {
    console.error("Error in createFirstAdmin:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

