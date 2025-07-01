const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const dotenv = require("dotenv");
const fs = require("fs").promises;
const path = require("path");
const multer = require("multer");

dotenv.config();

const app = express();
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });
const adminChatId = process.env.ADMIN_CHAT_ID || "1612270615";
const uploadDir = path.join(__dirname, "uploads");
const scoresFile = path.join(__dirname, "scores.json");

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(uploadDir, { recursive: true, mode: 0o777 });
      cb(null, uploadDir);
    } catch (err) {
      console.error("Uploads papkasi yaratishda xato:", err);
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    cb(null, `photo_${Date.now()}.jpg`);
  }
});
const upload = multer({ storage });

app.use(express.json());
app.use(express.static("public"));

async function initScoresFile() {
  try {
    await fs.access(scoresFile);
  } catch {
    console.log("scores.json fayli yo‘q, yangi fayl yaratilmoqda...");
    await fs.writeFile(scoresFile, JSON.stringify({ scores: {} }, null, 2), { mode: 0o666 });
  }
}

app.post("/send-photo", upload.single("photo"), async (req, res) => {
  try {
    const { user_id, tg_fullname, tg_username } = req.body;
    const photoPath = req.file?.path;

    if (!photoPath) {
      throw new Error("Rasm fayli topilmadi");
    }

    await bot.sendPhoto(adminChatId, photoPath, {
      caption: `Foydalanuvchi: ${tg_fullname || "Noma'lum"} (@${tg_username || "yo‘q"})\nID: ${user_id}`,
    });

    await fs.unlink(photoPath);
    res.status(200).send("OK");
  } catch (err) {
    console.error("Xato (send-photo):", err);
    await bot.sendMessage(adminChatId, `Xato (send-photo): ${err.message}`);
    res.status(500).send("Xato yuz berdi");
  }
});

app.post("/log-error", async (req, res) => {
  try {
    const { error, userId } = req.body;
    await bot.sendMessage(adminChatId, `Xato: ${error}\nFoydalanuvchi ID: ${userId}`);
    res.status(200).send("OK");
  } catch (err) {
    console.error("Xato loglashda xato:", err);
    res.status(500).send("Xato loglashda xato");
  }
});

app.post("/save-score", async (req, res) => {
  try {
    const { userId, username, score } = req.body;
    if (!userId || !username || typeof score !== "number" || score < 0) {
      throw new Error("Noto‘g‘ri ma’lumotlar: userId, username yoki score xato");
    }
    await initScoresFile();
    const data = JSON.parse(await fs.readFile(scoresFile, "utf8"));
    data.scores[userId] = { username, score };
    await fs.writeFile(scoresFile, JSON.stringify(data, null, 2), { mode: 0o666 });
    res.status(200).send("OK");
  } catch (err) {
    console.error("Natija saqlashda xato:", err);
    await bot.sendMessage(adminChatId, `Natija saqlashda xato: ${err.message}`);
    res.status(500).send("Natija saqlashda xato");
  }
});

app.get("/get-scores", async (req, res) => {
  try {
    await initScoresFile();
    const data = JSON.parse(await fs.readFile(scoresFile, "utf8"));
    res.json(data);
  } catch (err) {
    console.error("Reyting olishda xato:", err);
    await bot.sendMessage(adminChatId, `Reyting olishda xato: ${err.message}`);
    res.status(500).send("Reyting olishda xato");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  try {
    await fs.mkdir(uploadDir, { recursive: true, mode: 0o777 });
    await initScoresFile();
    console.log(`Server ${PORT}-portda ishlamoqda`);
  } catch (err) {
    console.error("Server ishga tushirishda xato:", err);
    await bot.sendMessage(adminChatId, `Server ishga tushirishda xato: ${err.message}`);
  }
});
