const fs = require("fs");
const shuffle = require("lodash.shuffle");

function isShuffleOk(santas) {
  for (let i = 0; i < santas.length; i++) {
    const santa = santas[i];
    const santasPeople = santas[(i + 1) % santas.length];
    if (santa.blacklist.includes(santasPeople.email)) {
      return false;
    }
  }
  return true;
}

function getShuffledSantas() {
  const santasCsv = fs.readFileSync("santas.csv", "utf8");
  const santas = santasCsv
    .split("\n")
    .filter(l => l !== "")
    .map(line => {
      const santa = line.split(";");
      return {
        name: santa[0],
        email: santa[1],
        blacklist: santa[2] ? santa[2].split(",") : []
      };
    });

  let shuffledSantas;
  let i = 0;
  do {
    shuffledSantas = shuffle([...santas]);
    i++;
  } while (!isShuffleOk(shuffledSantas));
  return shuffledSantas;
}

module.exports = getShuffledSantas;
