const express = require("express");
const axios = require("axios");
const { config } = require("dotenv");
const bodyParser = require("body-parser");

config();
const app = express();
app.use(bodyParser.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const WEBAPP_URL = process.env.WEBAPP_URL;

// Webhook endpoint
app.post("/webhook", async (req, res) => {
  const msg = req.body.message;

  if (!msg || !msg.text) return res.sendStatus(200);

  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === "/start") {
    await sendWebAppWelcome(chatId);
  } else if (text === "/help") {
    await sendMessage(chatId, "ℹ️ Ushbu bot siz haqingizda kamera orqali ma'lumot to‘playdi.");
  } else {
    await sendMessage(chatId, "🤖 Noma'lum buyruq. /start yoki /help ni yuboring.");
  }

  res.sendStatus(200);
});

// 🔘 /start bosilganda WebApp taklif qiladi
async function sendWebAppWelcome(chatId) {
  const keyboard = {
    inline_keyboard: [
      [
        {
          text: "📲 WebApp'ga kirish",
          web_app: {
            url: WEBAPP_URL
          }
        }
      ]
    ]
  };

  await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: chatId,
    text: "👋 Salom! Quyidagi tugma orqali WebApp'ga o‘ting:",
    reply_markup: keyboard
  });
}

// ✉️ Oddiy xabar yuborish
async function sendMessage(chatId, text) {
  await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: chatId,
    text
  });
}

const PORT = 3000;
app.listen(PORT, () => {
  console.log("🤖 Bot serveri ishga tushdi:", PORT);
});
