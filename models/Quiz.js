import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  question: String,
  options: [String],
  answerIndex: Number
}, { _id: false });

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  prompt: { type: String },
  questions: { type: [questionSchema], default: [] },
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

export default mongoose.model("Quiz", quizSchema);
