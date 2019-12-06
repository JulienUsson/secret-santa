const fs = require("fs");
const shuffle = require("lodash.shuffle");

function getShuffledSantas() {
  const santasCsv = fs.readFileSync("santas.csv", "utf8");
  const santas = santasCsv.split("\n").map(line => {
    const santa = line.split(";");
    return { name: santa[0], email: santa[1] };
  });
  return shuffle(santas);
}

module.exports = getShuffledSantas;
