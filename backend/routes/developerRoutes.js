// routes/developerRoutes.js
import express from "express";
import {
  developerLogin,
  getPortfolio,
  updatePortfolio,
  triggerResetAlert,
  getStudentsForDeveloper , createDeveloper
} from "../controllers/developerController.js";
import { developerProtect } from "../middlewares/developerAuth.js";

const router = express.Router();

router.post("/login", developerLogin);
router.get("/portfolio", developerProtect, getPortfolio);
router.post("/portfolio", developerProtect, updatePortfolio);
router.post("/reset", developerProtect, triggerResetAlert);
router.get("/students", developerProtect, getStudentsForDeveloper);
router.post("/createdeveloper" , createDeveloper)
export default router;