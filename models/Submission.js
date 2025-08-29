import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  answers: [{ type: Number }],
  score: { type: Number, default: 0 }
}, { timestamps: true });

submissionSchema.index({ quizId: 1, studentId: 1 }, { unique: true });

export default mongoose.model("Submission", submissionSchema);
