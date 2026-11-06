const fs = require("fs");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseCsv(csv) {
  return csv
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line !== "" && !line.startsWith("#"))
    .map(line => {
      const [name = "", email = "", blacklist = ""] = line.split(";");
      return {
        name: name.trim(),
        email: email.trim(),
        blacklist: blacklist
          .split(",")
          .map(entry => entry.trim())
          .filter(entry => entry !== "")
      };
    });
}

function toCsv(participants) {
  return participants
    .map(p => [p.name, p.email, p.blacklist.join(",")].join(";"))
    .join("\n")
    .concat("\n");
}

function readParticipants(file) {
  if (!fs.existsSync(file)) {
    return [];
  }
  return parseCsv(fs.readFileSync(file, "utf8"));
}

function writeParticipants(file, participants) {
  fs.writeFileSync(file, toCsv(participants));
}

function normalize(participants) {
  return participants.map(p => ({
    name: String(p.name || "").trim(),
    email: String(p.email || "").trim(),
    blacklist: (Array.isArray(p.blacklist) ? p.blacklist : String(p.blacklist || "").split(","))
      .map(entry => String(entry).trim())
      .filter(entry => entry !== "")
  }));
}

function validateParticipants(participants) {
  const errors = [];
  const warnings = [];

  if (participants.length < 2) {
    errors.push("At least 2 participants are required.");
  }

  const names = new Set();
  const emails = new Set();
  participants.forEach((p, index) => {
    const label = p.name || `line ${index + 1}`;
    if (!p.name) {
      errors.push(`Participant on line ${index + 1} has no name.`);
    } else if (names.has(p.name.toLowerCase())) {
      errors.push(`Duplicate name: ${p.name}.`);
    }
    if (!EMAIL_REGEX.test(p.email)) {
      errors.push(`Invalid email for ${label}: "${p.email}".`);
    } else if (emails.has(p.email.toLowerCase())) {
      errors.push(`Duplicate email: ${p.email}.`);
    }
    names.add(p.name.toLowerCase());
    emails.add(p.email.toLowerCase());
  });

  participants.forEach(p => {
    p.blacklist.forEach(entry => {
      const known = participants.some(
        other => other.name.toLowerCase() === entry.toLowerCase() || other.email.toLowerCase() === entry.toLowerCase()
      );
      if (!known) {
        warnings.push(`${p.name} excludes "${entry}" who is not a participant.`);
      }
    });
  });

  return { errors, warnings };
}

module.exports = {
  parseCsv,
  toCsv,
  readParticipants,
  writeParticipants,
  normalize,
  validateParticipants
};
