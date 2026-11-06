const { validateParticipants } = require("./participants");
const { draw } = require("./draw");
const { generateMails, saveMails } = require("./mails");
const { sendMails } = require("./mailer");
const drawStore = require("./drawStore");

async function run(participants, { template, smtp, dryRun, save, mailsDir, drawFile }) {
  const { errors, warnings } = validateParticipants(participants);
  if (errors.length > 0) {
    const error = new Error(errors.join("\n"));
    error.validation = { errors, warnings };
    throw error;
  }

  const assignments = draw(participants);
  const mails = generateMails(assignments, template);

  if (save) {
    saveMails(mails, mailsDir);
  }

  if (dryRun) {
    return { warnings, mails };
  }

  const savedDraw = drawStore.createDraw(drawFile, assignments, mails);
  const results = await sendMails(mails, smtp);
  drawStore.updateStatuses(drawFile, savedDraw, results);
  return { warnings, results, lastDraw: drawStore.summarize(savedDraw) };
}

async function resend(who, { smtp, drawFile, dryRun }) {
  const savedDraw = drawStore.readDraw(drawFile);
  if (!savedDraw) {
    throw new Error(`No previous draw found in ${drawFile}.`);
  }
  const entry = drawStore.findEntry(savedDraw, who);
  if (!entry) {
    throw new Error(`"${who}" is not part of the last draw.`);
  }
  const mail = drawStore.decode(entry.mail);
  if (dryRun) {
    return { mails: [mail] };
  }
  const results = await sendMails([mail], smtp);
  drawStore.updateStatuses(drawFile, savedDraw, results);
  return { results, lastDraw: drawStore.summarize(savedDraw) };
}

module.exports = { run, resend };
