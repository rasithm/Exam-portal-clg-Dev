// routes/studentCompilerExamRoutes.js
import express from 'express';
import { protect } from "../middlewares/auth.js";
import {

getCompilerExamById , runCode ,  runAllAndEvaluate, manualSubmit
} from '../controllers/compilerExamStudentController.js';

const router = express.Router();

router.post("/run-all",protect(['student']),  runAllAndEvaluate);
router.post("/submit",protect(['student']), manualSubmit);
router.get('/:examId', protect(["student"]), getCompilerExamById);
router.post('/run-code', protect(['student']), runCode);
export default router;