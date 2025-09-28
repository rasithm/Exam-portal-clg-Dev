// routes/adminRoutes.js
import express from 'express';
import { protect } from '../middlewares/auth.js';
import { createStudent, uploadStudentsCSV } from '../controllers/adminController.js';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.post('/students', protect(['admin']), createStudent);
router.post('/students/upload', protect(['admin']), upload.single('file'), uploadStudentsCSV);

export default router;
