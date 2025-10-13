//C:\Users\nazeer\Downloads\Exam-portal\Exam-portal\backend\controllers\questionController.js
import xlsx from "xlsx";
import fs from "fs";
import path from "path";
import QuestionSet from "../models/QuestionSet.js";
import Admin from "../models/Admin.js"; // For shared admin notifications (future use)
import Notification from "../models/Notification.js"; // We'll create this model soon

// ---------- Import Questions ----------
// Helper: normalize header keys (trim, lower, remove non-alnum)
const normalizeKey = (k = "") =>
  k
    .toString()  
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");

// synonyms map: normalizedKey -> logical field
// const FIELD_SYNONYMS = {
//   question: ["question", "ques", "q", "prompt"],
//   option1: ["option1", "opt1", "a", "choice1", "1", "optionone"],
//   option2: ["option2", "opt2", "b", "choice2", "2", "optiontwo"],
//   option3: ["option3", "opt3", "c", "choice3", "3", "optionthree"],
//   option4: ["option4", "opt4", "d", "choice4", "4", "optionfour"],
//   answer: ["answer", "ans", "correct", "correctanswer", "rightanswer"],
//   category: ["category", "cat", "domain"],
//   subCategory: ["subcategory", "sub-category", "subcat", "sub", "topic"],
//   mode: ["mode", "difficulty", "level"],
//   verification: ["verification", "verify", "action", "mark"]
// };
const FIELD_SYNONYMS = {
  question: ["question", "ques", "q", "prompt"],
  option1: ["option1", "opt1", "a", "choice1", "1", "optionone", "optiona"],
  option2: ["option2", "opt2", "b", "choice2", "2", "optiontwo", "optionb"],
  option3: ["option3", "opt3", "c", "choice3", "3", "optionthree", "optionc"],
  option4: ["option4", "opt4", "d", "choice4", "4", "optionfour", "optiond"],
  answer: ["answer", "ans", "correct", "correctanswer", "rightanswer"],
  category: ["category", "cat", "domain"],
  subCategory: ["subcategory", "subcategory", "subcat", "sub", "topic"],
  mode: ["mode", "difficulty", "level"],
  verification: ["verification", "verify", "action", "mark"]
};


// build reverse lookup: normalized synonym -> field
const buildSynMap = () => {
  const map = {};
  Object.keys(FIELD_SYNONYMS).forEach((field) => {
    FIELD_SYNONYMS[field].forEach((syn) => {
      map[syn] = field;
    });
  });
  return map;
};
const SYN_MAP = buildSynMap();

// Try to map headerRow -> fields. Return index map field->colIndex
const mapHeaderRow = (headerRow = []) => {
  const map = {};
  for (let i = 0; i < headerRow.length; i++) {
    const raw = headerRow[i] ?? "";
    const norm = normalizeKey(raw);
    if (!norm) continue;
    if (SYN_MAP[norm]) map[SYN_MAP[norm]] = i;
    else {
      // fuzzy attempt: if header contains keywords
      if (norm.includes("question")) map.question = i;
      else if (norm.includes("option") || norm.match(/^opt/)) {
        if (!map.option1) map.option1 = i;
        else if (!map.option2) map.option2 = i;
        else if (!map.option3) map.option3 = i;
        else if (!map.option4) map.option4 = i;
      } else if (norm.includes("answer") || norm.includes("ans")) map.answer = i;
      else if (norm.includes("category") || norm.includes("cat")) map.category = i;
      else if (norm.includes("sub") || norm.includes("topic")) map.subCategory = i;
      else if (norm.includes("mode") || norm.includes("diff")) map.mode = i;
      else if (norm.includes("verif") || norm.includes("remove")) map.verification = i;
    }
  }
  return map;
};

// positional fallback mapping if no headers or headers are unhelpful
const positionalFieldOrder = [
  "question",
  "option1",
  "option2",
  "option3",
  "option4",
  "answer",
  "category",
  "subCategory",
  "mode",
  "verification",
];

const importQuestions = async (req, res) => {
  try {
    const { fileName, category, subcategory, sharedAdmins, notes } = req.body;
    const filePath = req.file?.path;

    if (!fileName || !category || !subcategory || !filePath) {
      if (filePath) fs.unlinkSync(filePath);
      return res.status(400).json({ message: "Missing required fields or file" });
    }

    // Read the workbook rows as arrays (header row detection helpful)
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: "No sheet found in file" });
    }

    // Read everything as rows arrays (header row included)
    const rowsArray = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    if (!rowsArray || rowsArray.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: "Uploaded file is empty" });
    }

    // Determine header presence: check first row values type/length
    const firstRow = rowsArray[0].map((c) => (c || "").toString().trim());
    const hasHeaders =
      firstRow.some((v) => typeof v === "string" && v.length > 0) &&
      // if many cells in first row are short and contain words like Question/Answer...
      firstRow.some((v) =>
        ["question", "option", "answer", "ans", "category", "sub"].some((k) =>
          v.toLowerCase().includes(k)
        )
      );

    let headerMap = {};
    let dataStartIndex = 0;
    if (hasHeaders) {
      headerMap = mapHeaderRow(firstRow);
      dataStartIndex = 1;
    } else {
      // No header: use positional mapping
      headerMap = {};
      positionalFieldOrder.forEach((f, idx) => (headerMap[f] = idx));
      dataStartIndex = 0;
    }

    // If crucial fields are missing in headerMap and file had header row,
    // we will allow fallback to positional mapping for missing ones
    const requiredFields = ["question", "answer"];
    const missingFieldsFromHeader = requiredFields.filter((f) => headerMap[f] === undefined);
    if (hasHeaders && missingFieldsFromHeader.length > 0) {
      // fallback attempt: map by position if header didn't identify required fields
      positionalFieldOrder.forEach((f, idx) => {
        if (headerMap[f] === undefined && idx < firstRow.length) {
          // only map if that position is not already taken by other mapping
          headerMap[f] = headerMap[f] ?? idx;
        }
      });
    }

    // Build rows objects using headerMap
    const processed = [];
    const failedRows = [];
    let added = 0,
      removed = 0,
      invalid = 0;

    // fetch existing set if any
    const existingSet = await QuestionSet.findOne({ fileName, createdBy: req.user._id });

    for (let r = dataStartIndex; r < rowsArray.length; r++) {
      const row = rowsArray[r];
      // map fields
      const getVal = (field) => {
        const idx = headerMap[field];
        if (idx === undefined) return "";
        return row[idx] ?? "";
      };

      const rawQuestion = (getVal("question") || "").toString().trim();
      const rawOption1 = (getVal("option1") || "").toString().trim();
      const rawOption2 = (getVal("option2") || "").toString().trim();
      const rawOption3 = (getVal("option3") || "").toString().trim();
      const rawOption4 = (getVal("option4") || "").toString().trim();
      let rawAnswer = (getVal("answer") || "").toString().trim();
      const rawCategory = (getVal("category") || category || "").toString().trim();
      const rawSubCategory = (getVal("subCategory") || subcategory || "").toString().trim();
      const rawMode = (getVal("mode") || "easy").toString().trim();
      const rawVerification = (getVal("verification") || "").toString().trim().toLowerCase();

      // If row is entirely empty, skip
      if (
        !rawQuestion &&
        !rawOption1 &&
        !rawOption2 &&
        !rawOption3 &&
        !rawOption4 &&
        !rawAnswer
      ) {
        // skip empty row
        continue;
      }

      // If question missing -> fail
      if (!rawQuestion) {
        invalid++;
        failedRows.push({ row: r + 1, reason: "Missing question text" });
        continue;
      }

      // If options missing but answer exists and answer equals one option text later,
      // we'll still accept but warn. Build options array, pad to 4
      const options = [rawOption1, rawOption2, rawOption3, rawOption4].map((o) =>
        o?.toString().trim() || ""
      );
      while (options.length < 4) options.push("");

      // Infer answer if numeric index (1..4)
      let correctAnswerText = rawAnswer;
      if (/^[1-4]$/.test(rawAnswer)) {
        const idx = parseInt(rawAnswer, 10) - 1;
        correctAnswerText = options[idx] || rawAnswer;
      } else {
        // if answer is one of the option texts (case-insensitive), normalize to that option text
        const matchOption = options.find(
          (opt) => opt && opt.toLowerCase() === rawAnswer.toLowerCase()
        );
        if (matchOption) correctAnswerText = matchOption;
        // else leave as given (could be full text)
      }

      // final validation: answer must be non-empty (either option text or provided answer)
      if (!correctAnswerText) {
        invalid++;
        failedRows.push({ row: r + 1, reason: "Missing answer or unable to infer answer" });
        continue;
      }

      // Build question object
      const qObj = {
        question: rawQuestion,
        options,
        correctAnswer: correctAnswerText,
        category: rawCategory || category,
        subCategory: rawSubCategory || subcategory,
        mode: ["easy", "medium", "hard"].includes(rawMode.toLowerCase())
          ? rawMode.toLowerCase()
          : "easy",
        verification: rawVerification === "remove" ? "remove" : "",
      };

      // If existingSet: handle remove or append (avoid duplicates by question text)
      if (existingSet) {
        if (qObj.verification === "remove") {
          // remove matching question by exact match (case-insensitive)
          await QuestionSet.updateOne(
            { _id: existingSet._id },
            { $pull: { questions: { question: qObj.question } } }
          );
          removed++;
        } else {
          const exists = existingSet.questions.some(
            (x) => x.question.toLowerCase() === qObj.question.toLowerCase()
          );
          if (!exists) {
            existingSet.questions.push(qObj);
            added++;
          } else {
            // skip duplicates silently (or collect as warning)
          }
        }
      } else {
        processed.push(qObj);
      }
    } // end rows loop

    // If new create
    if (!existingSet) {
      if (processed.length > 0) {
        const normalizedCategory = (category || "").toString().trim().toLowerCase();
        const normalizedSubcategory = (subcategory || "").toString().trim().toLowerCase();
        await QuestionSet.create({
          fileName,
          category: normalizedCategory, // Store lowercase
          subcategory: normalizedSubcategory,
          
          sharedAdmins: sharedAdmins?.split(",").map((e) => e.trim()) || [],
          notes,
          createdBy: req.user._id,
          collegeTag: req.user.collegeTag,
          questions: processed.filter((q) => q.verification !== "remove"),
        });
        console.log("[importQuestions] Created QuestionSet:", {
          fileName,
          category: normalizedCategory,
          subcategory: normalizedSubcategory,
          questionsCount: processed.filter((q) => q.verification !== "remove").length
        });
        added = processed.filter((q) => q.verification !== "remove").length;
      }
    } else {
      await existingSet.save();
    }

    // Clean up uploaded file
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.warn("Failed to remove uploaded file:", e.message);
    }

    // Notifications to shared admins (store in DB Notification)
    if (sharedAdmins) {
      const emails = sharedAdmins.split(",").map((e) => e.trim()).filter(Boolean);
      for (const em of emails) {
        try {
          const admin = await Admin.findOne({ email: em });
          if (admin) {
            await Notification.create({
              userId: admin._id,
              message: `Question set "${fileName}" shared with you (${category} / ${subcategory}).`,
              type: "questionset",
              link: `/admin/questions/${fileName}`,
            });
          }
        } catch (e) {
          console.error("Notification create error for", em, e.message);
        }
      }
    }

    // Return details to frontend
    return res.json({
      message: "Import finished",
      added,
      removed,
      invalid,
      failedRows: failedRows.slice(0, 20), // return first 20 problems
    });
  } catch (err) {
    console.error("Import error:", err);
    // try to unlink file if exists
    try {
      if (req.file?.path) fs.unlinkSync(req.file.path);
    } catch (e) {}
    return res.status(500).json({ message: "Error importing questions", error: err.message });
  }
};

export { importQuestions };

// ---------- Download Template ----------
export const downloadTemplate = async (req, res) => {
  try {
    const template = [
      {
        Question: "What is React?",
        Option1: "Framework",
        Option2: "Library",
        Option3: "Language",
        Option4: "Tool",
        Answer: "Library",
        category: "technical",
        subCategory: "javascript",
        mode: "easy",
        verification: "",
      },
      {
        Question: "2 + 2 = ?",
        Option1: "3",
        Option2: "4",
        Option3: "5",
        Option4: "22",
        Answer: "4",
        category: "non-technical",
        subCategory: "math",
        mode: "easy",
        verification: "remove",
      },
    ];

    const ws = xlsx.utils.json_to_sheet(template);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Questions_Template");

    const tempPath = path.join("uploads", "questions_template.xlsx");
    xlsx.writeFile(wb, tempPath);
    res.download(tempPath, "questions_template.xlsx", (err) => {
      fs.unlinkSync(tempPath);
      if (err) console.error("Download error:", err);
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Template generation failed" });
  }
};



