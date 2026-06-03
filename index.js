const { Client, GatewayIntentBits, AttachmentBuilder } = require("discord.js");
const fs = require("fs");
const { createCanvas } = require("canvas");

const TOKEN = process.env.TOKEN;
const prefix = "!";
const file = "bank.json";

if (!TOKEN) {
  console.log("TOKEN is missing");
  process.exit(1);
}

if (!fs.existsSync(file)) {
  fs.writeFileSync(file, "{}");
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const usedMessages = new Set();

function loadDB() {
  return JSON.parse(fs.readFileSync(file));
}

function saveDB(data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function getUser(data, id) {
  if (!data[id]) {
    data[id] = {
      cash: 1000,
      bank: 0,
      job: "بدون وظيفة",
      bag: [],
      lastDaily: 0,
      lastSalary: 0,
      lastRob: 0,
      level: 1,
      xp: 0
    };
  }

  return data[id];
}

function formatMoney(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return String(num);
}

function addXP(user, amount) {
  user.xp += amount;

  const needed = user.level * 500;

  if (user.xp >= needed) {
    user.xp -= needed;
    user.level += 1;
  }
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

  if (usedMessages.has(message.id)) return;
  usedMessages.add(message.id);
  setTimeout(() => usedMessages.delete(message.id), 10000);

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift();

  const data = loadDB();
  const user = getUser(data, message.author.id);

  if (cmd === "اوامر") {
    return message.reply(`
أوامر البنك:

!رصيد
!يومي
!عمل
!راتب
!ايداع 1000
!سحب 1000
!تحويل @شخص 500
!سرقة @شخص
!متجر
!شراء لابتوب
!حقيبة
!توب
!معلومات @شخص
`);
  }

  if (cmd === "رصيد") {
    const canvas = createCanvas(900, 500);
    const ctx = canvas.getContext("2d");

    const total = user.cash + user.bank;
    const neededXP = user.level * 500;
    const percent = Math.min(user.xp / neededXP, 1);

    ctx.fillStyle = "#2a1a03";
    ctx.fillRect(0, 0, 900, 500);

    ctx.fillStyle = "#4a3208";
    ctx.fillRect(40, 40, 820, 420);

    ctx.strokeStyle = "#d6a21c";
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 40, 820, 420);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 44px Arial";
    ctx.fillText("رصيدك في البنك", 560, 85);

    ctx.fillStyle = "#ffcc33";
    ctx.font = "bold 28px Arial";
    ctx.fillText(`المستوى ${user.level}`, 620, 125);

    ctx.fillStyle = "#cccccc";
    ctx.font = "28px Arial";
    ctx.fillText("الرصيد الحالي", 650, 185);

    ctx.fillStyle = "#ffcc33";
    ctx.font = "bold 60px Arial";
    ctx.fillText(`$${formatMoney(total)}`, 620, 250);

    ctx.fillStyle = "#cccccc";
    ctx.font = "25px Arial";
    ctx.fillText("رصيد البنك", 660, 315);
    ctx.fillText("الثروة الإجمالية", 625, 365);
    ctx.fillText("الوظيفة", 690, 415);

    ctx.fillStyle = "#4aa3ff";
    ctx.font = "bold 30px Arial";
    ctx.fillText(`$${formatMoney(user.cash)}`, 260, 210);

    ctx.fillStyle = "#30d18c";
    ctx.fillText(`$${formatMoney(user.bank)}`, 260, 265);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 30px Arial";
    ctx.fillText(user.job, 260, 325);

    ctx.beginPath();
    ctx.arc(150, 260, 80, 0, Math.PI * 2);
    ctx.fillStyle = "#111111";
    ctx.fill();
    ctx.strokeStyle = "#ffcc33";
    ctx.lineWidth = 8;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 25px Arial";
    ctx.fillText(message.author.username, 95, 380);

    ctx.fillStyle = "#111111";
    ctx.fillRect(260, 420, 580, 18);

    ctx.fillStyle = "#ffb300";
    ctx.fillRect(260, 420, 580 * percent, 18);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Arial";
    ctx.fillText(`${user.xp} / ${neededXP} XP`, 480, 405);

    ctx.fillStyle = "#aaaaaa";
    ctx.font = "20px Arial";
    ctx.fillText("Our House بنك", 390, 475);

    const attachment = new AttachmentBuilder(canvas.toBuffer(), {
      name: "balance.png"
    });

    return message.reply({ files: [attachment] });
  }

  if (cmd === "يومي") {
    const now = Date.now();

    if (now - user.lastDaily < 86400000) {
      return message.reply("استلمت اليومية بالفعل.");
    }

    const amount = 1500;
    user.cash += amount;
    user.lastDaily = now;
    addXP(user, 50);

    saveDB(data);

    return message.reply(`استلمت اليومية: ${amount}`);
  }

  if (cmd === "عمل") {
    const jobs = ["حارس", "مبرمج", "تاجر", "سائق", "مهندس", "طبيب"];
    user.job = jobs[Math.floor(Math.random() * jobs.length)];
    addXP(user, 25);

    saveDB(data);

    return message.reply(`وظيفتك الآن: ${user.job}`);
  }

  if (cmd === "راتب") {
    const now = Date.now();

    if (now - user.lastSalary < 3600000) {
      return message.reply("يمكنك أخذ الراتب كل ساعة.");
    }

    const salary = Math.floor(Math.random() * 900) + 500;

    user.cash += salary;
    user.lastSalary = now;
    addXP(user, 40);

    saveDB(data);

    return message.reply(`استلمت راتب ${salary}.`);
  }

  if (cmd === "ايداع") {
    const amount = Number(args[0]);

    if (!amount || amount <= 0) return message.reply("اكتب مبلغ صحيح.");
    if (user.cash < amount) return message.reply("الكاش غير كاف.");

    user.cash -= amount;
    user.bank += amount;

    saveDB(data);

    return message.reply(`تم إيداع ${amount}.`);
  }

  if (cmd === "سحب") {
    const amount = Number(args[0]);

    if (!amount || amount <= 0) return message.reply("اكتب مبلغ صحيح.");
    if (user.bank < amount) return message.reply("رصيد البنك غير كاف.");

    user.bank -= amount;
    user.cash += amount;

    saveDB(data);

    return message.reply(`تم سحب ${amount}.`);
  }

  if (cmd === "تحويل") {
    const target = message.mentions.users.first();
    const amount = Number(args[1]);

    if (!target) return message.reply("منشن الشخص.");
    if (target.bot) return message.reply("لا يمكنك التحويل لبوت.");
    if (!amount || amount <= 0) return message.reply("اكتب مبلغ صحيح.");
    if (user.cash < amount) return message.reply("الكاش غير كاف.");

    const receiver = getUser(data, target.id);

    user.cash -= amount;
    receiver.cash += amount;

    saveDB(data);

    return message.reply(`تم تحويل ${amount} إلى ${target.username}.`);
  }

  if (cmd === "سرقة") {
    const target = message.mentions.users.first();
    const now = Date.now();

    if (!target) return message.reply("منشن الشخص.");
    if (target.id === message.author.id) return message.reply("لا يمكنك سرقة نفسك.");
    if (target.bot) return message.reply("لا يمكنك سرقة بوت.");
    if (now - user.lastRob < 7200000) return message.reply("يمكنك السرقة كل ساعتين.");

    const victim = getUser(data, target.id);

    if (victim.cash < 500) {
      return message.reply("هذا الشخص لا يملك كاش كافي.");
    }

    user.lastRob = now;

    const success = Math.random() < 0.45;

    if (!success) {
      const fine = 300;
      user.cash = Math.max(0, user.cash - fine);
      saveDB(data);

      return message.reply(`فشلت السرقة. دفعت غرامة ${fine}.`);
    }

    const amount = Math.floor(Math.random() * 700) + 100;

    victim.cash -= amount;
    user.cash += amount;
    addXP(user, 60);

    saveDB(data);

    return message.reply(`نجحت السرقة. أخذت ${amount}.`);
  }

  if (cmd === "متجر") {
    return message.reply(`
المتجر:

لابتوب - 5000
سيارة - 25000
بيت - 100000
جوال - 3000
ساعة - 1500

للشراء:
!شراء لابتوب
`);
  }

  if (cmd === "شراء") {
    const itemName = args[0];
    const item = shop[itemName];

    if (!item) return message.reply("هذا الشيء غير موجود في المتجر.");
    if (user.cash < item.price) return message.reply("الكاش غير كاف.");

    user.cash -= item.price;
    user.bag.push(item.name);
    addXP(user, 30);

    saveDB(data);

    return message.reply(`اشتريت ${item.name}.`);
  }

  if (cmd === "حقيبة") {
    if (!user.bag.length) return message.reply("حقيبتك فارغة.");

    return message.reply(`حقيبتك:\n${user.bag.join("\n")}`);
  }

  if (cmd === "توب") {
    const top = Object.entries(data)
      .map(([id, u]) => ({
        id,
        total: u.cash + u.bank
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const text = top
      .map((u, i) => `${i + 1}. <@${u.id}> - ${formatMoney(u.total)}`)
      .join("\n");

    return message.reply(text || "لا يوجد بيانات.");
  }

  if (cmd === "معلومات") {
    const target = message.mentions.users.first() || message.author;
    const info = getUser(data, target.id);

    return message.reply(`
معلومات ${target.username}

الكاش: ${info.cash}
البنك: ${info.bank}
الوظيفة: ${info.job}
المستوى: ${info.level}
XP: ${info.xp}
الأغراض: ${info.bag.length}
`);
  }
});

client.login(TOKEN);
