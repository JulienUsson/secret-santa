const test = require("node:test");
const assert = require("node:assert");
const { draw } = require("../src/draw");

function people(count) {
  return Array.from({ length: count }, (_, i) => ({ name: `P${i}`, email: `p${i}@example.com`, blacklist: [] }));
}

function assertSingleCycle(assignments, participants) {
  assert.strictEqual(assignments.length, participants.length);
  const santas = new Set(assignments.map(a => a.santa));
  const receivers = new Set(assignments.map(a => a.receiver));
  assert.strictEqual(santas.size, participants.length);
  assert.strictEqual(receivers.size, participants.length);
  assignments.forEach(a => assert.notStrictEqual(a.santa, a.receiver));
}

test("everyone gives and receives exactly once", () => {
  const participants = people(8);
  for (let i = 0; i < 50; i++) {
    assertSingleCycle(draw(participants), participants);
  }
});

test("blacklist by name or email is respected, case-insensitively", () => {
  const participants = people(5);
  participants[0].blacklist = ["p1", "P2@EXAMPLE.COM"];
  participants[1].blacklist = ["P0"];
  for (let i = 0; i < 100; i++) {
    draw(participants).forEach(({ santa, receiver }) => {
      if (santa === participants[0]) assert.ok(![participants[1], participants[2]].includes(receiver));
      if (santa === participants[1]) assert.notStrictEqual(receiver, participants[0]);
    });
  }
});

test("finds the only valid draw under tight constraints", () => {
  const participants = people(6);
  participants.forEach((p, i) => {
    p.blacklist = participants.filter((_, j) => j !== (i + 1) % 6).map(o => o.name);
  });
  const assignments = draw(participants);
  assignments.forEach(({ santa, receiver }) => {
    assert.strictEqual(participants.indexOf(receiver), (participants.indexOf(santa) + 1) % 6);
  });
});

test("throws instead of looping forever when impossible", () => {
  const participants = people(3);
  participants[0].blacklist = ["P1", "P2"];
  assert.throws(() => draw(participants), /No valid draw/);
});

test("requires at least two participants", () => {
  assert.throws(() => draw(people(1)), /At least 2/);
});
