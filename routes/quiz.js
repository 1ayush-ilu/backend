import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { createQuiz, getQuiz, getHostQuizzes, invite, exportCSV } from "../controllers/quizController.js";

const router = Router();
router.post("/", auth("host"), createQuiz);
router.get("/:id", auth(), getQuiz);
router.get("/", auth("host"), getHostQuizzes);
router.post("/:id/invite", auth("host"), invite);
router.get("/:id/export", auth("host"), exportCSV);
export default router;
