const { validateParticipants } = require("./participants");
const { draw } = require("./draw");
const { generateMails, saveMails } = require("./mails");
const { sendMails } = require("./mailer");

async function run(participants, { template, smtp, dryRun, save, mailsDir }) {
  const { errors, warnings } = validateParticipants(participants);
  if (errors.length > 0) {
    const error = new Error(errors.join("\n"));
    error.validation = { errors, warnings };
    throw error;
  }

  const mails = generateMails(draw(participants), template);

  if (save) {
    saveMails(mails, mailsDir);
  }

  if (dryRun) {
    return { warnings, mails };
  }

  return { warnings, results: await sendMails(mails, smtp) };
}

module.exports = { run };
