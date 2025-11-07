
// backend/controllers/examController.js
import Exam from "../models/Exam.js";
import QuestionSet from "../models/QuestionSet.js";
import { io } from "../sockets/socketManager.js";
import Student from "../models/Student.js";

import ExamSession from "../models/ExamSession.js";
import ExamEvent from "../models/ExamEvent.js";



import ExamAttempt from "../models/ExamAttempt.js";

import crypto from "crypto";

import { v4 as uuidv4 } from "uuid";
/**
 * Create Exam controller
 * Accepts fields in req.body:
 *  - examName, fileName (comma separated or single),
 *  - category, subcategory,
 *  - questionSets ("single-subCategory" | "Multiple-subCategory"),
 *  - startDateTime, endDateTime, duration,
 *  - assignStudents (string comma-separated or array), reassignAllowed, instructions
 *
 * req.user must exist and contain collegeTag and _id
 */
export const createExam = async (req, res) => {
  try {
    const {
      examName,
      fileName,            // comma-separated string of file names (from admin UI)
      category,
      subcategory,
      questionSets,
      startDateTime,
      endDateTime,
      duration,
      assignStudents,
      reassignAllowed,
      instructions,
    } = req.body;

    // --- Basic required fields validation ---
    if (!examName || !category || !startDateTime || !endDateTime) {
      return res.status(400).json({ message: "Missing required fields: examName, category, startDateTime, endDateTime are required." });
    }

    // If single-subCategory mode, subcategory required
    if (questionSets === "single-subCategory" && !subcategory) {
      return res.status(400).json({ message: "subcategory is required when questionSets is 'single-subCategory'." });
    }

    // fileName required (UI should send it; may be comma-separated)
    if (!fileName) {
      return res.status(400).json({ message: "fileName is required to pick question sets (one or many)." });
    }

    // Normalize inputs to avoid mismatch due to spaces/case
    const normalizedCategory = (category || "").toString().trim();
    const normalizedSubcategory = (subcategory || "").toString().trim();
    const fileNamesArray = (fileName || "")
      .toString()
      .split(",")
      .map(fn => fn.trim())
      .filter(Boolean);

    if (!fileNamesArray.length) {
      return res.status(400).json({ message: "No valid fileName items provided." });
    }

    // Validate dates
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    const now = new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format for startDateTime or endDateTime." });
    }

    if (start < now) {
      return res.status(400).json({ message: "Start time cannot be in the past." });
    }
    if (end <= start) {
      return res.status(400).json({ message: "End time must be after start time." });
    }

    
    if (normalizedCategory.toLowerCase() !== "re-assign-exam" && category !== "re-Assign-Exam") {
      const existingExam = await Exam.findOne({
        examName: new RegExp(`^${examName}$`, "i"),
        collegeTag: req.user.collegeTag
      });
      if (existingExam) {
        return res.status(400).json({ message: "Exam name already exists for this admin/college." });
      }
    }

    // Duration: default 120 minutes
    const examDuration = duration ? parseInt(duration, 10) : 120;
    if (isNaN(examDuration) || examDuration <= 0) {
      return res.status(400).json({ message: "Invalid duration. Must be a positive integer (minutes)." });
    }

    if (normalizedCategory.toLowerCase() === "re-assign-exam") {
      const targetExam = await Exam.findOne({
        examName: new RegExp(`^${examName}$`, "i"),
        collegeTag: req.user.collegeTag
      });

      if (!targetExam) {
        return res.status(404).json({ message: "Original exam not found for reassignment." });
      }

      // If no assignStudents provided, allow reassign to all
      let students = [];
      if (!assignStudents || assignStudents.length === 0) {
        // Fetch all students created by this admin
        const allStudents = await Student.find({ admin: req.user._id }).select("rollNumber");
        students = allStudents.map(s => s.rollNumber.toString().trim());
      } else {
        students = Array.isArray(assignStudents)
          ? assignStudents.map(s => s.toString().trim()).filter(Boolean)
          : (assignStudents || "").toString().split(",").map(s => s.trim()).filter(Boolean);
      }

      if (!students.length) {
        return res.status(400).json({ message: "No students found for reassignment." });
      }

      // ✅ Merge reassigned students into main list (avoid duplicates)
      const updatedAssignList = Array.from(new Set([
        ...(targetExam.assignStudents || []),
        ...students
      ]));

      // ✅ Extend exam end date by 2 days
      const extendedEndDate = new Date(targetExam.endDateTime);
      extendedEndDate.setDate(extendedEndDate.getDate() + 2);

      // ✅ Update target exam fields
      targetExam.reassignedStudents = [
        ...(targetExam.reassignedStudents || []),
        ...students
      ];
      targetExam.assignStudents = updatedAssignList;
      targetExam.reassignAllowed = true;
      targetExam.endDateTime = extendedEndDate;
      await targetExam.save();

      // ✅ Emit live updates
      io?.emit("examReassigned", {
        examName: targetExam.examName,
        students,
        by: req.user.email,
        collegeTag: req.user.collegeTag,
      });

      // Dashboard stats update
      const nowTime = new Date();
      const allExams = await Exam.find({ collegeTag: req.user.collegeTag });

      const upcomingCount = allExams.filter(e => new Date(e.startDateTime) > nowTime).length;
      const activeCount = allExams.filter(e => new Date(e.startDateTime) <= nowTime && new Date(e.endDateTime) >= nowTime).length;
      const completedCount = allExams.filter(e => new Date(e.endDateTime) < nowTime).length;
      const reassignCount = allExams.filter(e => (e.category || "").toLowerCase() === "re-assign-exam").length;

      io?.emit("examStatsUpdated", {
        collegeTag: req.user.collegeTag,
        upcomingCount,
        activeCount,
        completedCount,
        reassignCount
      });

      return res.json({
        message: `Exam reassigned successfully (${students.length} students) with extended end date (2 days).`,
        updatedAssignStudents: updatedAssignList,
        extendedEndDate,
      });
    }



   


    // ---- Fetch QuestionSets from DB ----
    // We will build case-insensitive regex filters for fileName, category and optionally subcategory
    const fileRegexes = fileNamesArray.map(fn => new RegExp(`^${fn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")); // escape meta
    const findFilter = {
      fileName: { $in: fileRegexes },
      collegeTag: req.user.collegeTag
    };

    // Category match (case-insensitive)
    if (normalizedCategory) {
      findFilter.category = new RegExp(`^${normalizedCategory.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    }

    // If single-subCategory mode, filter by subcategory too (case-insensitive)
    if (normalizedSubcategory && questionSets === "single-subCategory") {
      findFilter.subcategory = new RegExp(`^${normalizedSubcategory.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    }

    const qSets = await QuestionSet.find(findFilter);

    // Logging for debugging if admin complains
    console.log("[createExam] findFilter =", findFilter);
    console.log("[createExam] matched question sets count =", qSets.length);

    if (!qSets.length) {
      return res.status(400).json({ message: "No valid question sets found for given filters (fileName/category/subcategory/collegeTag)." });
    }

    // Aggregate all questions from matched sets
    let allQuestions = qSets.flatMap(s => s.questions || []);
    // If there are any items with empty question, clean them
    allQuestions = allQuestions.filter(q => q && q.question && q.question.toString().trim().length);
    // const totalMarks = questionsWithMarks.reduce((acc, q) => acc + (q.marks || 0), 0);
    // --- Ensure minimum question coverage ---
    if (allQuestions.length < 60) {
      return res.status(400).json({
        message: `At least 60 total questions are required. Found ${allQuestions.length}.`
      });
    }

    // Deduplicate
    const seen = new Set();
    const uniqueQuestions = [];
    for (const q of allQuestions) {
      const key = q.question?.toString().toLowerCase().trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        uniqueQuestions.push(q);
      }
    }

    // Group by difficulty
    const easyQs = uniqueQuestions.filter(q => (q.mode || "").toLowerCase() === "easy");
    const mediumQs = uniqueQuestions.filter(q => (q.mode || "").toLowerCase() === "medium");
    const hardQs = uniqueQuestions.filter(q => (q.mode || "").toLowerCase() === "hard");

    if (easyQs.length < 20 || mediumQs.length < 20 || hardQs.length < 20) {
      return res.status(400).json({
        message: `Each difficulty level must have at least 20 questions. Found easy=${easyQs.length}, medium=${mediumQs.length}, hard=${hardQs.length}.`
      });
    }

    // ⚠️ Don't limit to 60 now — save all valid questions for this exam
    const questionsWithMarks = uniqueQuestions.map(q => ({
      ...q.toObject(),
      marks: q.mode === "easy" ? 1 : q.mode === "medium" ? 2 : 3,
      type: (q.type || "mcq").toLowerCase()
    }));

    const totalMarks = 100;


    // Assign students parsing (createExam case)
    // Assign students parsing (createExam case)
    let parsedStudents = [];
    if (!assignStudents || assignStudents.length === 0) {
      // Auto-fetch all students created by this admin
      const allStudents = await Student.find({ admin: req.user._id }).select("rollNumber");
      parsedStudents = allStudents.map(s => s.rollNumber.toString().trim());
    } else {
      parsedStudents = Array.isArray(assignStudents)
        ? assignStudents.map(s => s.toString().trim()).filter(Boolean)
        : (assignStudents || "").toString().split(",").map(s => s.trim()).filter(Boolean);
    }



    // Create exam doc
    const newExam = await Exam.create({
      examName: examName.trim(),
      fileName: fileNamesArray.join(", "),
      category: normalizedCategory,
      subcategory: normalizedSubcategory || "",
      questionSets: qSets.map(q => q._id),
      questions: questionsWithMarks,
      totalMarks,
      startDateTime: start,
      endDateTime: end,
      duration: examDuration,
      assignStudents: parsedStudents,
      reassignAllowed: !!reassignAllowed,
      instructions: instructions || "",
      createdBy: req.user._id,
      collegeTag: req.user.collegeTag,
    });

    // Emit event for admin dashboard or other listeners
    io?.emit("newExamCreated", {
      examId: newExam._id,
      examName: newExam.examName,
      category: newExam.category,
      subcategory: newExam.subcategory,
      totalMarks,
      totalQuestions: questionsWithMarks.length,
      start: start,
      createdBy: req.user.email,
      collegeTag: req.user.collegeTag,
    });

    // ---- Dashboard Stats Update ----
    const nowTime = new Date();
    const allExams = await Exam.find({ collegeTag: req.user.collegeTag });

    const upcomingCount = allExams.filter(e => new Date(e.startDateTime) > nowTime).length;
    const activeCount = allExams.filter(e => new Date(e.startDateTime) <= nowTime && new Date(e.endDateTime) >= nowTime).length;
    const completedCount = allExams.filter(e => new Date(e.endDateTime) < nowTime).length;
    const reassignCount = allExams.filter(e => (e.category || "").toLowerCase() === "re-assign-exam").length;

    io?.emit("examStatsUpdated", {
      collegeTag: req.user.collegeTag,
      upcomingCount,
      activeCount,
      completedCount,
      reassignCount
    });


    return res.status(201).json({
      message: "Exam created successfully",
      examId: newExam._id,
      examName: newExam.examName,
      totalQuestions: questionsWithMarks.length,
      totalMarks,
    });

  } catch (err) {
    console.error("Error creating exam:", err);
    return res.status(500).json({ message: "Server error creating exam", error: err.message });
  }
};

export const listExams = async (req, res) => {
  try {
    const exams = await Exam.find({ createdBy: req.user._id })
      .populate("createdBy", "email")
      .sort({ createdAt: -1 });
    res.json(exams);
  } catch (err) {
    console.error("Error fetching exams:", err);
    res.status(500).json({ message: "Failed to fetch exams" });
  }
};

export const startExam = async (req, res) => {
  try {
    const student = req.user._id;
    const exam = req.params.examId;

    // ✅ 1. Check if already active for this exam
    const existingSameExam = await ExamSession.findOne({ student, exam, active: true });
    if (existingSameExam) {
      console.log("✅ Reusing active session:", existingSameExam._id);
      return res.status(200).json({
        message: "Resumed existing session",
        sessionId: existingSameExam._id,
        startTime: existingSameExam.startTime,
        endTime: existingSameExam.endTime,
      });
    }

    // ✅ 2. Prevent multiple active exams
    const otherExamActive = await ExamSession.findOne({ student, active: true, exam: { $ne: exam } });
    if (otherExamActive) {
      return res.status(403).json({ message: "Active exam exists on another exam or device" });
    }

    // ✅ 3. Create new session
    const examDoc = await Exam.findById(exam);
    if (!examDoc) return res.status(404).json({ message: "Exam not found" });

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + (examDoc.duration || 120) * 60 * 1000);
    const token = crypto.randomBytes(32).toString("hex");

    const session = await ExamSession.create({
      student,
      exam,
      sessionToken: token,
      startTime,
      endTime,
      active: true,
      violations: 0,
    });

    console.log("🟢 New session started:", session._id);
    console.log("Session time window:", startTime, "→", endTime);

    return res.status(200).json({
      message: "OK",
      sessionId: session._id,
      token,
      startTime,
      endTime,
    });
  } catch (err) {
    console.error("Start Exam Error:", err);
    return res.status(500).json({ error: "Start failed" });
  }
};







export const getExam = async (req, res) => {
  try {
    const examId = req.params.examId;
    const student = req.user._id;

    const session = await ExamSession.findOne({ student, exam: examId });
    if (!session) return res.status(403).json({ message: "No active session found" });

    // ✅ Check expiration only if endTime is valid
    // ✅ Fix: Grace period + correct time comparison
    console.log({
        now: new Date().toISOString(),
        endTime: session.endTime,
        diffMinutes: (new Date(session.endTime) - new Date()) / (1000 * 60),
      });
    if (session.endTime) {
      // Always compare using UTC timestamps to avoid timezone drift
      const nowUTC = new Date(new Date().toISOString()); // normalized UTC
      const endTimeUTC = new Date(new Date(session.endTime).toISOString());
      console.log("🕒 Now (UTC):", nowUTC);
      console.log("🕒 End (UTC):", endTimeUTC);

      // Allow a 1-minute grace period (network delay, timezone drift, etc.)
      const graceMs = 60 * 1000;

      if (nowUTC.getTime() > endTimeUTC.getTime() + graceMs) {
        session.active = false;
        await session.save();
        console.log(`⏱ Session expired for ${student} | exam ${examId}`);
        return res.status(410).json({ message: "Session expired (time limit reached)" });
      }
    }


    const exam = await Exam.findById(examId).populate({
      path: "questionSets",
      populate: { path: "questions" },
    });
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    // ✅ Shuffle once
    if (!session.shuffledQuestions?.length) {
      const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
      const easy = shuffle(exam.questions.filter((q) => q.mode === "easy")).slice(0, 20);
      const medium = shuffle(exam.questions.filter((q) => q.mode === "medium")).slice(0, 20);
      const hard = shuffle(exam.questions.filter((q) => q.mode === "hard")).slice(0, 20);

      const all = [...easy, ...medium, ...hard];
      session.shuffledQuestions = all.map((q) => q._id);
      await session.save();
    }

    const orderedQuestions = session.shuffledQuestions.map((id) =>
      exam.questions.find((q) => q._id.toString() === id.toString())
    );

    const questions = orderedQuestions.map((q) => ({
      _id: q._id,
      question: q.question,
      options: [...q.options].sort(() => Math.random() - 0.5),
      mode: q.mode,
    }));

    return res.status(200).json({
      title: exam.examName,
      examId,
      duration: exam.duration,
      questions,
    });
  } catch (err) {
    console.error("getExam error:", err);
    return res.status(500).json({ message: "Server error loading exam" });
  }
};


// 🛡️ RECORD CHEATING / VIOLATIONS
export const recordEvent = async (req, res) => {
  try {
    const { sessionId, eventType } = req.body;
    const student = req.user._id;

    await ExamEvent.create({ student, examSessionId: sessionId, eventType });

    const session = await ExamSession.findById(sessionId);
    session.violations++;

    if (session.violations >= 3) {
      session.active = false;
      await session.save();
      return autoSubmit(session, "cheating", res);
    }

    await session.save();
    res.json({ message: "Recorded" });

  } catch {
    res.status(500).json({ message: "Event error" });
  }
};

// 📝 SAVE ANSWER — tax on change
export const saveAnswer = async (req, res) => {
  try {
    const { sessionId, questionId, selectedOption } = req.body;
    const student = req.user._id;

    const session = await ExamSession.findById(sessionId);
    if (!session.active) return res.status(410).json({ message: "Session over" });

    let attempt = await ExamAttempt.findOne({ student, examSessionId: sessionId });
    if (!attempt) attempt = await ExamAttempt.create({ student, examSessionId: sessionId, answers: [] });

    const exist = attempt.answers.find(a => a.questionId.toString() === questionId);
    if (exist) {
      exist.changedAnswer = exist.selectedOption !== selectedOption;
      exist.selectedOption = selectedOption;
    } else {
      attempt.answers.push({ questionId, selectedOption, changedAnswer: false });
    }

    await attempt.save();
    res.json({ message: "Saved" });
  } catch {
    res.status(500).json({ message: "Save failed" });
  }
};

// ✅ SUBMIT MANUAL
export const submitExam = async (req, res) => endExam(req, res, "manual");

// 🚨 AUTO SUBMIT
const autoSubmit = async (session, reason, res) =>
  endExam({ body: { sessionId: session._id, student: session.student }, forceReason: reason }, res, reason);

// 🎯 FINAL EVALUATION
export const endExam = async (req, res, defaultReason) => {
  try {
    const { sessionId, student } = req.body;
    const reason = req.forceReason || defaultReason;

    const session = await ExamSession.findById(sessionId);
    session.active = false;
    await session.save();

    const exam = await Exam.findById(session.exam);
    const attempt = await ExamAttempt.findOne({ student, examSessionId: sessionId });

    let score = 0;
    exam.questions.forEach(q => {
      const a = attempt.answers.find(x => x.questionId.toString() === q._id.toString());
      if (a && a.selectedOption === q.correctAnswer) {
        let m = q.mode === "easy" ? 1 : q.mode === "medium" ? 2 : 3;
        if (a.changedAnswer) m *= 0.8;   // ✅ -20% penalty
        score += m;
      }
    });

    attempt.totalMarks = score;
    attempt.percentage = score;
    attempt.pass = score >= 40;
    attempt.reason = reason;
    await attempt.save();

    res.json({ message: "Finished", score, reason });
  } catch {
    res.status(500).json({ message: "End error" });
  }
};





