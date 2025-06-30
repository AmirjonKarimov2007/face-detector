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

// Faylni diskka yozmasdan saqlash (buffer mode)
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post("/send-photo", upload.single("photo"), async (req, res) => {
  const { user_id, tg_fullname, tg_username } = req.body;
  const fileBuffer = req.file.buffer;

  const caption = `
🧑‍💻 <b>Foydalanuvchi:</b>
Ism: ${tg_fullname}
Username: @${tg_username}
ID: ${user_id}`.trim();

  try {
    const tgForm = new FormData();
    tgForm.append("chat_id", user_id);
    tgForm.append("photo", fileBuffer, {
      filename: "photo.png",
      contentType: "image/png"
    });
    tgForm.append("caption", caption);
    tgForm.append("parse_mode", "HTML");

    await axios.post(TELEGRAM_API, tgForm, {
      headers: tgForm.getHeaders()
    });

    console.log("✅ Telegramga yuborildi");
    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Yuborilmadi:", err.message);
    res.status(500).json({ error: "Telegramga yuborishda xatolik" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ WebApp: http://localhost:${PORT}`);
});
