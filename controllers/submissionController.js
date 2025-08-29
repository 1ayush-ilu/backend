import Quiz from "../models/Quiz.js";
import Submission from "../models/Submission.js";

export async function submitAnswers(io, req, res) {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ msg: "Quiz not found" });

    const { answers } = req.body;
    const exists = await Submission.findOne({ quizId: quiz._id, studentId: req.user._id });
    if (exists) return res.status(400).json({ msg: "Already submitted" });

    let score = 0;
    quiz.questions.forEach((q, idx) => {
      if (answers[idx] === q.answerIndex) score += 1;
    });

    const submission = await Submission.create({
      quizId: quiz._id,
      studentId: req.user._id,
      answers,
      score
    });

    io.to(String(quiz._id)).emit("leaderboard:update", { quizId: String(quiz._id) });
    res.json({ msg: "Submitted", score, submissionId: submission._id });
  } catch (e) {
    res.status(500).json({ msg: "Submit failed" });
  }
}

export async function leaderboard(req, res) {
  const quizId = req.params.id;
  const subs = await Submission.find({ quizId })
    .populate("studentId", "name")
    .sort({ score: -1, createdAt: 1 });
  res.json(subs.map((s, i) => ({
    rank: i + 1,
    name: s.studentId?.name || "Unknown",
    score: s.score,
    submittedAt: s.createdAt
  })));
}
