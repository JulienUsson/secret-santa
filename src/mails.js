const fs = require("fs");
const path = require("path");
const Mustache = require("mustache");

function renderMail({ santa, receiver }, { from, subject, content }) {
  const view = { people: receiver.name, santa: santa.name };
  return {
    from,
    to: santa.email,
    subject: Mustache.render(subject, view),
    text: Mustache.render(content, view)
  };
}

function generateMails(assignments, template) {
  return assignments.map(assignment => renderMail(assignment, template));
}

function saveMails(mails, dir) {
  fs.mkdirSync(dir, { recursive: true });
  mails.forEach(mail => fs.writeFileSync(path.join(dir, mail.to), mail.text));
}

module.exports = { renderMail, generateMails, saveMails };
