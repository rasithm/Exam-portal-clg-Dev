import express from "express";
import { getCertificateView } from "../controllers/examController.js";

const router = express.Router();

import { generateCertificatePDF } from "../controllers/certificateController.js";



router.get("/:certificateId/pdf", generateCertificatePDF);
// PUBLIC route → no protect middleware
router.get("/:certificateId", getCertificateView);

export default router;
