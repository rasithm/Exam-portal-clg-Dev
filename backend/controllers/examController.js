
// backend/controllers/examController.js
import Exam from "../models/Exam.js";
import QuestionSet from "../models/QuestionSet.js";
import { io } from "../sockets/socketManager.js";

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

    // Check examName uniqueness in the same collegeTag (case-insensitive)
    // const existingExam = await Exam.findOne({
    //   examName: new RegExp(`^${examName}$`, "i"),
    //   collegeTag: req.user.collegeTag
    // });
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

    
    // if (normalizedCategory.toLowerCase() === "re-assign-exam" ) {
      
    //   const targetExam = await Exam.findOne({
    //     examName: new RegExp(`^${examName}$`, "i"),
    //     collegeTag: req.user.collegeTag
    //   });
    //   if (!targetExam) {
    //     return res.status(404).json({ message: "Original exam not found for reassignment." });
    //   }

      
    //   const students = Array.isArray(assignStudents)
    //     ? assignStudents.map(s => s.toString().trim()).filter(Boolean)
    //     : (assignStudents ).toString().split(",").map(s => s.trim()).filter(Boolean);

    //   if (!students.length) {
    //     return res.status(400).json({ message: "Please specify student(s) for reassignment (comma separated or array)." });
    //   }

      
    //   targetExam.reassignedStudents = students;
    //   targetExam.reassignAllowed = true;
    //   await targetExam.save();

    //   io?.emit("examReassigned", {
    //     examName: targetExam.examName,
    //     students,
    //     by: req.user.email,
    //     collegeTag: req.user.collegeTag,
    //   });

    //   const nowTime = new Date();
    //   const allExams = await Exam.find({ collegeTag: req.user.collegeTag });

    //     const upcomingCount = allExams.filter(e => new Date(e.startDateTime) > nowTime).length;
    //     const activeCount = allExams.filter(e => new Date(e.startDateTime) <= nowTime && new Date(e.endDateTime) >= nowTime).length;
    //     const completedCount = allExams.filter(e => new Date(e.endDateTime) < nowTime).length;
    //     const reassignCount = allExams.filter(e => (e.category || "").toLowerCase() === "re-assign-exam").length;

    //     io?.emit("examStatsUpdated", {
    //       collegeTag: req.user.collegeTag,
    //       upcomingCount,
    //       activeCount,
    //       completedCount,
    //       reassignCount
    //     });


    //   return res.json({ message: "Exam reassigned successfully.", reassignedStudents: students });
    // }
    if (normalizedCategory.toLowerCase() === "re-assign-exam") {
      const targetExam = await Exam.findOne({
        examName: new RegExp(`^${examName}$`, "i"),
        collegeTag: req.user.collegeTag
      });

      if (!targetExam) {
        return res.status(404).json({ message: "Original exam not found for reassignment." });
      }

      const students = Array.isArray(assignStudents)
        ? assignStudents.map(s => s.toString().trim()).filter(Boolean)
        : (assignStudents || "").toString().split(",").map(s => s.trim()).filter(Boolean);

      if (!students.length) {
        return res.status(400).json({ message: "Please specify student(s) for reassignment (comma separated or array)." });
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
        message: "Exam reassigned successfully with extended end date (2 days).",
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

    // Minimum questions check
    if (allQuestions.length < 60) {
      return res.status(400).json({ message: `At least 60 questions are required. Found ${allQuestions.length}.` });
    }

    // Deduplicate by question text (case-insensitive)
    const seen = new Set();
    const uniqueQuestions = [];
    for (const q of allQuestions) {
      const key = q.question?.toString().toLowerCase().trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        uniqueQuestions.push(q);
      }
    }

    // Ensure difficulty distribution: at least 20 easy, 20 medium, 20 hard
    const easyQs = uniqueQuestions.filter(q => (q.mode || "").toString().toLowerCase() === "easy");
    const mediumQs = uniqueQuestions.filter(q => (q.mode || "").toString().toLowerCase() === "medium");
    const hardQs = uniqueQuestions.filter(q => (q.mode || "").toString().toLowerCase() === "hard");

    if (easyQs.length < 20 || mediumQs.length < 20 || hardQs.length < 20) {
      return res.status(400).json({
        message: `Need at least 20 easy, 20 medium and 20 hard questions. Found easy=${easyQs.length}, medium=${mediumQs.length}, hard=${hardQs.length}.`
      });
    }

    // Pick first 20 of each difficulty (so total 60). If you want random selection use shuffle logic.
    const pick = (arr, n) => arr.slice(0, n);
    const finalQuestionsSelected = [
      ...pick(easyQs, 20),
      ...pick(mediumQs, 20),
      ...pick(hardQs, 20)
    ];

    // Assign marks based on mode (easy=1, medium=2, hard=3)
    // const questionsWithMarks = finalQuestionsSelected.map(q => {
      
    //   const qObj = q.toObject ? q.toObject() : { ...q };
    //   const mode = (qObj.mode || "").toString().toLowerCase();
    //   qObj.marks = mode === "easy" ? 1 : mode === "medium" ? 2 : 3, 
    //   type: q.type || "MCQ"
    //   return qObj;
    // });
    const questionsWithMarks = finalQuestionsSelected.map(q => ({
      ...q.toObject(),
      marks: q.mode === "easy" ? 1 : q.mode === "medium" ? 2 : 3,
      type: (q.type || "mcq").toLowerCase()   
    }));
    
    const totalMarks = questionsWithMarks.reduce((acc, q) => acc + (q.marks || 0), 0);

    // Assign students parsing (createExam case)
    const parsedStudents = Array.isArray(assignStudents)
      ? assignStudents.map(s => s.toString().trim()).filter(Boolean)
      : (assignStudents || "").toString().split(",").map(s => s.trim()).filter(Boolean);

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

export const getExams = async (req, res) => {
  try {
    const exams = await Exam.find({ collegeTag: req.user.collegeTag })
      .populate("createdBy", "email")
      .sort({ createdAt: -1 });
    res.json(exams);
  } catch (err) {
    console.error("Error fetching exams:", err);
    res.status(500).json({ message: "Failed to fetch exams" });
  }
};




