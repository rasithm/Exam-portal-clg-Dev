// routes/compilerExamRoutes.js
import express from 'express';
import { protect } from "../middlewares/auth.js";
import {
createExamWithQuestions , getStudentCompilerExams 

} from '../controllers/compilerExamControllerU.js';



const router = express.Router();


router.post('/create',protect(["admin"]), createExamWithQuestions);
// router.post('/:examId/questions',protect(["admin"]), addCompilerQuestion);
router.get('/student', protect(["student"]), getStudentCompilerExams);


export default router;