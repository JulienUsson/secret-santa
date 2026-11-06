const nodemailer = require("nodemailer");

function createTransport({ host, port, secure, user, password }) {
  const config = { host, port: Number(port), secure };
  if (user && password) {
    config.auth = { user, pass: password };
  }
  return nodemailer.createTransport(config);
}

async function sendMails(mails, smtp) {
  const transporter = createTransport(smtp);
  const results = [];
  for (const mail of mails) {
    try {
      await transporter.sendMail(mail);
      results.push({ to: mail.to, ok: true });
    } catch (error) {
      results.push({ to: mail.to, ok: false, error: error.message });
    }
  }
  transporter.close();
  return results;
}

async function verifySmtp(smtp) {
  const transporter = createTransport(smtp);
  try {
    await transporter.verify();
  } finally {
    transporter.close();
  }
}

module.exports = { sendMails, verifySmtp };
