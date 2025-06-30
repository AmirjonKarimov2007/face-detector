const TelegramBot = require("node-telegram-bot-api");
const dotenv = require("dotenv");

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log("🤖 Yangi JS Telegram bot ishga tushdi...");

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "📲 WebApp'ga kirish",
            web_app: { url: WEBAPP_URL },
          },
        ],
      ],
    },
  };

  bot.sendMessage(chatId, "👋 Salom! Quyidagi tugma orqali WebApp'ga o‘ting:", keyboard);
});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, "ℹ️ Bu botni sizga albatta yordam beradi,botni ishlatish uchun /start ni bosing.");
});

bot.on("message", (msg) => {
  if (!msg.text.startsWith("/")) {
    bot.sendMessage(msg.chat.id, "🤖 Noma'lum buyruq. /start yoki /help ni yuboring.");
  }
});
