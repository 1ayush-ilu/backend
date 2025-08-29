import jwt from "jsonwebtoken";
import User from "../models/User.js";

function sign(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

export async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;
    const user = await User.create({ name, email, password, role });
    res.json({ token: sign(user), user: { id: user._id, name, email, role: user.role } });
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ msg: "Email already exists" });
    res.status(500).json({ msg: "Server error" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(400).json({ msg: "Invalid credentials" });
    res.json({ token: sign(user), user: { id: user._id, name: user.name, email, role: user.role } });
  } catch {
    res.status(500).json({ msg: "Server error" });
  }
}
