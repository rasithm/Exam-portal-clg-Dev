// controllers/developerController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Developer from "../models/Developer.js";
import Portfolio from "../models/Portfolio.js";
import Student from "../models/Student.js";
import { sendDeveloperMail } from "../utils/sendDeveloperMail.js";
import { findDifferences } from "../utils/diffChecker.js";

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
  const portfolio = await Portfolio.findOne({ developer: req.developer._id });

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

      await sendDeveloperMail(
        "Portfolio Updated",
        `<h3>Portfolio Modified</h3>
         ${changeSummary}
         <p>IP: ${req.ip}</p>
         <p>Time: ${new Date().toLocaleString()}</p>`
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
    await sendDeveloperMail(
      "⚠️ RESET TRIGGERED - Developer Portfolio",
      `<p>Reset button was triggered.</p>
       <p>IP: ${req.ip}</p>
       <p>Time: ${new Date().toLocaleString()}</p>`
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