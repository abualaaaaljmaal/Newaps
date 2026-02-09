const fs = require("fs");
const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");

const TOKEN = "8588784774:AAHuVdnTaIUlW-01cDn_HU8_UguTLgrLTbk";
const bot = new TelegramBot(TOKEN, { polling: true });

function extractGithubRepo(url) {
  const regex = /https?:\/\/github\.com\/([^/]+)\/([^/]+)/;
  const match = url.match(regex);

  if (!match) return null;

  const user = match[1];
  const repo = match[2].replace(".git", "");
  return { user, repo };
}

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `👋 Welcome!

📦 Send me a GitHub repository link and I will download it as ZIP.

✅ Example:
https://github.com/user/repo

━━━━━━━━━━━━━━━━━━━━
© Rights محفوظة لـ: هيثم محمود الجمال
━━━━━━━━━━━━━━━━━━━━`
  );
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || text.startsWith("/start")) return;

  const repoInfo = extractGithubRepo(text);

  if (!repoInfo) {
    return bot.sendMessage(chatId, "❌ Please send a valid GitHub repository link.");
  }

  const { user, repo } = repoInfo;

  let zipUrl = `https://github.com/${user}/${repo}/archive/refs/heads/main.zip`;
  const fileName = `${repo}.zip`;

  bot.sendMessage(chatId, "⏳ Downloading...");

  try {
    let response = await axios.get(zipUrl, { responseType: "arraybuffer" });

    if (response.status !== 200) {
      zipUrl = `https://github.com/${user}/${repo}/archive/refs/heads/master.zip`;
      response = await axios.get(zipUrl, { responseType: "arraybuffer" });
    }

    fs.writeFileSync(fileName, response.data);

    await bot.sendDocument(chatId, fileName);

    fs.unlinkSync(fileName);

    bot.sendMessage(chatId, "✅ Done Download.\n© هيثم محمود الجمال");
  } catch (err) {
    bot.sendMessage(chatId, "⚠️ Error: Repo not found or download failed.");
  }
});

console.log("Bot Running...");