require("dotenv").config({ quiet: true });
const http = require("http");
const fs = require("fs");
const path = require("path");
const { getConfig } = require("./config");
const { readParticipants, writeParticipants, normalize, validateParticipants } = require("./participants");
const { draw } = require("./draw");
const { renderMail } = require("./mails");
const { verifySmtp } = require("./mailer");
const { run, resend } = require("./secretSanta");
const drawStore = require("./drawStore");

const config = getConfig();
const publicDir = path.join(__dirname, "..", "public");
const MAX_BODY = 1024 * 1024;

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml"
};

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    if (!(req.headers["content-type"] || "").startsWith("application/json")) {
      return reject(Object.assign(new Error("Expected application/json"), { status: 415 }));
    }
    let data = "";
    req.on("data", chunk => {
      data += chunk;
      if (data.length > MAX_BODY) {
        req.destroy();
        reject(Object.assign(new Error("Body too large"), { status: 413 }));
      }
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (error) {
        reject(Object.assign(new Error("Invalid JSON"), { status: 400 }));
      }
    });
    req.on("error", reject);
  });
}

function smtpFrom(overrides = {}) {
  const port = Number(overrides.port || config.smtp.port);
  return {
    host: overrides.host || config.smtp.host,
    port,
    secure: typeof overrides.secure === "boolean" ? overrides.secure : config.smtp.secure,
    user: overrides.user || config.smtp.user,
    password: overrides.password || config.smtp.password
  };
}

function templateFrom(template = {}) {
  return {
    from: template.from || config.mail.from,
    subject: template.subject || config.mail.subject,
    content: template.content || config.mail.content,
    budget: typeof template.budget === "string" ? template.budget.trim() : config.mail.budget,
    date: typeof template.date === "string" ? template.date.trim() : config.mail.date
  };
}

function check(participants) {
  const validation = validateParticipants(participants);
  let feasible = false;
  if (validation.errors.length === 0) {
    try {
      draw(participants);
      feasible = true;
    } catch (error) {
      validation.errors.push(error.message);
    }
  }
  return { ...validation, feasible };
}

const routes = {
  "GET /api/state": async () => ({
    participants: readParticipants(config.santasFile),
    template: config.mail,
    smtp: {
      host: config.smtp.host || "",
      port: config.smtp.port,
      secure: config.smtp.secure,
      user: config.smtp.user || "",
      hasPassword: Boolean(config.smtp.password)
    },
    saveMails: config.saveMails,
    santasFile: config.santasFile,
    lastDraw: drawStore.summarize(drawStore.readDraw(config.drawFile))
  }),

  "PUT /api/participants": async body => {
    const participants = normalize(body.participants || []);
    writeParticipants(config.santasFile, participants);
    return { participants, ...check(participants) };
  },

  "POST /api/check": async body => check(normalize(body.participants || [])),

  "POST /api/preview": async body => {
    const participants = normalize(body.participants || []);
    const santa = participants[0] || { name: "Alice", email: "alice@example.com" };
    const receiver = { name: "🎁 ???" };
    try {
      return { mail: renderMail({ santa, receiver }, templateFrom(body.template)) };
    } catch (error) {
      return { error: `Template error: ${error.message}` };
    }
  },

  "POST /api/smtp/test": async body => {
    try {
      await verifySmtp(smtpFrom(body.smtp));
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  },

  "POST /api/send": async body => {
    const participants = normalize(body.participants || []);
    try {
      return await run(participants, {
        template: templateFrom(body.template),
        smtp: smtpFrom(body.smtp),
        dryRun: Boolean(body.dryRun),
        save: Boolean(body.save),
        mailsDir: config.mailsDir,
        drawFile: config.drawFile
      });
    } catch (error) {
      return { error: error.message, ...(error.validation || {}) };
    }
  },

  "POST /api/resend": async body => {
    try {
      return await resend(body.email, { smtp: smtpFrom(body.smtp), drawFile: config.drawFile });
    } catch (error) {
      return { error: error.message };
    }
  }
};

function serveStatic(req, res) {
  const urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const file = path.normalize(path.join(publicDir, urlPath === "/" ? "index.html" : urlPath));
  if (!file.startsWith(publicDir + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404);
    return res.end("Not found");
  }
  res.writeHead(200, { "Content-Type": contentTypes[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, "http://localhost").pathname;
  const handler = routes[`${req.method} ${pathname}`];
  if (!handler) {
    return req.method === "GET" ? serveStatic(req, res) : sendJson(res, 404, { error: "Not found" });
  }
  try {
    const body = req.method === "GET" ? {} : await readBody(req);
    sendJson(res, 200, await handler(body));
  } catch (error) {
    sendJson(res, error.status || 500, { error: error.message });
  }
});

server.listen(config.guiPort, "127.0.0.1", () => {
  console.log(`🎅 Secret Santa GUI running on http://localhost:${config.guiPort}`);
});
