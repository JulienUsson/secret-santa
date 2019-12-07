const Mustache = require("mustache");
const fs = require("fs");
const path = require("path");

const saveMails =
  process.env.SAVE_MAILS && process.env.SAVE_MAILS.toLowerCase() === "true";

const subject = process.env.MAIL_SUBJECT || "🎅 Secret Santa 🎅";
const content =
  process.env.MAIL_CONTENT || "You are the secret santa of {{people}} !";

function generateMails(santas) {
  const mails = santas.map((santa, index) => ({
    from: "secret-santa@usson.me",
    to: santa.email,
    subject,
    text: Mustache.render(content, {
      people: santas[(index + 1) % santas.length].name
    })
  }));

  if (saveMails) {
    fs.mkdirSync(path.join(__dirname, "..", "mails"));
    mails.forEach(mail =>
      fs.writeFileSync(path.join(__dirname, "..", "mails", mail.to), mail.text)
    );
  }

  return mails;
}

module.exports = generateMails;
