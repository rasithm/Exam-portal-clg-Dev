
// routes/questionRoutes.js
import express from "express";
import multer from "multer";
import { protect } from "../middlewares/auth.js";
import { importQuestions,  downloadTemplate } from "../controllers/questionController.js";
import { io } from "../server.js";  // import initialized socket instance
import QuestionSet from "../models/QuestionSet.js";
const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/import", protect(["admin"]), upload.single("file"), importQuestions);
// router.get("/list", protect(["admin"]), listQuestionSets);
router.get("/template", protect(["admin","creator"]), downloadTemplate);
router.get("/list", protect(["admin","creator"]), async (req, res) => {
  try {
    console.log("[/questions/list] collegeTag =", req.user.collegeTag, "user=", req.user.email);
    const sets = await QuestionSet.find(
      { collegeTag: req.user.collegeTag },
      "fileName category subcategory questions createdAt"
    ).sort({createdAt : -1});
    console.log("[/questions/list] sets count =", sets.length);
    res.json(sets);
  } catch (err) {
    console.error("Error fetching question sets:", err);
    res.status(500).json({ message: "Failed to fetch question sets" });
  }
});
router.delete("/:id", protect(["admin"]), async (req, res) => {
  await QuestionSet.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});


router.post("/upload", async (req, res, next) => {
  try {
    await uploadQuestions(req, res);
    io.emit("newNotification", {
      fileName: req.body.fileName || "Unknown File",
      category: req.body.category || "Uncategorized",
      subCategory: req.body.subCategory || "",
      uploaderEmail: req.user?.email || "Unknown",
      questionCount: req.body.questionCount || 0,
      timestamp: new Date(),
    });
  } catch (error) {
    next(error);
  }
});
export default router;

