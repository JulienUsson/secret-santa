const fs = require("fs");
const path = require("path");
const Mustache = require("mustache");
const { renderHtml } = require("./htmlMail");

const PLAIN = { escape: value => String(value) };
const PEOPLE_TOKEN = "\u0000people\u0000";

function render(template, view) {
  return Mustache.render(template, view, {}, PLAIN);
}

function renderMail({ santa, receiver }, { from, subject, content, budget = "", date = "" }) {
  const view = { people: receiver.name, santa: santa.name, budget, date };
  const renderedSubject = render(subject, view);
  return {
    from,
    to: santa.email,
    subject: renderedSubject,
    text: render(content, view),
    html: renderHtml({
      subject: renderedSubject,
      text: render(content, { ...view, people: PEOPLE_TOKEN }),
      highlight: { token: PEOPLE_TOKEN, value: receiver.name },
      budget,
      date
    })
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
