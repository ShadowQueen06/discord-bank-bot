const {
  Client,
  GatewayIntentBits,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

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
      cash: 3000,
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
  سيارة: { name: "سيارة", price: 25000, min: 18000, max: 36000 },
  دراجة: { name: "دراجة", price: 8000, min: 4000, max: 13000 },
  بيت: { name: "بيت", price: 100000, min: 70000, max: 145000 },
  قصر: { name: "قصر", price: 500000, min: 350000, max: 750000 },
  شركة: { name: "شركة", price: 1000000, min: 700000, max: 1500000 },
  بنك: { name: "بنك", price: 3000000, min: 2200000, max: 4500000 },
  طائرة: { name: "طائرة", price: 2000000, min: 1300000, max: 3200000 },
  يخت: { name: "يخت", price: 1500000, min: 900000, max: 2600000 },
  ذهب: { name: "ذهب", price: 20000, min: 10000, max: 35000 },
  ألماس: { name: "ألماس", price: 60000, min: 30000, max: 110000 },
  مصنع: { name: "مصنع", price: 750000, min: 500000, max: 1300000 },
  أسهم: { name: "أسهم", price: 50000, min: 10000, max: 120000 }
};

async function makeImage(title, lines, user = null) {
  const canvas = createCanvas(1920, 1080);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#130d04";
  ctx.fillRect(0, 0, 1920, 1080);

  ctx.fillStyle = "#332205";
  ctx.fillRect(70, 70, 1780, 850);

  ctx.strokeStyle = "#d6a21c";
  ctx.lineWidth = 8;
  ctx.strokeRect(70, 70, 1780, 850);

  ctx.direction = "rtl";
  ctx.textAlign = "right";

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 82px Arial";
  ctx.fillText(title, 1740, 170);

  ctx.strokeStyle = "#d6a21c";
  ctx.beginPath();
  ctx.moveTo(180, 230);
  ctx.lineTo(1740, 230);
  ctx.stroke();

  let y = 330;

  for (const line of lines.slice(0, 8)) {
    ctx.fillStyle = "#51442e";
    ctx.fillRect(170, y - 60, 1570, 75);

    ctx.strokeStyle = "#806320";
    ctx.lineWidth = 3;
    ctx.strokeRect(170, y - 60, 1570, 75);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 44px Arial";
    ctx.fillText(line, 1680, y - 8);

    y += 95;
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#b8b8b8";
  ctx.font = "34px Arial";
  ctx.fillText("Our House Bank", 960, 1010);

  return new AttachmentBuilder(canvas.toBuffer("image/png"), {
    name: "bank.png"
  });
}

async function sendCard(message, title, lines) {
  const img = await makeImage(title, lines);
  return message.reply({ files: [img] });
}

async function sendMenu(message) {
  const img = await makeImage("💰 نظام البنك", [
    "اختر القسم من الأزرار بالأسفل",
    "البنك والمال",
    "الوظائف والعمل",
    "المتجر والبيع",
    "الجريمة والسرقة",
    "التوب والمعلومات"
  ]);

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("menu_bank")
      .setLabel("البنك")
      .setEmoji("💰")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("menu_jobs")
      .setLabel("الوظائف")
      .setEmoji("💼")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("menu_shop")
      .setLabel("المتجر")
      .setEmoji("🛒")
      .setStyle(ButtonStyle.Success)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("menu_crime")
      .setLabel("الجريمة")
      .setEmoji("☠️")
      .setStyle(ButtonStyle.Danger),

    new ButtonBuilder()
      .setCustomId("menu_top")
      .setLabel("التوب")
      .setEmoji("🏆")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("menu_info")
      .setLabel("المعلومات")
      .setEmoji("👤")
      .setStyle(ButtonStyle.Secondary)
  );

  return message.reply({
    files: [img],
    components: [row1, row2]
  });
}

async function updateMenu(interaction, title, lines) {
  const img = await makeImage(title, lines);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("menu_home")
      .setLabel("رجوع")
      .setEmoji("⬅️")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("menu_bank")
      .setLabel("البنك")
      .setEmoji("💰")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("menu_shop")
      .setLabel("المتجر")
      .setEmoji("🛒")
      .setStyle(ButtonStyle.Success)
  );

  return interaction.update({
    files: [img],
    components: [row],
    attachments: []
  });
}

async function sendBalance(message, user) {
  const img = await makeImage("رصيدك في البنك", [
    `الكاش: $${money(user.cash)}`,
    `البنك: $${money(user.bank)}`,
    `المجموع: $${money(user.cash + user.bank)}`,
    `الوظيفة: ${user.job}`,
    `المستوى: ${user.level}`,
    `XP: ${user.xp}`
  ]);

  return message.reply({ files: [img] });
}

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId === "menu_home") {
    const img = await makeImage("💰 نظام البنك", [
      "اختر القسم من الأزرار بالأسفل",
      "البنك والمال",
      "الوظائف والعمل",
      "المتجر والبيع",
      "الجريمة والسرقة",
      "التوب والمعلومات"
    ]);

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("menu_bank").setLabel("البنك").setEmoji("💰").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("menu_jobs").setLabel("الوظائف").setEmoji("💼").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("menu_shop").setLabel("المتجر").setEmoji("🛒").setStyle(ButtonStyle.Success)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("menu_crime").setLabel("الجريمة").setEmoji("☠️").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("menu_top").setLabel("التوب").setEmoji("🏆").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("menu_info").setLabel("المعلومات").setEmoji("👤").setStyle(ButtonStyle.Secondary)
    );

    return interaction.update({
      files: [img],
      components: [row1, row2],
      attachments: []
    });
  }

  if (interaction.customId === "menu_bank") {
    return updateMenu(interaction, "💰 البنك والمال", [
      "!رصيد",
      "!يومي",
      "!ايداع 1000",
      "!سحب 1000",
      "!تحويل @شخص 500"
    ]);
  }

  if (interaction.customId === "menu_jobs") {
    return updateMenu(interaction, "💼 الوظائف والعمل", [
      "!عمل",
      "!راتب",
      "الراتب كل ساعة",
      "العمل يعطيك وظيفة",
      "كل أمر يزيد XP"
    ]);
  }

  if (interaction.customId === "menu_shop") {
    return updateMenu(interaction, "🛒 المتجر والبيع", [
      "!متجر",
      "!شراء سيارة",
      "!بيع سيارة",
      "البيع فيه ربح أو خسارة",
      "السعر يتغير عند البيع"
    ]);
  }

  if (interaction.customId === "menu_crime") {
    return updateMenu(interaction, "☠️ الجريمة", [
      "!سرقة @شخص",
      "نسبة النجاح 45%",
      "عند الفشل تدفع غرامة",
      "يمكن السرقة كل ساعتين"
    ]);
  }

  if (interaction.customId === "menu_top") {
    return updateMenu(interaction, "🏆 التوب", [
      "!توب",
      "يعرض أغنى 7 أشخاص",
      "الحساب حسب الكاش والبنك"
    ]);
  }

  if (interaction.customId === "menu_info") {
    return updateMenu(interaction, "👤 المعلومات", [
      "!معلومات",
      "!معلومات @شخص",
      "يعرض الرصيد والوظيفة والمستوى"
    ]);
  }
});

client.on("messageCreate", async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift();

  const data = loadDB();
  const user = getUser(data, message.author.id);

  if (cmd === "اوامر") return sendMenu(message);

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

    return sendCard(message, "اليومية", [
      "استلمت 1500",
      `رصيدك الآن: $${money(user.cash)}`
    ]);
  }

  if (cmd === "عمل") {
    const jobs = ["حارس", "مبرمج", "تاجر", "سائق", "مهندس", "طبيب"];
    user.job = jobs[Math.floor(Math.random() * jobs.length)];
    addXP(user, 25);
    saveDB(data);

    return sendCard(message, "الوظيفة", [
      `وظيفتك الآن: ${user.job}`
    ]);
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

    return sendCard(message, "الراتب", [
      `استلمت راتب: ${salary}`,
      `الكاش: $${money(user.cash)}`
    ]);
  }

  if (cmd === "ايداع") {
    const amount = Number(args[0]);

    if (!amount || amount <= 0) return sendCard(message, "خطأ", ["اكتب مبلغ صحيح"]);
    if (user.cash < amount) return sendCard(message, "خطأ", ["الكاش غير كاف"]);

    user.cash -= amount;
    user.bank += amount;
    saveDB(data);

    return sendCard(message, "إيداع", [
      `تم إيداع ${amount}`,
      `رصيد البنك: $${money(user.bank)}`
    ]);
  }

  if (cmd === "سحب") {
    const amount = Number(args[0]);

    if (!amount || amount <= 0) return sendCard(message, "خطأ", ["اكتب مبلغ صحيح"]);
    if (user.bank < amount) return sendCard(message, "خطأ", ["رصيد البنك غير كاف"]);

    user.bank -= amount;
    user.cash += amount;
    saveDB(data);

    return sendCard(message, "سحب", [
      `تم سحب ${amount}`,
      `الكاش: $${money(user.cash)}`
    ]);
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

    return sendCard(message, "تحويل", [
      `تم تحويل ${amount}`,
      `إلى: ${target.username}`
    ]);
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

      return sendCard(message, "سرقة", [
        "فشلت السرقة",
        `الغرامة: ${fine}`
      ]);
    }

    const amount = Math.floor(Math.random() * 700) + 100;

    victim.cash -= amount;
    user.cash += amount;
    addXP(user, 60);
    saveDB(data);

    return sendCard(message, "سرقة", [
      "نجحت السرقة",
      `أخذت: ${amount}`
    ]);
  }

  if (cmd === "متجر") {
    const lines = Object.values(shop).map(item => {
      return `${item.name}: شراء ${money(item.price)} | بيع ${money(item.min)} - ${money(item.max)}`;
    });

    return sendCard(message, "المتجر", lines);
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

    return sendCard(message, "شراء", [
      `اشتريت: ${item.name}`,
      `السعر: ${money(item.price)}`
    ]);
  }

  if (cmd === "بيع") {
    const itemName = args[0];
    const item = shop[itemName];

    if (!item) return sendCard(message, "خطأ", ["هذا الشيء غير موجود"]);

    const index = user.bag.indexOf(item.name);

    if (index === -1) {
      return sendCard(message, "خطأ", ["لا تملك هذا الغرض"]);
    }

    const sellPrice = Math.floor(Math.random() * (item.max - item.min + 1)) + item.min;
    const profit = sellPrice - item.price;

    user.bag.splice(index, 1);
    user.cash += sellPrice;
    addXP(user, 40);
    saveDB(data);

    if (profit >= 0) {
      return sendCard(message, "بيع ناجح", [
        `بعت: ${item.name}`,
        `سعر البيع: ${money(sellPrice)}`,
        `الربح: ${money(profit)}`
      ]);
    }

    return sendCard(message, "بيع بخسارة", [
      `بعت: ${item.name}`,
      `سعر البيع: ${money(sellPrice)}`,
      `الخسارة: ${money(Math.abs(profit))}`
    ]);
  }

  if (cmd === "حقيبة") {
    if (!user.bag.length) return sendCard(message, "الحقيبة", ["حقيبتك فارغة"]);

    return sendCard(message, "الحقيبة", user.bag.slice(0, 8));
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
