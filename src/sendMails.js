const nodemailer = require("nodemailer");

const host = process.env.MAIL_HOST
const port = process.env.MAIL_PORT || 465

function sendMails(mails) {
  let config = { host, port, secure: port === 465 };
  if (process.env.MAIL_USER && process.env.MAIL_PASSWORD) {
    config.auth = {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD
    };
  }
  const transporter = nodemailer.createTransport(config);

  mails.forEach(mail => {
    transporter.sendMail(mail, (error, info) => {
      if (error) {
        return console.error(error);
      }
    });
  });
}

module.exports = sendMails;
