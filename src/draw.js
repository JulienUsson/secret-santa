const shuffle = require("lodash.shuffle");

const RANDOM_ATTEMPTS = 10000;

function canGiftTo(santa, receiver) {
  if (santa === receiver) {
    return false;
  }
  const excluded = santa.blacklist.map(entry => entry.toLowerCase());
  return !excluded.includes(receiver.name.toLowerCase()) && !excluded.includes(receiver.email.toLowerCase());
}

function isValidCycle(santas) {
  return santas.every((santa, i) => canGiftTo(santa, santas[(i + 1) % santas.length]));
}

function searchCycle(participants) {
  const [first, ...others] = shuffle(participants);
  const path = [first];
  const used = new Set([first]);

  function extend() {
    const last = path[path.length - 1];
    if (path.length === participants.length) {
      return canGiftTo(last, first);
    }
    for (const candidate of shuffle(others)) {
      if (!used.has(candidate) && canGiftTo(last, candidate)) {
        path.push(candidate);
        used.add(candidate);
        if (extend()) {
          return true;
        }
        path.pop();
        used.delete(candidate);
      }
    }
    return false;
  }

  return extend() ? path : null;
}

function draw(participants) {
  if (participants.length < 2) {
    throw new Error("At least 2 participants are required.");
  }

  for (let attempt = 0; attempt < RANDOM_ATTEMPTS; attempt++) {
    const santas = shuffle(participants);
    if (isValidCycle(santas)) {
      return toAssignments(participants, santas);
    }
  }

  const santas = searchCycle(participants);
  if (!santas) {
    throw new Error("No valid draw exists with these exclusions. Try removing some of them.");
  }
  return toAssignments(participants, santas);
}

function toAssignments(participants, santas) {
  return participants.map(santa => ({
    santa,
    receiver: santas[(santas.indexOf(santa) + 1) % santas.length]
  }));
}

module.exports = { draw, canGiftTo };
