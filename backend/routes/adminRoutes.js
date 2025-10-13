// routes/adminRoutes.js
import express from 'express';
import { protect } from '../middlewares/auth.js';
import multer from 'multer';
import {
  createStudent,
  uploadStudentsCSV,
  listStudents,
  exportStudentsCSV,
  downloadTemplate
} from '../controllers/adminController.js';
import { getNotifications, acceptQuestionFile, rejectQuestionFile } from '../controllers/notificationController.js';


const upload = multer({ dest: 'uploads/' });
const router = express.Router();

// create single student
router.post('/createStudents', protect(['admin']), createStudent);

// upload students CSV (multipart) - strict validation
router.post('/students/upload', protect(['admin']), upload.single('file'), uploadStudentsCSV);

// list students (paginated)
router.get('/students', protect(['admin']), listStudents);

// download exported CSV (admin's students)
router.get('/students/export', protect(['admin']), exportStudentsCSV);

// download template CSV
router.get('/students/template', protect(['admin']), downloadTemplate);

router.get('/notifications', getNotifications);
router.post('/notifications/accept', acceptQuestionFile);
router.post('/notifications/reject', rejectQuestionFile);

export default router;

