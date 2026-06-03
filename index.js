const { Client, GatewayIntentBits, AttachmentBuilder } = require("discord.js");
const fs = require("fs");
const { createCanvas, loadImage } = require("canvas");

const TOKEN = process.env.TOKEN;
const prefix = "!";
const file = "bank.json";

if (!TOKEN) {
  console.log("TOKEN is missing");
  process.exit(1);
}

if (!fs.existsSync(file)) fs.writeFileSync(file, "{}");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

function loadDB() {
  return JSON.parse(fs.readFileSync(file));
}

function saveDB(data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function getUser(data, id) {
  if (!data[id]) {
    data[id] = {
      cash: 2000,
      bank: 0,
      job: "بدون وظيفة",
      bag: [],
      level: 1,
      xp: 0,
      lastDaily: 0,
      lastSalary: 0,
      lastRob: 0
    };
  }
  return data[id];
}

function money(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return String(num);
}

function addXP(user, amount) {
  user.xp += amount;
  const need = user.level * 500;

  if (user.xp >= need) {
    user.xp -= need;
    user.level++;
  }
}

async function sendCard(message, title, lines, color = "#d6a21c") {
  const canvas = createCanvas(900, 460);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#160f04";
  ctx.fillRect(0, 0, 900, 460);

  ctx.fillStyle = "#3a2708";
  ctx.fillRect(35, 35, 830, 390);

  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.strokeRect(35, 35, 830, 390);

  ctx.direction = "rtl";
  ctx.textAlign = "right";

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 46px Arial";
  ctx.fillText(title, 810, 95);

  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(90, 130);
  ctx.lineTo(810, 130);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 30px Arial";

  let y = 190;
  for (const line of lines) {
    ctx.fillText(line, 810, y);
    y += 55;
  }

  const avatarURL = message.author.displayAvatarURL({
    extension: "png",
    size: 128
  });

  try {
    const avatar = await loadImage(avatarURL);

    ctx.save();
    ctx.beginPath();
    ctx.arc(150, 230, 75, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 75, 155, 150, 150);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(150, 230, 78, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 7;
    ctx.stroke();
  } catch {}

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 24px Arial";
  ctx.fillText(message.author.username, 150, 340);

  ctx.fillStyle = "#b8b8b8";
  ctx.font = "22px Arial";
  ctx.fillText("Our House Bank", 450, 445);

  const attachment = new AttachmentBuilder(canvas.toBuffer(), {
    name: "bank-card.png"
  });

  return message.reply({ files: [attachment] });
}

async function sendBalance(message, user) {
  const canvas = createCanvas(900, 500);
  const ctx = canvas.getContext("2d");

  const total = user.cash + user.bank;
  const need = user.level * 500;
  const percent = Math.min(user.xp / need, 1);

  ctx.fillStyle = "#160f04";
  ctx.fillRect(0, 0, 900, 500);

  ctx.fillStyle = "#3a2708";
  ctx.fillRect(40, 40, 820, 420);

  ctx.strokeStyle = "#d6a21c";
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 40, 820, 420);

  ctx.direction = "rtl";
  ctx.textAlign = "right";

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 44px Arial";
  ctx.fillText("رصيدك في البنك", 810, 90);

  ctx.fillStyle = "#ffcc33";
  ctx.font = "bold 28px Arial";
  ctx.fillText(`المستوى ${user.level}`, 810, 130);

  ctx.fillStyle = "#dddddd";
  ctx.font = "28px Arial";
  ctx.fillText("الرصيد الحالي", 810, 190);

  ctx.fillStyle = "#ffcc33";
  ctx.font = "bold 60px Arial";
  ctx.fillText(`$${money(total)}`, 810, 255);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 29px Arial";
  ctx.fillText(`الكاش: $${money(user.cash)}`, 810, 325);
  ctx.fillText(`البنك: $${money(user.bank)}`, 810, 370);
  ctx.fillText(`الوظيفة: ${user.job}`, 810, 415);

  const avatarURL = message.author.displayAvatarURL({
    extension: "png",
    size: 128
  });

  try {
    const avatar = await loadImage(avatarURL);

    ctx.save();
    ctx.beginPath();
    ctx.arc(160, 240, 80, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 80, 160, 160, 160);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(160, 240, 84, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffcc33";
    ctx.lineWidth = 8;
    ctx.stroke();
  } catch {}

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 25px Arial";
  ctx.fillText(message.author.username, 160, 360);

  ctx.fillStyle = "#111111";
  ctx.fillRect(270, 430, 560, 18);

  ctx.fillStyle = "#ffb300";
  ctx.fillRect(270, 430, 560 * percent, 18);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 18px Arial";
  ctx.fillText(`${user.xp} / ${need} XP`, 550, 415);

  ctx.fillStyle = "#b8b8b8";
  ctx.font = "21px Arial";
  ctx.fillText("Our House Bank", 450, 485);

  const attachment = new AttachmentBuilder(canvas.toBuffer(), {
    name: "balance.png"
  });

  return message.reply({ files: [attachment] });
}

const shop = {
  لابتوب: { name: "لابتوب", price: 5000 },
  سيارة: { name: "سيارة", price: 25000 },
  بيت: { name: "بيت", price: 100000 },
  جوال: { name: "جوال", price: 3000 },
  ساعة: { name: "ساعة", price: 1500 }
};

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift();

  const data = loadDB();
  const user = getUser(data, message.author.id);

  if (cmd === "اوامر") {
    return sendCard(message, "أوامر البنك", [
      "!رصيد",
      "!يومي | !راتب | !عمل",
      "!ايداع 1000 | !سحب 1000",
      "!تحويل @شخص 500 | !سرقة @شخص",
      "!متجر | !شراء لابتوب | !حقيبة | !توب"
    ]);
  }

  if (cmd === "رصيد") {
    return sendBalance(message, user);
  }

  if (cmd === "يومي") {
    const now = Date.now();

    if (now - user.lastDaily < 86400000) {
      return sendCard(message, "اليومية", ["لقد استلمت اليومية بالفعل"]);
    }

    user.cash += 1500;
    user.lastDaily = now;
    addXP(user, 50);
    saveDB(data);

    return sendCard(message, "اليومية", ["استلمت 1500", `رصيدك الآن: $${money(user.cash)}`]);
  }

  if (cmd === "عمل") {
    const jobs = ["حارس", "مبرمج", "تاجر", "سائق", "مهندس", "طبيب"];
    user.job = jobs[Math.floor(Math.random() * jobs.length)];
    addXP(user, 25);
    saveDB(data);

    return sendCard(message, "الوظيفة", [`وظيفتك الآن: ${user.job}`]);
  }

  if (cmd === "راتب") {
    const now = Date.now();

    if (now - user.lastSalary < 3600000) {
      return sendCard(message, "الراتب", ["يمكنك أخذ الراتب كل ساعة"]);
    }

    const salary = Math.floor(Math.random() * 900) + 500;
    user.cash += salary;
    user.lastSalary = now;
    addXP(user, 40);
    saveDB(data);

    return sendCard(message, "الراتب", [`استلمت راتب: ${salary}`, `الكاش: $${money(user.cash)}`]);
  }

  if (cmd === "ايداع") {
    const amount = Number(args[0]);

    if (!amount || amount <= 0) return sendCard(message, "خطأ", ["اكتب مبلغ صحيح"]);
    if (user.cash < amount) return sendCard(message, "خطأ", ["الكاش غير كاف"]);

    user.cash -= amount;
    user.bank += amount;
    saveDB(data);

    return sendCard(message, "إيداع", [`تم إيداع ${amount}`, `رصيد البنك: $${money(user.bank)}`]);
  }

  if (cmd === "سحب") {
    const amount = Number(args[0]);

    if (!amount || amount <= 0) return sendCard(message, "خطأ", ["اكتب مبلغ صحيح"]);
    if (user.bank < amount) return sendCard(message, "خطأ", ["رصيد البنك غير كاف"]);

    user.bank -= amount;
    user.cash += amount;
    saveDB(data);

    return sendCard(message, "سحب", [`تم سحب ${amount}`, `الكاش: $${money(user.cash)}`]);
  }

  if (cmd === "تحويل") {
    const target = message.mentions.users.first();
    const amount = Number(args[1]);

    if (!target) return sendCard(message, "خطأ", ["منشن الشخص"]);
    if (!amount || amount <= 0) return sendCard(message, "خطأ", ["اكتب مبلغ صحيح"]);
    if (user.cash < amount) return sendCard(message, "خطأ", ["الكاش غير كاف"]);

    const receiver = getUser(data, target.id);

    user.cash -= amount;
    receiver.cash += amount;
    saveDB(data);

    return sendCard(message, "تحويل", [`تم تحويل ${amount}`, `إلى: ${target.username}`]);
  }

  if (cmd === "متجر") {
    return sendCard(message, "المتجر", [
      "لابتوب: 5000",
      "سيارة: 25000",
      "بيت: 100000",
      "جوال: 3000",
      "ساعة: 1500"
    ]);
  }

  if (cmd === "شراء") {
    const itemName = args[0];
    const item = shop[itemName];

    if (!item) return sendCard(message, "خطأ", ["هذا الشيء غير موجود"]);
    if (user.cash < item.price) return sendCard(message, "خطأ", ["الكاش غير كاف"]);

    user.cash -= item.price;
    user.bag.push(item.name);
    addXP(user, 30);
    saveDB(data);

    return sendCard(message, "شراء", [`اشتريت: ${item.name}`, `السعر: ${item.price}`]);
  }

  if (cmd === "حقيبة") {
    if (!user.bag.length) return sendCard(message, "الحقيبة", ["حقيبتك فارغة"]);

    return sendCard(message, "الحقيبة", user.bag.slice(0, 5));
  }

  if (cmd === "توب") {
    const top = Object.entries(data)
      .map(([id, u]) => ({ id, total: u.cash + u.bank }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const lines = top.map((u, i) => `${i + 1} - ${money(u.total)} : <@${u.id}>`);

    return sendCard(message, "توب الأغنياء", lines.length ? lines : ["لا يوجد بيانات"]);
  }

  if (cmd === "معلومات") {
    const target = message.mentions.users.first() || message.author;
    const info = getUser(data, target.id);

    return sendCard(message, `معلومات ${target.username}`, [
      `الكاش: $${money(info.cash)}`,
      `البنك: $${money(info.bank)}`,
      `الوظيفة: ${info.job}`,
      `المستوى: ${info.level}`,
      `XP: ${info.xp}`
    ]);
  }
});

client.login(TOKEN);
