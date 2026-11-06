function isTrue(value) {
  return typeof value === "string" && value.toLowerCase() === "true";
}

function getConfig(env = process.env) {
  const port = Number(env.MAIL_PORT || 465);
  return {
    smtp: {
      host: env.MAIL_HOST,
      port,
      secure: env.MAIL_SECURE ? isTrue(env.MAIL_SECURE) : port === 465,
      user: env.MAIL_USER,
      password: env.MAIL_PASSWORD
    },
    mail: {
      from: env.MAIL_FROM || env.MAIL_USER || "secret-santa@usson.me",
      subject: env.MAIL_SUBJECT || "🎅 Secret Santa 🎅",
      content: env.MAIL_CONTENT || "You are the secret santa of {{people}} !"
    },
    santasFile: env.SANTAS_FILE || "santas.csv",
    mailsDir: "mails",
    saveMails: isTrue(env.SAVE_MAILS),
    debug: isTrue(env.DEBUG),
    guiPort: Number(env.GUI_PORT || 3000)
  };
}

module.exports = { getConfig, isTrue };
