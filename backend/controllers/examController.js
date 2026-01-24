
// backend/controllers/examController.js
import Exam from "../models/Exam.js"; 
import QuestionSet from "../models/QuestionSet.js";
import { io } from "../sockets/socketManager.js";
import Student from "../models/Student.js";

import ExamSession from "../models/ExamSession.js";
import ExamEvent from "../models/ExamEvent.js";
import CompilerExam from "../models/CompilerExam.js"

import CompilerExamAttempt from "../models/CompilerExamAttempt.js";

import ExamAttempt from "../models/ExamAttempt.js";

import crypto from "crypto";

import { v4 as uuidv4 } from "uuid";


import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { Readable } from "stream";
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
      negativeMarkingEnabled,
      generateCertificate,
      sameMarkForAll,
      markPerQuestion,
      questionCount,
      easyMark,
      mediumMark,
      hardMark,
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
    allQuestions = allQuestions.filter(
      q => q && q.question && q.question.toString().trim().length
    );

    // ✅ EXTRA SAFETY: filter questions by subcategory (if single-subCategory mode)
    // This uses any of: q.subcategory, q.subCategory, or q["sub category"]
    if (questionSets === "single-subCategory" && normalizedSubcategory) {
      const subRegex = new RegExp(
        `^${normalizedSubcategory.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        "i"
      );

      allQuestions = allQuestions.filter((q) => {
        const qSub1 = (q.subcategory || "").toString().trim();
        const qSub2 = (q.subCategory || "").toString().trim();
        const qSub3 = (q["sub category"] || "").toString().trim();

        return (
          (qSub1 && subRegex.test(qSub1)) ||
          (qSub2 && subRegex.test(qSub2)) ||
          (qSub3 && subRegex.test(qSub3))
        );
      });
    }
    

    if (allQuestions.length < 60) {
      return res.status(400).json({
        message: `At least 60 total questions are required. Found ${allQuestions.length}.`
      });
    }

    // Deduplicate by question text
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

    

    // 🔢 Per-difficulty marks
    const easyM = Number(easyMark);
    const medM = Number(mediumMark);
    const hardM = Number(hardMark);

    const sameMarks = !!sameMarkForAll;
    const markAll = Number(markPerQuestion) > 0 ? Number(markPerQuestion) : 1;

    const easyMarksPerQ = !sameMarks
      ? (!isNaN(easyM) && easyM > 0 ? easyM : 1)
      : markAll;
    const mediumMarksPerQ = !sameMarks
      ? (!isNaN(medM) && medM > 0 ? medM : 2)
      : markAll;
    const hardMarksPerQ = !sameMarks
      ? (!isNaN(hardM) && hardM > 0 ? hardM : 3)
      : markAll;

    // ✅ Store *ALL* questions in the exam with marks
    const questionsWithMarks = uniqueQuestions.map((q) => {
      let marks = easyMarksPerQ;
      const mode = (q.mode || "").toLowerCase();
      if (mode === "medium") marks = mediumMarksPerQ;
      if (mode === "hard") marks = hardMarksPerQ;

      return {
        ...q.toObject(),
        marks,
        type: (q.type || "mcq").toLowerCase(),
      };
    });

    // 🎯 How many questions per exam sitting?
    const requestedCount = Number(questionCount);
    const actualQuestionCount =
      requestedCount && requestedCount > 0
        ? Math.min(requestedCount, questionsWithMarks.length)
        : questionsWithMarks.length;

    // Compute totalMarks = max marks for ONE ATTEMPT (using difficulty distribution)
    let totalMarks;
    if (requestedCount && requestedCount > 0) {
      const base = Math.floor(actualQuestionCount / 3);
      const remainder = actualQuestionCount - base * 3;

      const counts = { easy: base, medium: base, hard: base };
      if (remainder === 1) counts.medium += 1;
      if (remainder === 2) {
        counts.medium += 1;
        counts.hard += 1;
      }

      if (sameMarks) {
        totalMarks = actualQuestionCount * markAll;
      } else {
        totalMarks =
          counts.easy * easyMarksPerQ +
          counts.medium * mediumMarksPerQ +
          counts.hard * hardMarksPerQ;
      }
    } else {
      // no questionCount → take all questions
      totalMarks = questionsWithMarks.reduce(
        (acc, q) => acc + (q.marks || 0),
        0
      );
    }

    


    // Assign students parsing (createExam case)
    let parsedStudents = [];
    if (!assignStudents || assignStudents.length === 0) {
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
      questions: questionsWithMarks,                 // ✅ all questions
      totalMarks,                                    // ✅ marks per sitting
      questionCount: actualQuestionCount,            // ✅ how many per attempt
      startDateTime: start,
      endDateTime: end,
      duration: examDuration,
      assignStudents: parsedStudents,
      reassignAllowed: !!reassignAllowed,
      instructions: instructions || "",
      createdBy: req.user._id,
      collegeTag: req.user.collegeTag,
      negativeMarkingEnabled: negativeMarkingEnabled !== false,
      generateCertificate: !!generateCertificate,

      sameMarkForAll: sameMarks,
      markPerQuestion: sameMarks ? markAll : undefined,
      easyMarkPerQuestion: !sameMarks ? easyMarksPerQ : undefined,
      mediumMarkPerQuestion: !sameMarks ? mediumMarksPerQ : undefined,
      hardMarkPerQuestion: !sameMarks ? hardMarksPerQ : undefined,
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

// ✅ AUTO EXPIRE SESSION HELPER
const autoExpireSession = async (session) => {
  if (!session || !session.active) return;

  const now = new Date();

  if (session.endTime && now > session.endTime) {
    session.active = false;
    await session.save();
  }
};


export const startExam = async (req, res) => {
  try {
    const student = req.user._id;
    const exam = req.params.examId;

    // ✅ 1. Check if already active for this exam
    // const existingSameExam = await ExamSession.findOne({ student, exam, active: true });
    // if (existingSameExam) {
    //   console.log("✅ Reusing active session:", existingSameExam._id);
    //   return res.status(200).json({
    //     message: "Resumed existing session",
    //     sessionId: existingSameExam._id,
    //     startTime: existingSameExam.startTime,
    //     endTime: existingSameExam.endTime,
    //   });
    // }
    // ✅ Check if active session exists
    let existingSameExam = await ExamSession.findOne({ student, exam, active: true });

    if (existingSameExam) {
      const now = new Date();

      // 🔥 AUTO EXPIRE CHECK
      if (existingSameExam.endTime && now > existingSameExam.endTime) {
        console.log("⏰ Session expired automatically → deactivating");

        existingSameExam.active = false;
        await existingSameExam.save();

        existingSameExam = null; // allow new session
      }
    }

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
    const otherExamActive = await ExamSession.findOne({ student, active: true });
    if (otherExamActive) {
      return res.status(403).json({ message: "You already have an active exam session on another device or browser." });
    }


    // ✅ 3. Create new session
    const examDoc = await Exam.findById(exam);
    const CompilerExamDoc = await CompilerExam.findById(exam);
    if (!examDoc && !CompilerExamDoc) return res.status(404).json({ message: "Exam not found" });

    const startTime = new Date();
    const duration = examDoc?.duration || CompilerExamDoc?.duration || 120;

    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

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

    const now = new Date();
    if (session.endTime && now > session.endTime) {
      session.active = false;
      await session.save();

      return res.status(410).json({ message: "Session expired (time limit reached)" });
    }

    const attempt = await ExamAttempt.findOne({
      student,
      examSessionId: session._id,
    });

    const savedAnswers = {};
    if (attempt && Array.isArray(attempt.answers)) {
      attempt.answers.forEach((a) => {
        if (a.questionId && a.selectedOption != null) {
          savedAnswers[a.questionId.toString()] = a.selectedOption;
        }
      });
    }


    // ⏰ expiry check (keep as you wrote – looks good)
    if (session.endTime) {
      const nowUTC = new Date(new Date().toISOString());
      const endTimeUTC = new Date(new Date(session.endTime).toISOString());
      const graceMs = 60 * 1000;

      if (nowUTC.getTime() > endTimeUTC.getTime() + graceMs) {
        session.active = false;
        await session.save();
        return res.status(410).json({ message: "Session expired (time limit reached)" });
      }
    }

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    // ✅ Select random questions with difficulty distribution ONCE per session
    if (!session.shuffledQuestions || session.shuffledQuestions.length === 0) {
      const allQuestions = exam.questions || [];
      if (!allQuestions.length) {
        return res.status(400).json({ message: "Exam has no questions configured." });
      }

      const totalAvailable = allQuestions.length;
      const requested = exam.questionCount && exam.questionCount > 0
        ? Math.min(exam.questionCount, totalAvailable)
        : totalAvailable;

      const easyIds = allQuestions
        .filter(q => (q.mode || "").toLowerCase() === "easy")
        .map(q => q._id);
      const mediumIds = allQuestions
        .filter(q => (q.mode || "").toLowerCase() === "medium")
        .map(q => q._id);
      const hardIds = allQuestions
        .filter(q => (q.mode || "").toLowerCase() === "hard")
        .map(q => q._id);

      const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
      const pick = (arr, n) => shuffle(arr).slice(0, Math.min(n, arr.length));

      // Same distribution logic as createExam
      const base = Math.floor(requested / 3);
      const remainder = requested - base * 3;

      const counts = { easy: base, medium: base, hard: base };
      if (remainder === 1) counts.medium += 1;
      if (remainder === 2) {
        counts.medium += 1;
        counts.hard += 1;
      }

      let selectedIds = [
        ...pick(easyIds, counts.easy),
        ...pick(mediumIds, counts.medium),
        ...pick(hardIds, counts.hard),
      ];

      if (selectedIds.length < requested) {
        const remaining = requested - selectedIds.length;
        const used = new Set(selectedIds.map(id => id.toString()));
        const leftoverPool = allQuestions
          .filter(q => !used.has(q._id.toString()))
          .map(q => q._id);
        selectedIds = [...selectedIds, ...pick(leftoverPool, remaining)];
      }

      session.shuffledQuestions = selectedIds;
      await session.save();
    }

    const orderedQuestions = session.shuffledQuestions
    .map(id => exam.questions.id(id))
    .filter(Boolean);


    const questions = orderedQuestions.map((q) => ({
      _id: q._id,
      question: q.question,
      options: q.options,
      mode: q.mode,
      type: q.type,
    }));

    return res.status(200).json({
      title: exam.examName,
      examId,
      duration: exam.duration,
      sessionEndTime: session.endTime,      // ✅ NEW
      serverTime: new Date(), 
      questions,
      answers: savedAnswers,
    });

  } catch (err) {
    console.error("getExam error:", err);
    return res.status(500).json({ message: "Server error loading exam" });
  }
};



// 🛡️ RECORD CHEATING / VIOLATIONS
export const recordEvent = async (req, res) => {
  try {
    const { sessionId, eventType } = req.body; // eventType: "fullscreen_exit" | "tab_switch"
    const student = req.user._id;

    await ExamEvent.create({ student, examSessionId: sessionId, eventType });

    const session = await ExamSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    session.violations++;

    if (session.violations >= 3) {
      session.active = false;
      await session.save();
      return autoSubmit(session, "violation", res);
    }

    await session.save();
    res.json({ message: "Recorded" });
  } catch (err) {
    console.error("Event error", err);
    res.status(500).json({ message: "Event error" });
  }
};


// 📝 SAVE ANSWER — tax on change
export const saveAnswer = async (req, res) => {
  try {
    const { sessionId, questionId, selectedOption } = req.body;
    const student = req.user._id;

    const session = await ExamSession.findById(sessionId);
    if (!session || !session.active) {
      return res.status(410).json({ message: "Session over" });
    }

    // ✅ Load exam & question to normalize selected option
    const exam = await Exam.findById(session.exam);
    let finalSelectedText = selectedOption;

    if (exam) {
      const q = exam.questions.id(questionId); // mongoose subdoc lookup
      if (q && Array.isArray(q.options)) {
        const raw = selectedOption;

        // case 1: numeric index ("0", 0, "1", etc.)
        if (
          typeof raw === "number" ||
          (typeof raw === "string" && /^[0-9]+$/.test(raw.trim()))
        ) {
          const idx = Number(raw);
          if (idx >= 0 && idx < q.options.length) {
            finalSelectedText = q.options[idx];
          }
        } else if (typeof raw === "string") {
          const val = raw.trim();

          // case 2: letter A/B/C/D… → 0/1/2/3
          const upper = val.toUpperCase();
          if (upper.length === 1 && upper >= "A" && upper <= "Z") {
            const idx = upper.charCodeAt(0) - 65;
            if (idx >= 0 && idx < q.options.length) {
              finalSelectedText = q.options[idx];
            }
          } else {
            // case 3: full option text → keep as is, but trim
            const exactMatch = q.options.find(
              (opt) =>
                opt &&
                opt.toString().trim() === val
            );
            if (exactMatch) {
              finalSelectedText = exactMatch;
            } else {
              // if no exact match, still store the raw text
              finalSelectedText = val;
            }
          }
        }
      }
    }

    let attempt = await ExamAttempt.findOne({ student, examSessionId: sessionId });
    if (!attempt) {
      attempt = await ExamAttempt.create({
        student,
        examSessionId: sessionId,
        answers: [],
      });
    }

    const exist = attempt.answers.find(
      (a) => a.questionId.toString() === questionId
    );

    if (exist) {
      exist.changedAnswer = exist.selectedOption !== finalSelectedText;
      exist.selectedOption = finalSelectedText;
    } else {
      attempt.answers.push({
        questionId,
        selectedOption: finalSelectedText, // ✅ always TEXT
        changedAnswer: false,
      });
    }
    // ✅ REAL submission time
    attempt.submittedAt = new Date();

    // ✅ REAL time taken
    attempt.timeTakenSeconds = Math.max(
      0,
      (attempt.submittedAt - session.startTime) / 1000
    );

    await attempt.save();
    res.json({ message: "Saved" });
  } catch (err) {
    console.error("Save failed", err);
    res.status(500).json({ message: "Save failed" });
  }
};

// backend/controllers/examController.js

// Helper: get correct option TEXT from a question
const getCorrectOptionText = (q) => {
  if (!q || !Array.isArray(q.options) || !q.options.length) return null;

  const raw = q.correctAnswer;
  if (raw === undefined || raw === null) return null;

  const rawStr = String(raw).trim();

  // 1) If numeric index
  if (/^[0-9]+$/.test(rawStr)) {
    const idx = Number(rawStr);
    if (idx >= 0 && idx < q.options.length) {
      return q.options[idx];
    }
  }

  // 2) If letter A/B/C/D/...
  const upper = rawStr.toUpperCase();
  if (upper.length === 1 && upper >= "A" && upper <= "Z") {
    const idx = upper.charCodeAt(0) - 65;
    if (idx >= 0 && idx < q.options.length) {
      return q.options[idx];
    }
  }

  // 3) Treat as full option text
  const textMatch = q.options.find(
    (opt) => opt && opt.toString().trim() === rawStr
  );
  if (textMatch) return textMatch;

  // If nothing matches, consider this question misconfigured
  return null;
};




export const finalizeExam = async (sessionId, studentId, reason) => {
  const session = await ExamSession.findById(sessionId);
  if (!session) throw new Error("Session not found");

  session.active = false;
  await session.save();

  const exam = await Exam.findById(session.exam);
  if (!exam) throw new Error("Exam not found");

  let attempt = await ExamAttempt.findOne({
    student: studentId,
    examSessionId: sessionId,
  });

  if (!attempt) {
    attempt = await ExamAttempt.create({
      student: studentId,
      examSessionId: sessionId,
      answers: [],
    });
  }

  // ✅ Only questions actually used in this sitting
  const selectedIdStrings = (session.shuffledQuestions || []).map((id) =>
    id.toString()
  );
  const selectedSet = new Set(selectedIdStrings);

  const usedQuestions = exam.questions.filter((q) =>
    selectedSet.has(q._id.toString())
  );

  // --- stats for student development / report ---
  let score = 0;
  let attempted = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let easyCorrect = 0;
  let mediumCorrect = 0;
  let hardCorrect = 0;

  let easyMarks = 0;
  let mediumMarks = 0;
  let hardMarks = 0;
  let graceCount = 0;

  // max marks for THIS attempt (sum of marks of selected questions)
  const maxMarks = usedQuestions.reduce(
    (acc, q) => acc + (q.marks || 0),
    0
  );

  usedQuestions.forEach((q) => {
    const a = attempt.answers.find(
      (x) => x.questionId.toString() === q._id.toString()
    );
    if (!a) {
      // not answered → 0 marks, count as unattempted
      return;
    }

    attempted++;

    const correctOptionText = getCorrectOptionText(q);
    const baseMode = (q.mode || "").toLowerCase();
    const baseMarks =
      q.marks ||
      (baseMode === "easy" ? 1 : baseMode === "medium" ? 2 : 3);

    if (!correctOptionText) {
      // ✅ GRACE: misconfigured question → full marks to everyone
      score += baseMarks;
      graceCount++;

      if (baseMode === "easy") easyMarks += baseMarks;
      else if (baseMode === "medium") mediumMarks += baseMarks;
      else if (baseMode === "hard") hardMarks += baseMarks;

      return;
    }


    const chosen = (a.selectedOption || "").toString().trim();
    const correct = correctOptionText.toString().trim();

    if (chosen === correct) {
      let m =
        q.marks ||
        (q.mode === "easy"
          ? 1
          : q.mode === "medium"
          ? 2
          : 3);

      if (
        exam.negativeMarkingEnabled !== false &&
        a.changedAnswer &&
        (q.type || "mcq") === "mcq"
      ) {
        m *= 0.8; // 20% penalty
      }

      score += m;
      correctCount++;

      const mode = (q.mode || "").toLowerCase();
      if (mode === "easy") {
        easyCorrect++;
        easyMarks += m;
      } else if (mode === "medium") {
        mediumCorrect++;
        mediumMarks += m;
      } else if (mode === "hard") {
        hardCorrect++;
        hardMarks += m;
      }
    } else {
      wrongCount++;
    }

  });

  const percentage = maxMarks > 0 ? (score / maxMarks) * 100 : 0;

  attempt.totalMarks = score;   // obtained marks
  attempt.maxMarks = maxMarks;  // possible marks for this attempt
  attempt.percentage = percentage;
  attempt.pass = percentage >= 40;   // ✅ pass if ≥ 40%
  attempt.reason = reason;

  // ✅ store stats for reports / student development
  attempt.stats = {
    totalQuestions: usedQuestions.length,
    attempted,
    correct: correctCount,
    wrong: wrongCount,
    easyCorrect,
    mediumCorrect,
    hardCorrect,
    easyMarks,
    mediumMarks,
    hardMarks,
    graceCount,
  };


    // ✅ certificate eligibility
  if (exam.generateCertificate && attempt.pass) {
    attempt.certificateEligible = true;

    // ✅ generate ONE stable certificateId
    if (!attempt.certificateId) {
      const shortSession = session._id.toString().slice(-6).toUpperCase();
      const random = Math.random().toString(36).slice(-4).toUpperCase();
      attempt.certificateId = `CERT:MCQ-${shortSession}-${random}`;
    }
  }


  await attempt.save();

  // keep simple score history on Student for dashboard
  await Student.findByIdAndUpdate(studentId, {
    $push: {
      scores: {
        examId: exam._id.toString(),
        score,
        percentage,
        date: new Date(),
      },
    },
  });

  return { score, percentage, pass: attempt.pass };
};

// ✅ MANUAL SUBMIT
export const submitExam = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const studentId = req.user._id;

    const result = await finalizeExam(sessionId, studentId, "manual");
    return res.json({
      message: "Finished",
      ...result,
      reason: "manual",
    });
  } catch (err) {
    console.error("Submit error", err);
    return res.status(500).json({ message: "End error" });
  }
};

// 🚨 AUTO-SUBMIT (violation / timeout)
const autoSubmit = async (session, reason, res) => {
  try {
    const result = await finalizeExam(session._id, session.student, reason);
    return res.json({
      message: "Finished (auto)",
      ...result,
      reason,
    });
  } catch (err) {
    console.error("Auto submit error", err);
    return res.status(500).json({ message: "End error" });
  }
};


// in backend/controllers/examController.js

// in backend/controllers/examController.js

export const getExamResult = async (req, res) => {
  try {
    const examId = req.params.examId;
    const studentId = req.user._id;

    const session = await ExamSession.findOne({ exam: examId, student: studentId })
      .sort({ createdAt: -1 });
    if (!session) return res.status(404).json({ message: "Session not found" });

    const exam = await Exam.findById(examId);
    const attempt = await ExamAttempt.findOne({
      examSessionId: session._id,
      student: studentId,
    });

    

    if (!exam || !attempt) {
      return res.status(404).json({ message: "Result not found" });
    }

    // ✅ If student already verified & cleared review
    if (attempt.reviewCompleted) {
      return res.json({
        examName: exam.examName,
        totalMarks: attempt.totalMarks,
        maxMarks: attempt.maxMarks,
        percentage: attempt.percentage,
        pass: attempt.pass,
        questions: [],                // No detailed questions now
        reviewCompleted: true,
        certificateEligible: !!attempt.certificateEligible,
      });
    }

    const answersMap = new Map(
      attempt.answers.map((a) => [a.questionId.toString(), a])
    );

    // ✅ Build questions in the exact order of that exam sitting
    const orderedQuestions = (session.shuffledQuestions || [])
      .map(id => exam.questions.id(id))
      .filter(Boolean);


    const questionsWithAnswers = orderedQuestions.map((q) => {
      const a = answersMap.get(q._id.toString());
      const selectedText = a?.selectedOption ?? null;

      const correctOptionText = getCorrectOptionText(q);
      let correctIndex = null;

      if (correctOptionText && Array.isArray(q.options)) {
        const idx = q.options.findIndex(
          (opt) =>
            opt &&
            opt.toString().trim() === correctOptionText.toString().trim()
        );
        if (idx >= 0) correctIndex = idx;
      }

      const isGrace = !correctOptionText;

      return {
        id: q._id,
        question: q.question,
        options: q.options,
        correctAnswer: correctIndex,         // index or null
        correctAnswerText: correctOptionText,
        selectedOption: selectedText,
        isCorrect:
          !isGrace &&
          !!(
            selectedText &&
            correctOptionText &&
            selectedText.toString().trim() ===
              correctOptionText.toString().trim()
          ),
        mode: q.mode,
        marks: q.marks,
        isGrace,
      };
    });


    return res.json({
      examName: exam.examName,
      totalMarks: attempt.totalMarks,   // obtained marks
      maxMarks: attempt.maxMarks,       // possible marks
      percentage: attempt.percentage,
      pass: attempt.pass,
      certificateEligible: !!attempt.certificateEligible,
      certificateId: attempt.certificateId || null,
      questions: questionsWithAnswers,
      stats: attempt.stats,
      reviewCompleted: false,
      reason: attempt.reason || null,
    });

  } catch (err) {
    console.error("getExamResult error:", err);
    return res.status(500).json({ message: "Error loading result" });
  }
};



export const clearExamReview = async (req, res) => {
  try {
    const examId = req.params.examId;
    const studentId = req.user._id;

    const session = await ExamSession
      .findOne({ exam: examId, student: studentId })
      .sort({ createdAt: -1 });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const attempt = await ExamAttempt.findOne({
      examSessionId: session._id,
      student: studentId,
    });

    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found" });
    }

    // ✅ Keep totals, remove detailed answers
    attempt.answers = [];            // ❌ remove all Q&A details
    attempt.reviewCompleted = true;  // ✅ flag as verified
    await attempt.save();

    return res.json({ message: "Review data cleared successfully" , certificateId : attempt.certificateId });
  } catch (err) {
    console.error("clearExamReview error:", err);
    return res.status(500).json({ message: "Failed to clear review data" });
  }
};




export const getExamReport = async (req, res) => {
  try {
    const examId = req.params.examId;

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const attempts = await ExamAttempt.find()
      .populate("student", "name rollNumber email")
      .populate("examSessionId");

    const examAttempts = attempts.filter(
      (a) => a.examSessionId && a.examSessionId.exam.toString() === examId.toString()
    );

    if (!examAttempts.length) {
      return res.json({ message: "No attempts found", stats: null, rows: [] });
    }

    const scores = examAttempts.map((a) => a.totalMarks || 0);
    const percentages = examAttempts.map((a) => a.percentage || 0);

    const averageScore =
      scores.reduce((s, v) => s + v, 0) / scores.length;
    const averagePercentage =
      percentages.reduce((s, v) => s + v, 0) / percentages.length;

    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);

    const rows = examAttempts.map((a) => ({
      studentName: a.student?.name || "Unknown",
      rollNumber: a.student?.rollNumber || "",
      email: a.student?.email || "",
      score: a.totalMarks || 0,
      percentage: a.percentage || 0,
      pass: a.pass,
      reason: a.reason,
      submittedAt: a.submittedAt,
    }));

    return res.json({
      examName: exam.examName,
      totalMarks: exam.totalMarks,
      attempts: rows.length,
      stats: {
        averageScore,
        averagePercentage,
        highestScore,
        lowestScore,
      },
      rows,
    });
  } catch (err) {
    console.error("getExamReport error:", err);
    return res.status(500).json({ message: "Report error" });
  }
};

export const exportExamReportXlsx = async (req, res) => {
  try {
    const examId = req.params.examId;
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const attempts = await ExamAttempt.find()
      .populate("student", "name rollNumber email")
      .populate("examSessionId");

    const examAttempts = attempts.filter(
      (a) => a.examSessionId && a.examSessionId.exam.toString() === examId.toString()
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Report");

    sheet.addRow(["Exam Report", exam.examName]);
    sheet.addRow([]);
    sheet.addRow(["Name", "Roll No", "Email", "Score", "Percentage", "Pass", "Reason", "Submitted At"]);

    examAttempts.forEach((a) => {
      sheet.addRow([
        a.student?.name || "",
        a.student?.rollNumber || "",
        a.student?.email || "",
        a.totalMarks || 0,
        a.percentage || 0,
        a.pass ? "Yes" : "No",
        a.reason || "",
        a.submittedAt?.toISOString() || "",
      ]);
    });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="exam_${examId}_report.xlsx"`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("exportExamReportXlsx error:", err);
    return res.status(500).json({ message: "Export error" });
  }
};

export const exportExamReportPdf = async (req, res) => {
  try {
    const examId = req.params.examId;
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const attempts = await ExamAttempt.find()
      .populate("student", "name rollNumber email")
      .populate("examSessionId");

    const examAttempts = attempts.filter(
      (a) => a.examSessionId && a.examSessionId.exam.toString() === examId.toString()
    );

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="exam_${examId}_report.pdf"`
    );

    doc.pipe(res);

    doc.fontSize(18).text(`Exam Report: ${exam.examName}`, { underline: true });
    doc.moveDown();

    examAttempts.forEach((a) => {
      doc.fontSize(12).text(
        `${a.student?.name || ""} (${a.student?.rollNumber || ""}) - Score: ${a.totalMarks || 0
        } - ${a.percentage?.toFixed(2) || 0}% - ${a.pass ? "Pass" : "Fail"}`
      );
    });

    doc.end();
  } catch (err) {
    console.error("exportExamReportPdf error:", err);
    return res.status(500).json({ message: "Export error" });
  }
};




export const getStudentReportCard = async (req, res) => {
  try {
    const examId = req.params.examId;
    const studentId = req.user._id;

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const session = await ExamSession.findOne({ exam: examId, student: studentId })
      .sort({ createdAt: -1 });

    if (!session) return res.status(404).json({ message: "Session not found" });

    const attempt = await ExamAttempt.findOne({
      examSessionId: session._id,
      student: studentId,
    });

    if (!attempt || !attempt.stats)
      return res.status(404).json({ message: "Report not available" });

    const student = await Student.findById(studentId).select(
      "name rollNumber department year profileImage"
    );

    const stats = attempt.stats;
    const totalQs = stats.totalQuestions;

    const reportId = `RPT-${session._id.toString().slice(-6).toUpperCase()}`;

    return res.json({
      reportId,
      student: {
        name: student.name,
        id: student.rollNumber,
        batch: `${student.department} - Year ${student.year}`,
        examDate: session.startTime.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        photoUrl: student.profileImage || "",
      },
      exam: {
        examName: exam.examName,
        totalQs,
        correct: stats.correct,
        wrong: stats.wrong,
        totalMarks: attempt.totalMarks,   // REAL SCORE
        maxMarks: attempt.maxMarks        // REAL MAX
      },
      proctoring: {
        cheatingCount: session.violations,
        cheatingReason:
          attempt.reason === "violation"
            ? "Proctoring violation detected"
            : "None",
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load report" });
  }
};

export const getCertificateView = async (req, res) => {
  try {
    const { certificateId } = req.params;

    /* ======================================================
       1️⃣ MCQ CERTIFICATE (NO CHANGE IN LOGIC)
    ====================================================== */
    const mcqAttempt = await ExamAttempt.findOne({ certificateId })
      .populate("student", "name rollNumber department year email collegeName profileImage")
      .populate({
        path: "examSessionId",
        populate: { path: "exam", model: "Exam" }
      });
    
    


    if (mcqAttempt && mcqAttempt.examSessionId?.exam) {
      const exam = mcqAttempt.examSessionId.exam;
      const student = mcqAttempt.student;
      const stats = mcqAttempt.stats || {};
      

      const allowedTimeSeconds = (exam.duration || 120) * 60;

      const McqtimeEfficiencyPercent =
        mcqAttempt.timeTakenSeconds != null
          ? Math.min(
              100,
              (mcqAttempt.timeTakenSeconds / allowedTimeSeconds) * 100
            )
          : null;

      const McqavgTimePerQuestionSeconds =
        mcqAttempt.timeTakenSeconds && stats.totalQuestions
          ? mcqAttempt.timeTakenSeconds / stats.totalQuestions
          : null;


      return res.json({
        student: {
          name: student.name,
          id: student.rollNumber,
          course: student.department,
          semester: `Year ${student.year}`,
          avatarUrl: student.profileImage || "",
          email: student.email,
          institution: student.collegeName,
        },

        exam: {
          title: exam.examName,
          code: exam._id.toString().slice(-6).toUpperCase(),
          session: mcqAttempt.examSessionId.startTime?.getFullYear() || "",
          date: mcqAttempt.examSessionId.startTime,
          time: null,
          totalQuestions: stats.totalQuestions || 0,
          maxMarks: mcqAttempt.maxMarks,
          allowedTimeSeconds: (exam.duration || 120) * 60,

          passingMarks: Math.round(mcqAttempt.maxMarks * 0.4),
        },

        result: {
          score: mcqAttempt.totalMarks,
          percentage: Number(mcqAttempt.percentage.toFixed(2)),
          status: mcqAttempt.pass ? "PASSED" : "FAILED",
          grade:
            mcqAttempt.percentage >= 75 ? "A" :
            mcqAttempt.percentage >= 60 ? "B" :
            mcqAttempt.percentage >= 50 ? "C" : "D",
          classification:
            mcqAttempt.pass
              ? mcqAttempt.percentage >= 75
                ? "First Class with Distinction"
                : "First Class"
              : "Fail",
          timeTakenSeconds: mcqAttempt.timeTakenSeconds || null,
          McqavgTimePerQuestionSeconds,
          McqtimeEfficiencyPercent,
          totalQuestions: stats.totalQuestions || 0,
          violationDetails: mcqAttempt.examSessionId
            ? {
                tabSwitchCount: mcqAttempt.examSessionId.violations || 0,
                fullscreenExitCount: 0,
                devToolCount: 0,
                shortcutCount: 0,
                violationReason:
                  mcqAttempt.reason === "violation" ? "Proctoring violation" : null,
              }
            : null,

          correct: stats.correct || 0,
          wrong: stats.wrong || 0,
          examType: "mcq",
          grace: stats.graceCount || 0,
          skipped: (stats.totalQuestions || 0) - (stats.attempted || 0),
          timeTaken: null,
          percentile: null,
          certificateId,
        },
      });
    }

    /* ======================================================
       2️⃣ COMPILER CERTIFICATE (REAL DATA ONLY)
    ====================================================== */
    const compilerAttempt = await CompilerExamAttempt.findOne({ certificateId })
      .populate("student", "name rollNumber department year email collegeName profileImage")
      .populate("exam");
    // 1️⃣ get exam session (earliest start)
const session = await ExamSession.findOne({
  student: compilerAttempt.student,
  exam: compilerAttempt.exam
}).sort({ startTime: 1 });



// 3️⃣ allowed duration


// 4️⃣ efficiency percentage
// const timeEfficiencyPercent =
//   totalTimeTakenSeconds
//     ? Math.min(
//         100,
//         (totalTimeTakenSeconds / allowedTimeSeconds) * 100
//       )
//     : null;

// const totalQuestions =
//   compilerAttempt.stats?.totalQuestions ||
//   compilerAttempt.submissions.length;

// const avgTimePerQuestionSeconds =
//   totalTimeTakenSeconds && totalQuestions
//     ? totalTimeTakenSeconds / totalQuestions
//     : null;
  
    
    
    // avg time per question using real submissions
    

    

    
    if (!compilerAttempt || !compilerAttempt.exam) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    const student = compilerAttempt.student;
    const exam = compilerAttempt.exam;
    const stats = compilerAttempt.stats || {};

    const allowedTimeSeconds = (exam.duration || 120) * 60;

const totalTimeTakenSeconds =
  session?.startTime && compilerAttempt.submittedAt
    ? Math.max(
        0,
        (compilerAttempt.submittedAt - session.startTime) / 1000
      )
    : null;

    const timeEfficiencyPercent =
      totalTimeTakenSeconds != null
        ? Math.min(
            100,
            (totalTimeTakenSeconds / allowedTimeSeconds) * 100
          )
        : null;

    const totalQuestions =
      stats.totalQuestions || compilerAttempt.submissions?.length || 0;

    const avgTimePerQuestionSeconds =
      totalTimeTakenSeconds && totalQuestions
        ? totalTimeTakenSeconds / totalQuestions
        : null;


    return res.json({
      student: {
        name: student.name,
        id: student.rollNumber,
        course: student.department,
        semester: `Year ${student.year}`,
        avatarUrl: student.profileImage || "",
        email: student.email,
        institution: student.collegeName,
      },

      exam: {
        title: exam.title,
        code: exam._id.toString().slice(-6).toUpperCase(),
        session: compilerAttempt.submittedAt?.getFullYear() || "",
        date: compilerAttempt.submittedAt,
        language : compilerAttempt.exam.language,
        time: null,
        totalQuestions: stats.totalQuestions || exam.questions.length,
        maxMarks: compilerAttempt.maxScore,
        passingMarks: Math.round(compilerAttempt.maxScore * 0.4),
        allowedTimeSeconds: (exam.duration || 120) * 60,

      },

      result: {
        score: compilerAttempt.totalScore,
        percentage: Number(compilerAttempt.percentage.toFixed(2)),
        status: compilerAttempt.pass ? "PASSED" : "FAILED",
        grade:
          compilerAttempt.percentage >= 75 ? "A" :
          compilerAttempt.percentage >= 60 ? "B" :
          compilerAttempt.percentage >= 50 ? "C" : "D",
        classification:
          compilerAttempt.pass
            ? compilerAttempt.percentage >= 75
              ? "First Class with Distinction"
              : "First Class"
            : "Fail",
        totalQuestions: stats.totalQuestions || 0,
        violationDetails : compilerAttempt.violationDetails,
        correct: stats.passed || 0,
        wrong: stats.failed || 0,
        timeTakenSeconds: totalTimeTakenSeconds,
        timeEfficiencyPercent,
        avgTimePerQuestionSeconds,
        examType: "compiler",
        partial: stats.partial || 0,
        skipped: (stats.totalQuestions || 0) - (stats.attempted || 0),
        timeTaken: null,
        percentile: null,
        certificateId,
      },
    });

  } catch (err) {
    console.error("getCertificateView error:", err);
    return res.status(500).json({ message: "Error loading certificate" });
  }
};
