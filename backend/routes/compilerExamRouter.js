// routes/compilerExamRoutes.js
import express from 'express';
import { protect } from "../middlewares/auth.js";
import {
createCompilerExam,
addCompilerQuestion
} from '../controllers/compilerExamController.js';



const router = express.Router();


router.post('/create',protect(["admin"]), createCompilerExam);
router.post('/:examId/questions',protect(["admin"]), addCompilerQuestion);


export default router;