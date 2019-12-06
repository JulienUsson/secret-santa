require("dotenv").config();
const getShuffledSantas = require("./getShuffledSantas");
const generateMails = require("./generateMails");
const sendMails = require("./sendMails");

const isDebug = process.env.DEBUG && process.env.DEBUG.toLowerCase() === "true";

const santas = getShuffledSantas();
const mails = generateMails(santas);

if (isDebug) {
  console.log(mails);
} else {
  sendMails(mails);
}
