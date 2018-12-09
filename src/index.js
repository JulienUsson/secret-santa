require('dotenv').config()
const getShuffledSantas = require('./getShuffledSantas')
const generateMails = require('./generateMails')
const sendMails = require('./sendMails')

const santas = getShuffledSantas()
const mails = generateMails(santas)
sendMails(mails)
