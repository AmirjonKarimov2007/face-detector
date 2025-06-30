const express = require("express");
const path = require("path");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const { config } = require("dotenv");

config();

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;

app.use(express.static(path.join(__dirname, "public")));

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post("/send-photo", upload.single("photo"), async (req, res) => {
  const { user_id, tg_fullname, tg_username } = req.body;
  const fileBuffer = req.file?.buffer;

  if (!fileBuffer) return res.status(400).json({ error: "Rasm yo‘q" });

  const caption = `
🧑‍💻 <b>Foydalanuvchi:</b>
Ism: ${tg_fullname || "Nomaʼlum"}
Username: @${tg_username || "yo‘q"}
ID: ${user_id || "nomaʼlum"}
`.trim();

  const form = new FormData();
  form.append("chat_id", ADMIN_CHAT_ID || user_id);
  form.append("photo", fileBuffer, {
    filename: "photo.png",
    contentType: "image/png"
  });
  form.append("caption", caption);
  form.append("parse_mode", "HTML");

  try {
    await axios.post(TELEGRAM_API, form, {
      headers: form.getHeaders()
    });

    console.log("✅ Rasm botga yuborildi");
    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Telegram xatolik:", err.message);
    res.status(500).json({ error: "Telegramga yuborilmadi" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ WebApp server ishga tushdi: http://localhost:${PORT}`);
});
