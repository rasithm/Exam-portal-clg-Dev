// controllers/adminController.js
import Student from '../models/Student.js';
import csv from 'csvtojson';
import xlsx from "xlsx"; // ⬅️ add this import

import fs from 'fs';
import bcrypt from 'bcrypt';
import { getOnlineStudentsForAdmin } from '../sockets/socketManager.js';
import Exam from '../models/Exam.js'
import CompilerExam from '../models/CompilerExam.js';
import ExamSession from '../models/ExamSession.js';
import ExamAttempt from "../models/ExamAttempt.js";
import CompilerExamAttempt from "../models/CompilerExamAttempt.js";
import nodemailer from "nodemailer";
/**
 * Create single student by admin
 * POST /api/admin/students
 
 * BODY: { studentId, name, password, email, department, year, whatsapp_no, phone_no, domain }
 */
const validateStudentData = ({ rollNumber, name, email, phone_no, whatsapp_no }) => {
  const errors = [];
  if (!/^[a-zA-Z0-9]+$/.test(rollNumber)) errors.push("Invalid roll number format");
  if (email && !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) errors.push("Invalid email format");
  if (phone_no && !/^\d{10}$/.test(phone_no)) errors.push("Invalid phone number (10 digits required)");
  if (whatsapp_no && !/^\d{10}$/.test(whatsapp_no)) errors.push("Invalid WhatsApp number (10 digits required)");
  if (/<|>|script/i.test(name)) errors.push("Invalid characters in name");
  return errors;
};

export const createStudent = async (req, res) => {
  try {
    const adminId = req.user && req.user._id;
    if (!adminId) return res.status(403).json({ message: 'Admin not found in request' });

    const { studentId, name, password, email, department, year, whatsapp_no, phone_no, domain } = req.body;
    if (!studentId || !name) return res.status(400).json({ message: 'studentId and name are required' });

    // strong minimal validation
    if (typeof studentId !== 'string' || typeof name !== 'string') {
      return res.status(400).json({ message: 'Invalid data types' });
    }
    const validationErrors = validateStudentData({ rollNumber: studentId, name, email, phone_no, whatsapp_no });
    if (validationErrors.length) {
      return res.status(400).json({ message: "Validation failed", errors: validationErrors });
    }


    const hashed = await bcrypt.hash(password || `pass${Math.random().toString(36).slice(2, 8)}`, 10);

    const st = await Student.create({
      admin: adminId,
      rollNumber: String(studentId).trim(),
      name: String(name).trim(),
      password: hashed,
      email,
      department,
      year,
      whatsapp_no,
      phone_no,
      domain
    });

    res.json({ message: 'Student created', student: { id: st._id, rollNumber: st.rollNumber } });
  } catch (err) {
    console.error('createStudent error', err);
    if (err.code === 11000) return res.status(400).json({ message: 'Student with same roll number already exists' });
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * DELETE /api/admin/students/:id
 * Delete a specific student (admin only)
 */
export const deleteStudent = async (req, res) => {
  try {
    const adminId = req.user && req.user._id;
    if (!adminId) return res.status(403).json({ message: "Not authorized" });

    const { id } = req.params;

    const student = await Student.findOne({ _id: id, admin: adminId });
    if (!student) {
      return res.status(404).json({ message: "Student not found or not under this admin" });
    }

    await Student.deleteOne({ _id: id });

    res.json({ message: "Student deleted successfully", id });
  } catch (err) {
    console.error("deleteStudent error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};


/**
 * Upload students CSV - strict validation: if any row misses required fields, abort and return errors.
 * POST /api/admin/students/upload  (multipart form-data with key 'file')
 */
export const uploadStudentsCSV = async (req, res) => {
  try {
    const adminId = req.user && req.user._id;
    if (!adminId) return res.status(403).json({ message: "Admin not found in request" });

    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const filePath = req.file.path;
    const ext = filePath.split(".").pop().toLowerCase();

    // Parse file based on type
    let rows = [];
    if (ext === "csv") {
      rows = await csv().fromFile(filePath);
    } else {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    }

    const created = [];
    const failed = [];
    const warnings = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const line = i + 2; // skip header

      const regno = String(row.regno || "").trim();
      const name = String(row.name || "").trim();
      const password = row.password ? String(row.password).trim() : "ajce@123";
      const email = row.emailID || row.email || "";
      const department = row.department || "";
      const whatsapp_no = row.whatsapp_no || "";
      const year = row["Academic Year"] || row.academic_year || "";
      const phone_no = row.phone_no || "";

      // ✅ Mandatory regno
      if (!regno) {
        failed.push({ row: line, error: "Missing regno" });
        continue;
      }

      // ✅ Regno format (12 digits)
      const regPattern = /^\d{12}$/;
      if (!regPattern.test(regno)) {
        failed.push({ row: line, regno, error: "Invalid regno format" });
        continue;
      }

      // ✅ Duplicate check
      const exists = await Student.findOne({ admin: adminId, rollNumber: regno });
      if (exists) {
        warnings.push({ row: line, regno, message: "Student already exists - skipped" });
        continue;
      }

      // ✅ Create new student
      try {
        const hashed = await bcrypt.hash(password, 10);
        const st = await Student.create({
          admin: adminId,
          rollNumber: regno,
          name: name || "Unknown",
          password: hashed,
          email,
          department,
          year,
          whatsapp_no,
          phone_no
        });
        created.push(regno);
      } catch (err) {
        failed.push({ row: line, regno, error: err.message });
      }
    }

    fs.unlinkSync(filePath);

    return res.json({
      message: "File processed",
      createdCount: created.length,
      created,
      failedCount: failed.length,
      failed,
      warningsCount: warnings.length,
      warnings
    });
  } catch (err) {
    console.error("uploadStudentsCSV error:", err);
    return res.status(500).json({ message: "Server error while processing file" });
  }
};



/**
 * GET /api/admin/students
 * Query: ?page=1&limit=10
 * Returns paginated students for this admin with online flag
 */
export const listStudents = async (req, res) => {
  try {
    const adminId = req.user && req.user._id;
    if (!adminId) return res.status(403).json({ message: 'Not authorized' });

    const page = Math.max(1, parseInt(req.query.page || '1'));
    const limit = Math.min(200, parseInt(req.query.limit || '10'));
    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      Student.find({ admin: adminId }).sort({ rollNumber: 1 }).skip(skip).limit(limit).lean(),
      Student.countDocuments({ admin: adminId })
    ]);

    // online set
    const onlineSet = getOnlineStudentsForAdmin(adminId); // set of identifiers (we assume rollNumber strings)

    const mapped = students.map(s => ({
      id: s._id,
      rollNumber: s.rollNumber,
      name: s.name,
      email: s.email,
      department: s.department,
      year: s.year,
      whatsapp_no: s.whatsapp_no,
      phone_no: s.phone_no,
      online: onlineSet.has(String(s.rollNumber)) || onlineSet.has(String(s._id))
    }));

    res.json({ students: mapped, total, page, limit });
  } catch (err) {
    console.error('listStudents error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};



export const getDashboardStats = async (req, res) => {
  try {
    const adminId = req.user._id;

    /* -----------------------------
       Exams count
    ----------------------------- */
    const mcq = await Exam.find({ createdBy: adminId });
    const comp = await CompilerExam.find({ createdBy: adminId });

    const now = new Date();
    const all = [...mcq, ...comp];

    const active = all.filter(e =>
      new Date(e.endTime || e.endDateTime) > now
    ).length;

    const completed = all.length - active;

    /* -----------------------------
       Violations count (REAL)
       count only auto-submitted due to violation
    ----------------------------- */

    const mcqExamIds = mcq.map(e => e._id);
    const compExamIds = comp.map(e => e._id);

    const mcqViolations = await ExamAttempt.countDocuments({
      reason: "violation",
      examSessionId: {
        $in: await ExamSession.find({ exam: { $in: mcqExamIds } })
          .distinct("_id")
      }
    });

    const compilerViolations = await CompilerExamAttempt.countDocuments({
      reason: "violation",
      exam: { $in: compExamIds }
    });

    const violations = mcqViolations + compilerViolations;

    /* ----------------------------- */

    res.json({
      activeExams: active,
      completedExams: completed,
      violations
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Stats fetch failed" });
  }
};



/**
 * GET /api/admin/students/export
 * Export admin students as CSV
 */
export const exportStudentsCSV = async (req, res) => {
  try {
    const adminId = req.user && req.user._id;
    if (!adminId) return res.status(403).json({ message: 'Not authorized' });

    const students = await Student.find({ admin: adminId }).lean();

    const data = students.map((s, i) => ({
      s_no: i + 1,
      name: s.name || "",
      regno: s.rollNumber || "",
      department: s.department || "",
      emailID: s.email || "",
      whatsapp_no: s.whatsapp_no || "",
      academic_year: s.year || "",
      phone_no: s.phone_no || ""
    }));

    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Students");

    const buf = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=students_export.xlsx');
    res.send(buf);
  } catch (err) {
    console.error('exportStudentsCSV error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};


/**
 * GET /api/admin/students/template
 * Download example template
 */
export const downloadTemplate = async (req, res) => {
  try {
    const data = [
      {
        s_no: 1,
        name: "Rasith",
        regno: "311823205030",
        password: "changeme123",
        department: "Information Technology",
        emailID: "rasith@college.edu",
        whatsapp_no: "9344533082",
        academic_year: "3",
        phone_no: "9344533082"
      },
      {
        s_no: 2,
        name: "Sara",
        regno: "311823205031",
        password: "",
        department: "Computer Science",
        emailID: "sara@college.edu",
        whatsapp_no: "9876543210",
        academic_year: "2",
        phone_no: "9876543210"
      }
    ];

    // Convert to worksheet
    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Template");

    // Convert to buffer
    const buf = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

    // Send as file
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=students_template.xlsx"
    );
    res.send(buf);
  } catch (err) {
    console.error("downloadTemplate error", err);
    res.status(500).json({ message: "Failed to generate template" });
  }
};




const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


export const getStudentById = async (req, res) => {
  const student = await Student.findById(req.params.id).select("-password");
  res.json(student);
};


export const updateStudentEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const oldEmail = student.email;
    const newEmail = email;

    if (oldEmail === newEmail)
      return res.json({ message: "Email unchanged" });

    student.email = newEmail;
    await student.save();

    // 📩 Mail old email
    if (oldEmail) {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: oldEmail,
        subject: "Email Address Updated",
        html: `
          <p>Hello ${student.name},</p>
          <p>Your personal email has been changed to <b>${newEmail}</b>.</p>
          <p>If this was not you, contact support immediately.</p>
        `,
      });
    }

    // 📩 Mail new email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: newEmail,
      subject: "Email Update Confirmation",
      html: `
        <p>Hello ${student.name},</p>
        <p>Your email has been successfully updated from <b>${oldEmail || "N/A"}</b> to <b>${newEmail}</b>.</p>
        <p>Welcome aboard 🚀</p>
      `,
    });

    res.json({ message: "Email updated & notifications sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update email" });
  }
};



