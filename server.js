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
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;

app.use(express.static(path.join(__dirname, "public")));

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post("/send-photo", upload.single("photo"), async (req, res) => {
  const { user_id, tg_fullname, tg_username } = req.body;
  const fileBuffer = req.file?.buffer;

  if (!fileBuffer) {
    return res.status(400).json({ error: "Fayl topilmadi" });
  }

  const tgForm = new FormData();
  tgForm.append("chat_id", process.env.ADMIN_CHAT_ID || user_id); // fallback
  tgForm.append("photo", fileBuffer, {
    filename: "photo.png",
    contentType: "image/png"
  });

  // Faqat agar Telegram WebApp bo‘lsa — caption qo‘shamiz
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
    await axios.post(TELEGRAM_API, tgForm, {
      headers: tgForm.getHeaders()
    });

    console.log("✅ Rasm yuborildi");
    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Telegramga yuborilmadi:", err.message);
    res.status(500).json({ error: "Telegram xatolik" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ WebApp server: http://localhost:${PORT}`);
});
