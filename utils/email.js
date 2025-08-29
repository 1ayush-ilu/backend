import nodemailer from "nodemailer";

function createTransporter() {
  console.log("📧 Using EMAIL_USER:", process.env.EMAIL_USER);
  console.log("📧 Using EMAIL_PASS:", process.env.EMAIL_PASS ? "✅ Loaded" : "❌ Not Loaded");

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // use TLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

export async function sendInvite(toEmail, quizLink, title) {
  try {
    const transporter = createTransporter(); // ✅ create fresh with env values

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      quizLink
    )}`;

    const info = await transporter.sendMail({
      from: `Quiz Conductor <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `You're invited to quiz: ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333">
          <h2>🎉 You're invited to join the quiz: <b>${title}</b></h2>
          <p>Click below to join:</p>
          <p>
            <a href="${quizLink}" target="_blank" style="background:#4CAF50;color:white;padding:10px 15px;border-radius:5px;text-decoration:none;">
              Join Quiz
            </a>
          </p>
          <p>Or scan the QR code:</p>
          <img src="${qrCodeUrl}" alt="Quiz QR Code" style="margin-top:10px;border:1px solid #ccc;padding:5px;" />
          <br/><br/>
          <p style="font-size:12px;color:#666">Powered by Quiz Conductor</p>
        </div>
      `,
    });

    console.log("✅ Email sent successfully:", info.messageId);
    return info.messageId;
  } catch (err) {
    console.error("❌ Email send failed:", err);
    throw err;
  }
}
export async function verifyTransport() {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log("✅ Email transporter verified successfully");
    return true;
  } catch (err) {
    console.error("❌ Transport verify failed:", err);
    return false;
  }
}

