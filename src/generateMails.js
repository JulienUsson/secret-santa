function generateMails(santas) {
    return santas.map((santa, index) => ({
        from: 'secret-santa@usson.me',
        to: santa.email,
        subject: '🎅 Secret Santa 🎅',
        text: `You are the secret santa of ${santas[(index + 1) % santas.length].name} !`,
    }))
}

module.exports = generateMails