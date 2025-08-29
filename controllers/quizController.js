// controllers/quizController.js
import Quiz from "../models/Quiz.js";
import Submission from "../models/Submission.js";
import { sendInvite } from "../utils/email.js";
import { toCSV } from "../utils/csv.js";
import OpenAI from "openai";

// 🔹 AI-based generator
async function generateAIQuestions(prompt, numQuestions = 5) {
  // ✅ Instantiate OpenAI lazily (only when needed)
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const systemPrompt = `
  Generate ${numQuestions} multiple-choice quiz questions on the topic: "${prompt}".
  Each question must strictly follow this JSON format:
  [
    {
      "question": "string",
      "options": ["A","B","C","D"],
      "answerIndex": 0
    }
  ]
  `;

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [{ role: "user", content: systemPrompt }],
  });

  let content = response.choices[0].message.content.trim();

  // Clean ```json wrappers if GPT adds them
  if (content.startsWith("```")) {
    content = content.replace(/```json|```/g, "").trim();
  }

  try {
    const questions = JSON.parse(content);
    return questions;
  } catch (err) {
    console.error("❌ Failed to parse AI response:", err);
    throw new Error("AI quiz generation failed");
  }
}

// 🔹 Dummy fallback generator
function generateQuestionsFromPrompt(prompt) {
  const topics = prompt?.split(",").map(s => s.trim()).filter(Boolean) || ["General"];
  const qs = [];
  for (let i = 0; i < 5; i++) {
    const topic = topics[i % topics.length];
    const correct = i % 4;
    qs.push({
      question: `(${topic}) Sample question ${i + 1}: Which option is correct?`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      answerIndex: correct
    });
  }
  return qs;
}

// ✅ Create quiz + send invites in one step
export async function createQuiz(req, res) {
  try {
    const { title, prompt, questions, emails } = req.body;

    // 1. Generate questions
    let qs;
    if (questions?.length) {
      qs = questions.filter(q =>
        q.question &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        typeof q.answerIndex === "number"
      );
    } else if (prompt) {
      try {
        qs = await generateAIQuestions(prompt, 5);
      } catch (e) {
        console.warn("⚠️ Falling back to dummy questions:", e.message);
        qs = generateQuestionsFromPrompt(prompt);
      }
    } else {
      qs = generateQuestionsFromPrompt("General");
    }

    // 2. Save quiz
    const quiz = await Quiz.create({ title, prompt, questions: qs, hostId: req.user._id });

    // 3. Generate quiz link
    const client = process.env.CLIENT_URL || "http://localhost:3000";
    const link = `${client}/quiz/${quiz._id}`;

    // 4. Send invites if emails provided
    let results = [];
    if (emails && emails.length > 0) {
      for (const email of emails) {
        try {
          const id = await sendInvite(email, link, quiz.title);
          results.push({ email, id });
        } catch (err) {
          console.error("Failed to send invite to", email, err);
          results.push({ email, error: err.message });
        }
      }
    }

    res.status(201).json({
      message: "✅ Quiz created" + (results.length ? " and invites sent" : ""),
      quiz,
      results,
    });

  } catch (e) {
    console.error("Create quiz error:", e);
    res.status(500).json({ msg: "Server error", error: e.message });
  }
}

// ✅ Get single quiz
export async function getQuiz(req, res) {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return res.status(404).json({ msg: "Quiz not found" });
  res.json(quiz);
}

// ✅ Get all quizzes created by host
export async function getHostQuizzes(req, res) {
  const quizzes = await Quiz.find({ hostId: req.user._id }).sort({ createdAt: -1 });
  res.json(quizzes);
}

// ✅ Invite participants again (manual trigger)
export async function invite(req, res) {
  try {
    const { emails } = req.body;
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ msg: "Quiz not found" });
    if (String(quiz.hostId) !== String(req.user._id)) {
      return res.status(403).json({ msg: "Forbidden" });
    }

    if (!emails || !emails.length) {
      return res.status(400).json({ msg: "No emails provided" });
    }

    const client = process.env.CLIENT_URL || "http://localhost:3000";
    const link = `${client}/quiz/${quiz._id}`;
    const results = [];

    for (const email of emails) {
      try {
        const id = await sendInvite(email, link, quiz.title);
        results.push({ email, id });
      } catch (err) {
        console.error("Failed to send invite to", email, err);
        results.push({ email, error: err.message });
      }
    }

    res.json({ sent: results.length, results });
  } catch (e) {
    console.error("Invite error:", e);
    res.status(500).json({ msg: "Invite failed", error: e.message });
  }
}

// ✅ Export CSV of quiz submissions
export async function exportCSV(req, res) {
  try {
    const quizId = req.params.id;
    const subs = await Submission.find({ quizId }).populate("studentId", "name email");
    const rows = subs.map(s => ({
      student: s.studentId?.name || "Unknown",
      email: s.studentId?.email || "",
      score: s.score,
      submittedAt: s.createdAt
    }));

    const csv = toCSV(rows, ["student", "email", "score", "submittedAt"]);
    res.header("Content-Type", "text/csv");
    res.attachment(`quiz-${quizId}-results.csv`);
    return res.send(csv);
  } catch (e) {
    console.error("CSV export failed:", e);
    res.status(500).json({ msg: "CSV export failed", error: e.message });
  }
}
