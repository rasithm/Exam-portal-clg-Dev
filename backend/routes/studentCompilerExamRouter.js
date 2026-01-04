// routes/studentCompilerExamRoutes.js
import express from 'express';
import { protect } from "../middlewares/auth.js";
import {

getCompilerExamById

} from '../controllers/compilerExamStudentController.js';

const router = express.Router();

router.get('/:examId', protect(["student"]), getCompilerExamById);

export default router;