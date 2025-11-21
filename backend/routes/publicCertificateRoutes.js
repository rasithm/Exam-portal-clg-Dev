import express from "express";
import { getCertificateView } from "../controllers/examController.js";

const router = express.Router();

// PUBLIC route → no protect middleware
router.get("/:certificateId", getCertificateView);

export default router;
