const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const { body, validationResult } = require("express-validator");
const mailer = require("./mailer");

dotenv.config();

const app = express();
const port = Number(process.env.MAILER_SERVER_PORT || 3000);
const authorizationKey = (process.env.MAILER_AUTHORIZATION_KEY || "").trim();
const whitelist = (process.env.MAILER_WHITELIST || "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

function canBypassSecurity() {
  return whitelist.length === 0 && authorizationKey === "";
}

function corsOptionsDelegate(req, callback) {
  if (canBypassSecurity()) {
    return callback(null, true);
  }

  const origin = req.header("origin") || "";
  const authorizationHeader = req.header("authorization") || "";
  const isWhitelistedOrigin = whitelist.includes(origin);
  const hasValidKey = authorizationKey !== "" && authorizationHeader === authorizationKey;

  if (!isWhitelistedOrigin && !hasValidKey) {
    return callback(new Error("Not allowed by CORS"));
  }

  return callback(null, true);
}

app.use(express.json({ limit: "1mb" }));
app.get("/health", (_req, res) => res.status(200).json({ ok: true }));
app.options("/send", cors(corsOptionsDelegate));
app.post(
  "/send",
  cors(corsOptionsDelegate),
  body("from").isEmail().normalizeEmail(),
  body("to").isEmail().normalizeEmail(),
  body("cc").optional().isEmail().normalizeEmail(),
  body("subject").not().isEmpty().trim().isLength({ min: 2 }),
  body("html").not().isEmpty().trim().isLength({ min: 2 }),
  body("text").not().isEmpty().trim().isLength({ min: 2 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      await mailer.sendEmail(req.body);
      return res.sendStatus(200);
    } catch (error) {
      const message = error && error.message ? error.message : "unexpected mailer error";
      console.error("mail delivery error:", message);
      return res.status(500).json({ error: message });
    }
  }
);

app.use((_req, res) => {
  res.sendStatus(404);
});

app.use((error, _req, res, _next) => {
  if (error && error.message === "Not allowed by CORS") {
    return res.sendStatus(401);
  }
  return res.sendStatus(500);
});

app.listen(port, () => {
  console.log(`Private mailer API listening on :${port}`);
});
