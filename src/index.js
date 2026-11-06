require("dotenv").config({ quiet: true });
const { getConfig } = require("./config");
const { readParticipants } = require("./participants");
const { run, resend } = require("./secretSanta");

async function main() {
  const config = getConfig();
  const argv = process.argv.slice(2);
  const resendIndex = argv.indexOf("--resend");
  const who = resendIndex >= 0 ? argv[resendIndex + 1] : undefined;

  if (resendIndex >= 0 && !who) {
    throw new Error("Usage: npm start -- --resend <email or name>");
  }

  const {
    warnings = [],
    mails,
    results
  } = who
    ? await resend(who, { smtp: config.smtp, drawFile: config.drawFile, dryRun: config.debug })
    : await run(readParticipants(config.santasFile), {
        template: config.mail,
        smtp: config.smtp,
        dryRun: config.debug,
        save: config.saveMails,
        mailsDir: config.mailsDir,
        drawFile: config.drawFile
      });

  warnings.forEach(warning => console.warn(`⚠️  ${warning}`));

  if (mails) {
    console.log(mails.map(({ html, ...mail }) => mail));
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
