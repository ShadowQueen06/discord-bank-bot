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

const shop = {
  لابتوب: { name: "لابتوب", price: 5000 },
  جوال: { name: "جوال", price: 3000 },
  ساعة: { name: "ساعة", price: 1500 },
  سيارة: { name: "سيارة", price: 25000 },
  دراجة: { name: "دراجة", price: 8000 },
  بيت: { name: "بيت", price: 100000 },
  قصر: { name: "قصر", price: 500000 },
  مزرعة: { name: "مزرعة", price: 75000 },
  متجر: { name: "متجر", price: 150000 },
  شركة: { name: "شركة", price: 1000000 },
  ذهب: { name: "ذهب", price: 20000 },
  ألماس: { name: "ألماس", price: 60000 },
  طائرة: { name: "طائرة", price: 2000000 },
  يخت: { name: "يخت", price: 1500000 }
};

async function sendCard(message, title, lines, color = "#d6a21c") {
  const canvas = createCanvas(1400, 700);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#160f04";
  ctx.fillRect(0, 0, 1400, 700);

  ctx.fillStyle = "#3a2708";
  ctx.fillRect(50, 50, 1300, 570);

  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.strokeRect(50, 50, 1300, 570);

  ctx.direction = "rtl";
  ctx.textAlign = "right";

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 62px Arial";
  ctx.fillText(title, 1260, 125);

  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(110, 170);
  ctx.lineTo(1260, 170);
  ctx.stroke();

  let y = 240;

  for (const line of lines.slice(0, 7)) {
    ctx.fillStyle = "#504735";
    ctx.fillRect(120, y - 42, 1140, 62);

    ctx.strokeStyle = "#7a5c16";
    ctx.lineWidth = 2;
    ctx.strokeRect(120, y - 42, 1140, 62);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 34px Arial";
    ctx.fillText(line, 1210, y);

    y += 75;
  }

  const avatarURL = message.author.displayAvatarURL({
    extension: "png",
    size: 256
  });

  try {
    const avatar = await loadImage(avatarURL);

    ctx.save();
    ctx.beginPath();
    ctx.arc(190, 115, 55, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 135, 60, 110, 110);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(190, 115, 58, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.stroke();
  } catch {}

  ctx.textAlign = "center";
  ctx.fillStyle = "#b8b8b8";
  ctx.font = "28px Arial";
  ctx.fillText("Our House Bank", 700, 665);

  const attachment = new AttachmentBuilder(canvas.toBuffer("image/png"), {
    name: "bank-card.png"
  });

  return message.reply({ files: [attachment] });
}

async function sendBalance(message, user) {
  const canvas = createCanvas(1400, 800);
  const ctx = canvas.getContext("2d");

  const total = user.cash + user.bank;
  const need = user.level * 500;
  const percent = Math.min(user.xp / need, 1);

  ctx.fillStyle = "#160f04";
  ctx.fillRect(0, 0, 1400, 800);

  ctx.fillStyle = "#3a2708";
  ctx.fillRect(55, 55, 1290, 680);

  ctx.strokeStyle = "#d6a21c";
  ctx.lineWidth = 5;
  ctx.strokeRect(55, 55, 1290, 680);

  ctx.direction = "rtl";
  ctx.textAlign = "right";

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 72px Arial";
  ctx.fillText("رصيدك في البنك", 1270, 135);

  ctx.fillStyle = "#ffcc33";
  ctx.font = "bold 38px Arial";
  ctx.fillText(`المستوى ${user.level}`, 1270, 190);

  ctx.fillStyle = "#dddddd";
  ctx.font = "40px Arial";
  ctx.fillText("الرصيد الحالي", 1270, 285);

  ctx.fillStyle = "#ffcc33";
  ctx.font = "bold 92px Arial";
  ctx.fillText(`$${money(total)}`, 1270, 390);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 42px Arial";
  ctx.fillText(`الكاش: $${money(user.cash)}`, 1270, 490);
  ctx.fillText(`البنك: $${money(user.bank)}`, 1270, 555);
  ctx.fillText(`الوظيفة: ${user.job}`, 1270, 620);

  const avatarURL = message.author.displayAvatarURL({
    extension: "png",
    size: 256
  });

  try {
    const avatar = await loadImage(avatarURL);

    ctx.save();
    ctx.beginPath();
    ctx.arc(270, 330, 125, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 145, 205, 250, 250);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(270, 330, 130, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffcc33";
    ctx.lineWidth = 10;
    ctx.stroke();
  } catch {}

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 36px Arial";
  ctx.fillText(message.author.username, 270, 510);

  ctx.fillStyle = "#111111";
  ctx.fillRect(430, 690, 780, 24);

  ctx.fillStyle = "#ffb300";
  ctx.fillRect(430, 690, 780 * percent, 24);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 24px Arial";
  ctx.fillText(`${user.xp} / ${need} XP`, 820, 670);

  ctx.fillStyle = "#b8b8b8";
  ctx.font = "26px Arial";
  ctx.fillText("Our House Bank", 700, 770);

  const attachment = new AttachmentBuilder(canvas.toBuffer("image/png"), {
    name: "balance.png"
  });

  return message.reply({ files: [attachment] });
}

async function sendCommands(message) {
  const canvas = createCanvas(1400, 950);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#160f04";
  ctx.fillRect(0, 0, 1400, 950);

  ctx.fillStyle = "#3a2708";
  ctx.fillRect(40, 40, 1320, 760);

  ctx.strokeStyle = "#d6a21c";
  ctx.lineWidth = 5;
  ctx.strokeRect(40, 40, 1320, 760);

  ctx.direction = "rtl";
  ctx.textAlign = "right";

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 64px Arial";
  ctx.fillText("💰 البنك والمال", 1260, 120);

  ctx.fillStyle = "#ffcc33";
  ctx.font = "bold 34px Arial";
  ctx.fillText("أوامر البنك والاقتصاد", 1260, 175);

  ctx.strokeStyle = "#d6a21c";
  ctx.beginPath();
  ctx.moveTo(100, 215);
  ctx.lineTo(1260, 215);
  ctx.stroke();

  const commands = [
    ["رصيد", "عرض رصيدك وصورة حسابك"],
    ["يومي", "استلام المكافأة اليومية"],
    ["راتب", "استلام راتبك كل ساعة"],
    ["عمل", "الحصول على وظيفة"],
    ["ايداع [مبلغ]", "إيداع المال في البنك"],
    ["سحب [مبلغ]", "سحب المال من البنك"],
    ["تحويل @شخص [مبلغ]", "تحويل المال لشخص آخر"],
    ["سرقة @شخص", "محاولة سرقة شخص"],
    ["متجر", "عرض المتجر"],
    ["شراء [اسم]", "شراء غرض من المتجر"],
    ["حقيبة", "عرض أغراضك"],
    ["توب", "أغنى الأشخاص"],
    ["معلومات @شخص", "عرض معلومات شخص"]
  ];

  commands.forEach((item, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);

    const boxX = col === 0 ? 90 : 720;
    const boxY = 250 + row * 78;

    ctx.fillStyle = "#504735";
    ctx.fillRect(boxX, boxY, 590, 58);

    ctx.strokeStyle = "#7a5c16";
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, 590, 58);

    ctx.textAlign = "right";

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 27px Arial";
    ctx.fillText(item[0], boxX + 560, boxY + 25);

    ctx.fillStyle = "#c9c9c9";
    ctx.font = "21px Arial";
    ctx.fillText(item[1], boxX + 560, boxY + 50);
  });

  const buttons = [
    "💰 البنك والمال",
    "💼 الوظائف والعمل",
    "📈 الأسهم والسوق",
    "🏙️ المدينة والبناء",
    "🏢 الشركات",
    "🎰 القمار والألعاب",
    "☠️ الجريمة والسوق",
    "⚔️ التحديات",
    "💍 الزواج والعائلة",
    "🛒 المتجر",
    "🎯 المهام",
    "🛡️ القانون"
  ];

  ctx.textAlign = "center";

  buttons.forEach((btn, i) => {
    const bx = 40 + (i % 4) * 330;
    const by = 830 + Math.floor(i / 4) * 55;

    ctx.fillStyle = i === 0 ? "#5865f2" : "#2b2522";
    ctx.fillRect(bx, by, 300, 42);

    ctx.strokeStyle = "#4a403b";
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, 300, 42);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px Arial";
    ctx.fillText(btn, bx + 150, by + 29);
  });

  ctx.fillStyle = "#b8b8b8";
  ctx.font = "24px Arial";
  ctx.fillText("Our House Bank", 700, 790);

  const attachment = new AttachmentBuilder(canvas.toBuffer("image/png"), {
    name: "commands.png"
  });

  return message.reply({ files: [attachment] });
}

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

  if (cmd === "اوامر") return sendCommands(message);

  if (cmd === "رصيد") return sendBalance(message, user);

  if (cmd === "يومي") {
    const now = Date.now();

    if (now - user.lastDaily < 86400000) {
      return sendCard(message, "اليومية", ["لقد استلمت اليومية بالفعل"]);
    }

    user.cash += 1500;
    user.lastDaily = now;
    addXP(user, 50);
    saveDB(data);

    return sendCard(message, "اليومية", [`استلمت 1500`, `رصيدك الآن: $${money(user.cash)}`]);
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
    if (target.bot) return sendCard(message, "خطأ", ["لا يمكنك التحويل لبوت"]);
    if (!amount || amount <= 0) return sendCard(message, "خطأ", ["اكتب مبلغ صحيح"]);
    if (user.cash < amount) return sendCard(message, "خطأ", ["الكاش غير كاف"]);

    const receiver = getUser(data, target.id);

    user.cash -= amount;
    receiver.cash += amount;
    saveDB(data);

    return sendCard(message, "تحويل", [`تم تحويل ${amount}`, `إلى: ${target.username}`]);
  }

  if (cmd === "سرقة") {
    const target = message.mentions.users.first();
    const now = Date.now();

    if (!target) return sendCard(message, "خطأ", ["منشن الشخص"]);
    if (target.id === message.author.id) return sendCard(message, "خطأ", ["لا يمكنك سرقة نفسك"]);
    if (target.bot) return sendCard(message, "خطأ", ["لا يمكنك سرقة بوت"]);
    if (now - user.lastRob < 7200000) return sendCard(message, "سرقة", ["يمكنك السرقة كل ساعتين"]);

    const victim = getUser(data, target.id);

    if (victim.cash < 500) {
      return sendCard(message, "سرقة", ["هذا الشخص لا يملك كاش كافي"]);
    }

    user.lastRob = now;

    const success = Math.random() < 0.45;

    if (!success) {
      const fine = 300;
      user.cash = Math.max(0, user.cash - fine);
      saveDB(data);

      return sendCard(message, "سرقة", [`فشلت السرقة`, `الغرامة: ${fine}`]);
    }

    const amount = Math.floor(Math.random() * 700) + 100;

    victim.cash -= amount;
    user.cash += amount;
    addXP(user, 60);
    saveDB(data);

    return sendCard(message, "سرقة", [`نجحت السرقة`, `أخذت: ${amount}`]);
  }

  if (cmd === "متجر") {
    return sendCard(message, "المتجر", [
      "لابتوب: 5K | جوال: 3K",
      "ساعة: 1.5K | سيارة: 25K",
      "بيت: 100K | قصر: 500K",
      "متجر: 150K | شركة: 1M",
      "ذهب: 20K | ألماس: 60K",
      "طائرة: 2M | يخت: 1.5M"
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

    return sendCard(message, "شراء", [`اشتريت: ${item.name}`, `السعر: ${money(item.price)}`]);
  }

  if (cmd === "حقيبة") {
    if (!user.bag.length) return sendCard(message, "الحقيبة", ["حقيبتك فارغة"]);

    return sendCard(message, "الحقيبة", user.bag.slice(0, 7));
  }

  if (cmd === "توب") {
    const top = Object.entries(data)
      .map(([id, u]) => ({ id, total: u.cash + u.bank }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 7);

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
