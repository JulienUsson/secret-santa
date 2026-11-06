require("dotenv").config();
const { getConfig } = require("./config");
const { readParticipants } = require("./participants");
const { run } = require("./secretSanta");

async function main() {
  const config = getConfig();
  const participants = readParticipants(config.santasFile);

  const { warnings, mails, results } = await run(participants, {
    template: config.mail,
    smtp: config.smtp,
    dryRun: config.debug,
    save: config.saveMails,
    mailsDir: config.mailsDir
  });

  warnings.forEach(warning => console.warn(`⚠️  ${warning}`));

  if (mails) {
    console.log(mails);
    return;
  }

  results.forEach(r => console.log(r.ok ? `✅ ${r.to}` : `❌ ${r.to}: ${r.error}`));
  if (results.some(r => !r.ok)) {
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error(`❌ ${error.message}`);
  process.exitCode = 1;
});
