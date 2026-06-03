const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");

const TOKEN = "ضع_توكن_البوت";
const prefix = "!";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const file = "bank.json";

if (!fs.existsSync(file)) fs.writeFileSync(file, "{}");

function db() {
  return JSON.parse(fs.readFileSync(file));
}

function save(data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function getUser(data, id) {
  if (!data[id]) {
    data[id] = {
      cash: 1000,
      bank: 0,
      job: "عاطل",
      bag: [],
      lastDaily: 0,
      lastWork: 0,
      lastRob: 0
    };
  }
  return data[id];
}

const shop = {
  laptop: { name: "لابتوب", price: 5000 },
  car: { name: "سيارة", price: 25000 },
  house: { name: "بيت", price: 100000 }
};

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift();

  const data = db();
  const user = getUser(data, message.author.id);

  if (cmd === "اوامر") {
    return message.reply(`
أوامر البنك:

!رصيد
!يومي
!راتب
!عمل
!ايداع 1000
!سحب 1000
!تحويل @user 1000
!سرقة @user
!متجر
!شراء laptop
!حقيبة
!توب
!معلومات @user
`);
  }

  if (cmd === "رصيد") {
    return message.reply(`الكاش: ${user.cash}\nالبنك: ${user.bank}\nالمجموع: ${user.cash + user.bank}`);
  }

  if (cmd === "يومي") {
    const now = Date.now();
    if (now - user.lastDaily < 86400000) {
      return message.reply("استلمت اليومية بالفعل.");
    }

    user.cash += 1500;
    user.lastDaily = now;
    save(data);

    return message.reply("استلمت 1500.");
  }

  if (cmd === "عمل") {
    const jobs = ["حارس", "مبرمج", "تاجر", "سائق", "مهندس"];
    user.job = jobs[Math.floor(Math.random() * jobs.length)];
    save(data);

    return message.reply(`وظيفتك الآن: ${user.job}`);
  }

  if (cmd === "راتب") {
    const now = Date.now();
    if (now - user.lastWork < 3600000) {
      return message.reply("يمكنك أخذ الراتب كل ساعة.");
    }

    const salary = Math.floor(Math.random() * 1200) + 300;
    user.cash += salary;
    user.lastWork = now;
    save(data);

    return message.reply(`استلمت راتب ${salary}.`);
  }

  if (cmd === "ايداع") {
    const amount = Number(args[0]);
    if (!amount || amount <= 0) return message.reply("اكتب مبلغ صحيح.");
    if (user.cash < amount) return message.reply("الكاش غير كاف.");

    user.cash -= amount;
    user.bank += amount;
    save(data);

    return message.reply(`تم إيداع ${amount}.`);
  }

  if (cmd === "سحب") {
    const amount = Number(args[0]);
    if (!amount || amount <= 0) return message.reply("اكتب مبلغ صحيح.");
    if (user.bank < amount) return message.reply("رصيد البنك غير كاف.");

    user.bank -= amount;
    user.cash += amount;
    save(data);

    return message.reply(`تم سحب ${amount}.`);
  }

  if (cmd === "تحويل") {
    const target = message.mentions.users.first();
    const amount = Number(args[1]);

    if (!target) return message.reply("منشن الشخص.");
    if (target.bot) return message.reply("لا تحول لبوت.");
    if (!amount || amount <= 0) return message.reply("اكتب مبلغ صحيح.");
    if (user.cash < amount) return message.reply("الكاش غير كاف.");

    const receiver = getUser(data, target.id);

    user.cash -= amount;
    receiver.cash += amount;
    save(data);

    return message.reply(`تم تحويل ${amount} إلى ${target.username}.`);
  }

  if (cmd === "سرقة") {
    const target = message.mentions.users.first();
    const now = Date.now();

    if (!target) return message.reply("منشن الشخص.");
    if (target.id === message.author.id) return message.reply("لا يمكنك سرقة نفسك.");
    if (now - user.lastRob < 7200000) return message.reply("يمكنك السرقة كل ساعتين.");

    const victim = getUser(data, target.id);

    if (victim.cash < 500) return message.reply("هذا الشخص لا يملك كاش كافي.");

    const success = Math.random() < 0.45;

    user.lastRob = now;

    if (!success) {
      const fine = 300;
      user.cash = Math.max(0, user.cash - fine);
      save(data);
      return message.reply(`فشلت السرقة. دفعت غرامة ${fine}.`);
    }

    const amount = Math.floor(Math.random() * 700) + 100;

    victim.cash -= amount;
    user.cash += amount;
    save(data);

    return message.reply(`نجحت السرقة. أخذت ${amount}.`);
  }

  if (cmd === "متجر") {
    return message.reply(`
المتجر:

laptop - لابتوب - 5000
car - سيارة - 25000
house - بيت - 100000

للشراء:
!شراء laptop
`);
  }

  if (cmd === "شراء") {
    const itemId = args[0];
    const item = shop[itemId];

    if (!item) return message.reply("هذا الشيء غير موجود في المتجر.");
    if (user.cash < item.price) return message.reply("الكاش غير كاف.");

    user.cash -= item.price;
    user.bag.push(item.name);
    save(data);

    return message.reply(`اشتريت ${item.name}.`);
  }

  if (cmd === "حقيبة") {
    if (user.bag.length === 0) return message.reply("حقيبتك فارغة.");

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
      .map((u, i) => `${i + 1}. <@${u.id}> - ${u.total}`)
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
الأغراض: ${info.bag.length}
`);
  }
});

client.login(TOKEN);
