import express from "express";
import { createQuiz, getQuizById, startQuiz } from "../controllers/quizController.js";

const router = express.Router();

router.post("/", createQuiz);
router.get("/:id", getQuizById);
router.put("/:id/start", startQuiz);   // ✅ new route

export default router;
