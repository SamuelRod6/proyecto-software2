const nodemailer = require("nodemailer");

function parseSecureValue() {
  const raw = (process.env.SMTP_SECURE || "").trim().toLowerCase();
  if (raw === "true") {
    return true;
  }
  if (raw === "false") {
    return false;
  }

  const port = Number(process.env.SMTP_PORT || 0);
  return port === 465;
}

function createTransporter() {
  const host = (process.env.SMTP_HOST || "").trim();
  const from = (process.env.SMTP_FROM || "").trim();
  const pass = (process.env.SMTP_PASS || "").trim();
  const user = (process.env.SMTP_USER || from).trim();
  const secure = parseSecureValue();
  const port = Number(process.env.SMTP_PORT || (secure ? 465 : 587));

  if (!host || !from || !pass) {
    throw new Error("SMTP_HOST, SMTP_FROM and SMTP_PASS must be configured");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

async function sendEmail(payload) {
  const transporter = createTransporter();
  const configuredFrom = (process.env.SMTP_FROM || "").trim();
  const staticCc = (process.env.SMTP_CC || "").trim();
  const cc = [];

  if (payload.cc) {
    cc.push(payload.cc);
  }
  if (staticCc) {
    cc.push(staticCc);
  }

  const message = {
    from: configuredFrom,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
  };

  if (cc.length > 0) {
    message.cc = cc.join(",");
  }

  await transporter.sendMail(message);
}

module.exports = {
  sendEmail,
};
