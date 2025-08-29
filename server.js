import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import http from "http";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import quizRoutes from "./routes/quiz.js";
import makeSubmissionRouter from "./routes/submission.js";
import testRoutes from "./routes/testRoutes.js";




console.log("Loaded OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "✅ Loaded" : "❌ Missing");
console.log("Loaded EMAIL_USER:", process.env.EMAIL_USER);
console.log("Loaded EMAIL_PASS:", process.env.EMAIL_PASS ? "✅ Loaded" : "❌ Missing");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL?.split(",") || ["http://localhost:3000"], credentials: true }
});

io.on("connection", (socket) => {
  socket.on("quiz:join", (quizId) => socket.join(String(quizId)));
});

app.use(cors({ origin: process.env.CLIENT_URL?.split(",") || ["http://localhost:3000"], credentials: true }));
app.use(express.json());

app.get("/", (req, res) => res.send("Quiz Conductor API"));
app.use("/api/auth", authRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/test", testRoutes);
app.use("/api", makeSubmissionRouter(io));

const PORT = process.env.PORT || 5000;
connectDB(process.env.MONGO_URI).then(() => {
  server.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));
});


