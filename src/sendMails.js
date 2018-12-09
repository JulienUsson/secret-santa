const nodemailer = require('nodemailer')

function sendMails(mails) {
    const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: 465,
        secure: true,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS
        }
    })

    mails.forEach(mail => {
        transporter.sendMail(mail, (error, info) => {
            if (error) {
                return console.error(error)
            }
        })
    })
}

module.exports = sendMails