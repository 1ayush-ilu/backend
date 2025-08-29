import express from "express";
import { sendInvite } from "../utils/email.js";

const router = express.Router();
import { verifyTransport } from "../utils/email.js";

router.get("/send-test", async (req, res) => {
  try {
    const msgId = await sendInvite(
      "yoursecondemail@gmail.com",   // 👈 put another email you own
      "http://localhost:3000/quiz/test",
      "Sample Quiz"
    );
    res.send("✅ Test email sent! Message ID: " + msgId);
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Error: " + err.message);
  }
});

export default router;


router.get("/verify", async (req, res) => {
  try {
    const ok = await verifyTransport();
    res.send("✅ SMTP verified");
  } catch (e) {
    res.status(500).send("❌ SMTP verify failed: " + e.message);
  }
});

router.get("/send", async (req, res) => {
  try {
    const to = req.query.to || "yoursecondemail@example.com";
    const id = await sendInvite(to, process.env.CLIENT_URL + "/quiz/test", "Test Quiz");
    res.send("✅ Sent to " + to + " (id: " + id + ")");
  } catch (e) {
    res.status(500).send("❌ Send failed: " + e.message);
  }
});
