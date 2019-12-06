const Mustache = require("mustache");

const template =
  process.env.TEMPLATE || "You are the secret santa of {{people}} !";

function generateMails(santas) {
  return santas.map((santa, index) => ({
    from: "secret-santa@usson.me",
    to: santa.email,
    subject: "🎅 Secret Santa 🎅",
    text: Mustache.render(template, {
      people: santas[(index + 1) % santas.length].name
    })
  }));
}

module.exports = generateMails;
