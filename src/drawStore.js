const fs = require("fs");

function encode(mail) {
  return Buffer.from(JSON.stringify(mail)).toString("base64");
}

function decode(data) {
  return JSON.parse(Buffer.from(data, "base64").toString("utf8"));
}

function readDraw(file) {
  if (!fs.existsSync(file)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeDraw(file, draw) {
  fs.writeFileSync(file, JSON.stringify(draw, null, 2) + "\n");
}

function createDraw(file, assignments, mails) {
  const draw = {
    date: new Date().toISOString(),
    entries: assignments.map(({ santa }, i) => ({
      name: santa.name,
      email: santa.email,
      status: "pending",
      mail: encode(mails[i])
    }))
  };
  writeDraw(file, draw);
  return draw;
}

function findEntry(draw, who) {
  const key = String(who).trim().toLowerCase();
  return draw.entries.find(e => e.email.toLowerCase() === key || e.name.toLowerCase() === key);
}

function updateStatuses(file, draw, results) {
  results.forEach(result => {
    const entry = draw.entries.find(e => e.email === result.to);
    if (entry) {
      entry.status = result.ok ? "sent" : "failed";
      entry.error = result.ok ? undefined : result.error;
      entry.sentAt = result.ok ? new Date().toISOString() : entry.sentAt;
    }
  });
  writeDraw(file, draw);
}

function summarize(draw) {
  if (!draw) {
    return null;
  }
  return {
    date: draw.date,
    entries: draw.entries.map(({ name, email, status, error, sentAt }) => ({ name, email, status, error, sentAt }))
  };
}

module.exports = { readDraw, createDraw, findEntry, updateStatuses, summarize, decode };
