// routes/compilerExamRoutes.js
import CompilerExam from "../models/CompilerExam.js";
import express from 'express';
import { protect } from "../middlewares/auth.js";
import {
createExamWithQuestions , getStudentCompilerExams 

} from '../controllers/compilerExamControllerU.js';



const router = express.Router();


router.post('/create',protect(["admin"]), createExamWithQuestions);
// router.post('/:examId/questions',protect(["admin"]), addCompilerQuestion);
router.get('/student', protect(["student"]), getStudentCompilerExams);

router.get("/list", protect(["admin"]), async (req, res) => {
  const exams = await CompilerExam.find({ createdBy: req.user._id }).lean().sort({ createdAt: -1 });
  res.json(exams);
});

export default router;