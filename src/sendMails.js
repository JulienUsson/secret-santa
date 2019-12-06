const nodemailer = require("nodemailer");

function sendMails(mails) {
  let config = {
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT || 465
  };
  if (process.env.MAIL_USER && process.env.MAIL_PASSWORD) {
    config.secure = true;
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
