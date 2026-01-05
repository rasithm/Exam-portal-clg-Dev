// routes/studentCompilerExamRoutes.js
import express from 'express';
import { protect } from "../middlewares/auth.js";
import {

getCompilerExamById
,evaluateCodeSubmission , runCodeWithCustomInput
} from '../controllers/compilerExamStudentController.js';

const router = express.Router();
router.post('/:examId/questions/:questionId/submit', protect(["student"]), evaluateCodeSubmission);

router.get('/:examId', protect(["student"]), getCompilerExamById);
router.post('/run-code', protect(['student']), runCodeWithCustomInput);
export default router;