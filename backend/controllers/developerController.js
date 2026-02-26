// controllers/developerController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Developer from "../models/Developer.js";
import Portfolio from "../models/Portfolio.js";
import Student from "../models/Student.js";
import { sendDeveloperMail } from "../utils/sendDeveloperMail.js";
import { findDifferences } from "../utils/diffChecker.js";
import Admin from "../models/Admin.js";

export const createDeveloper = async (req,res) => {
    const {username , email , password} = req.body;
    const hashed = await bcrypt.hash(password, 10);

    await Developer.create({
    username,
    email,
    password: hashed
    });
}
// LOGIN
export const developerLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const dev = await Developer.findOne({ username }).select("+password");
    if (!dev)
      return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, dev.password);
    if (!match)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: dev._id, role: "developer" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("developerToken", token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({ message: "Login successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
};


// GET PORTFOLIO
export const getPortfolio = async (req, res) => {
  const portfolio = await Portfolio.findOne().lean();

  if (!portfolio) {
    return res.json({
      personalInfo: {},
      skills: {},
      projects: [],
      experience: [],
      achievements: []
    });
  }

  res.json(portfolio);
};


// UPDATE PORTFOLIO
export const updatePortfolio = async (req, res) => {
  try {
    const newData = req.body;

    let portfolio = await Portfolio.findOne({
      developer: req.developer._id
    });

    if (!portfolio) {
      portfolio = await Portfolio.create({
        developer: req.developer._id,
        ...newData
      });
    } else {
      const changes = findDifferences(portfolio.toObject(), newData);

      if (changes.length === 0)
        return res.json({ message: "No changes detected" });

      portfolio.personalInfo = newData.personalInfo;
      portfolio.skills = newData.skills;
      portfolio.projects = newData.projects;
      portfolio.experience = newData.experience;
      portfolio.achievements = newData.achievements;

      await portfolio.save();

      let changeSummary = changes.map(c =>
        `<p><b>${c.field}</b>: ${c.oldValue} → ${c.newValue}</p>`
      ).join("");

      const clientIP =
        req.headers["x-forwarded-for"]?.split(",")[0] ||
        req.socket.remoteAddress ||
        "Unknown";

      const userAgent = req.headers["user-agent"] || "Unknown";

      const parseUserAgent = (ua) => {
        let os = "Unknown OS";
        let browser = "Unknown Browser";
        let device = "Desktop";

        if (/Windows/i.test(ua)) os = "Windows";
        if (/Mac/i.test(ua)) os = "MacOS";
        if (/Linux/i.test(ua)) os = "Linux";
        if (/Android/i.test(ua)) os = "Android";
        if (/iPhone|iPad/i.test(ua)) os = "iOS";

        if (/Chrome/i.test(ua)) browser = "Chrome";
        if (/Firefox/i.test(ua)) browser = "Firefox";
        if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
        if (/Edge/i.test(ua)) browser = "Edge";

        if (/Mobi|Android/i.test(ua)) device = "Mobile";

        return { os, browser, device };
      };
      const ua = req.headers["user-agent"] || "";
      const { os, browser, device } = parseUserAgent(ua);

      await sendDeveloperMail(
        "🔔 Portfolio Updated - Security Log",
        `
        <h3>Portfolio Modified</h3>
        ${changeSummary}
        <hr/>
        <h4>System Identification</h4>
        <p><b>IP Address:</b> ${clientIP}</p>
        <p><b>Operating System:</b> ${os}</p>
        <p><b>Browser:</b> ${browser}</p>
        <p><b>Device Type:</b> ${device}</p>
        <p><b>Full User-Agent:</b> ${ua}</p>
        <p><b>Time:</b> ${new Date().toLocaleString()}</p>
        `
      );
    }

    res.json({ message: "Portfolio updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update failed" });
  }
};


// RESET ALERT ONLY
export const triggerResetAlert = async (req, res) => {
  try {
    const clientIP =
        req.headers["x-forwarded-for"]?.split(",")[0] ||
        req.socket.remoteAddress ||
        "Unknown";

      const userAgent = req.headers["user-agent"] || "Unknown";

      const parseUserAgent = (ua) => {
        let os = "Unknown OS";
        let browser = "Unknown Browser";
        let device = "Desktop";

        if (/Windows/i.test(ua)) os = "Windows";
        if (/Mac/i.test(ua)) os = "MacOS";
        if (/Linux/i.test(ua)) os = "Linux";
        if (/Android/i.test(ua)) os = "Android";
        if (/iPhone|iPad/i.test(ua)) os = "iOS";

        if (/Chrome/i.test(ua)) browser = "Chrome";
        if (/Firefox/i.test(ua)) browser = "Firefox";
        if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
        if (/Edge/i.test(ua)) browser = "Edge";

        if (/Mobi|Android/i.test(ua)) device = "Mobile";

        return { os, browser, device };
      };
      const ua = req.headers["user-agent"] || "";
      const { os, browser, device } = parseUserAgent(ua);
    await sendDeveloperMail(
      "⚠️ RESET TRIGGERED - Developer Portfolio",
      `<p>Reset button was triggered.</p>
        <h4>System Identification</h4>
          <p><b>IP Address:</b> ${clientIP}</p>
          <p><b>Operating System:</b> ${os}</p>
          <p><b>Browser:</b> ${browser}</p>
          <p><b>Device Type:</b> ${device}</p>
          <p><b>Full User-Agent:</b> ${ua}</p>
          <p><b>Time:</b> ${new Date().toLocaleString()}</p>`
    );

    res.json({ message: "Reset alert sent" });
  } catch (err) {
    res.status(500).json({ message: "Reset alert failed" });
  }
};


// GET STUDENTS FOR DASHBOARD
export const getStudentsForDeveloper = async (req, res) => {
  try {
    const students = await Student.find().select("-password").lean();
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch students" });
  }
};

export const getAdminsForDeveloper = async (req, res) => {
  try {
    const admins = await Admin.find()
      .select("-password")
      .lean();

    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch admins" });
  }
};

export const toggleAdminStatus = async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    admin.isActive = !admin.isActive;
    await admin.save();

    res.json({
      message: "Admin status updated",
      isActive: admin.isActive
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to update admin" });
  }
};