// routes/studentCompilerExamRoutes.js
import express from 'express';
import { protect } from "../middlewares/auth.js";
import {

getCompilerExamById , runCode ,  runAllAndEvaluate, manualSubmit , endCompilerExam ,getCompilerExamStatus , getCompilerExamResult
} from '../controllers/compilerExamStudentController.js';

const router = express.Router();

router.post("/run-all",protect(['student']),  runAllAndEvaluate);
router.post("/submit",protect(['student']), manualSubmit);
router.get('/:examId', protect(["student"]), getCompilerExamById);
router.post('/run-code', protect(['student']), runCode);
router.get("/:examId/status", protect(['student']), getCompilerExamStatus);
router.get("/:examId/result", protect(["student"]), getCompilerExamResult);
router.post("/end", protect(["student"]), endCompilerExam);

export default router;