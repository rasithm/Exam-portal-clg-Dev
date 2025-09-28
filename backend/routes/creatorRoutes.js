// routes/creatorRoutes.js
import express from 'express';
import { creatorLogin, createFirstAdmin } from '../controllers/creatorController.js';
import { rateLimiterStrict } from '../middlewares/rateLimiter.js';
const router = express.Router();

router.post('/login', creatorLogin);
router.post('/setup', rateLimiterStrict , createFirstAdmin);

export default router;
