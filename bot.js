require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");
const { createCanvas, loadImage, registerFont } = require("canvas");
const fs = require("fs");
const express = require("express");

if (!process.env.BOT_TOKEN) {
  console.error("❌ BOT_TOKEN is missing in .env file!");
  process.exit(1);
}

// Create an Express app to bind to the port on Render
const app = express();
const port = process.env.PORT || 3200; // Make sure your bot listens on the correct port

// دالة لكتابة النص مع التحكم في العرض الأقصى
function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  let words = text.split(" ");
  let line = "";

  for (let i = 0; i < words.length; i++) {
    let testLine = line + words[i] + " ";
    let metrics = ctx.measureText(testLine);
    let testWidth = metrics.width;

    if (testWidth > maxWidth && i > 0) {
      ctx.strokeText(line, x, y);
      ctx.fillText(line, x, y);
      line = words[i] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.strokeText(line, x, y);
  ctx.fillText(line, x, y);
}

const bot = new Telegraf(process.env.BOT_TOKEN);
console.log("✅ Bot is starting...");

// تسجيل خط "Cairo"
registerFont("Cairo-Bold.ttf", { family: "Cairo" });

// دالة لإنشاء صورة ترحيبية بأسلوب ناروتو
async function generateWelcomeImage(username) {
  console.log(`🖼 Generating image for: ${username}`);

  const width = 500;
  const height = 328;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  try {
    // تحميل الخلفية
    const background = await loadImage("welcome.png");
    ctx.drawImage(background, 0, 0, width, height);
  } catch (err) {
    console.error("❌ Failed to load welcome.png:", err);
  }

  // إعداد النصوص
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 4;
  const marginX = 10; // Horizontal margin (left and right)
  const marginY = 40; // Vertical margin for text

  // عنوان الترحيب
  ctx.font = "bold 25px Cairo";
  ctx.strokeText(`${username}`, width / 2, 100 + marginY); // Adjusted Y position for margin
  ctx.fillText(`${username}`, width / 2, 100 + marginY); // Adjusted Y position for margin

  // حفظ الصورة
  const filePath = `welcome_${username}.jpeg`;
  const buffer = canvas.toBuffer("image/jpeg");
  fs.writeFileSync(filePath, buffer);

  console.log("✅ Image generated:", filePath);
  return filePath;
}

// عند دخول عضو جديد
bot.on("new_chat_members", async (ctx) => {
  console.log("👤 New member detected!");

  for (const member of ctx.message.new_chat_members) {
    const username = member.first_name || "User";
    const imagePath = await generateWelcomeImage(username);

    // إرسال الصورة مع زر لقناة اليوتيوب
    await ctx.replyWithPhoto(
      { source: imagePath },
      {
        caption: `🌟 أهلا وسهلا بك ${username}! نورت السيرفر 🚀`,
        reply_markup: Markup.inlineKeyboard([
          Markup.button.url("🔗 قناتنا على يوتيوب", "https://www.youtube.com/@noorboi6706"),
        ]),
      }
    );

    // حذف الصورة بعد الإرسال
    fs.unlinkSync(imagePath);
    console.log("🗑 Image deleted:", imagePath);
  }
});

// تشغيل البوت
bot
  .launch()
  .then(() => {
    console.log("🚀 Bot is running...");
  })
  .catch((err) => {
    console.error("❌ Bot launch failed:", err);
  });

// التحقق من اتصال البوت
bot.telegram
  .getMe()
  .then((botInfo) => {
    console.log(`🤖 Connected as ${botInfo.username}`);
  })
  .catch((err) => {
    console.error("❌ Bot connection failed:", err);
    process.exit(1);
  });

// Add a simple route to keep the app alive
app.get("/", (req, res) => {
  res.send("Hello, the bot is running!");
});

// Start the Express app
app.listen(port, () => {
  console.log(`🌍 Express app listening on port ${port}`);
});
