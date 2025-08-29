import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { submitAnswers, leaderboard } from "../controllers/submissionController.js";

export default function makeSubmissionRouter(io) {
  const router = Router();
  router.post("/:id/submit", auth("student"), (req, res) => submitAnswers(io, req, res));
  router.get("/:id/leaderboard", auth(), leaderboard);
  return router;
}
