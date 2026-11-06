const test = require("node:test");
const assert = require("node:assert");
const { parseCsv, toCsv, validateParticipants } = require("../src/participants");

test("parseCsv handles CRLF, blank lines, comments and spaces", () => {
  const csv = "# name;email;blacklist\r\nAlice ; alice@example.com ; Bob , carol@example.com\r\n\r\nBob;bob@example.com\r\n";
  assert.deepStrictEqual(parseCsv(csv), [
    { name: "Alice", email: "alice@example.com", blacklist: ["Bob", "carol@example.com"] },
    { name: "Bob", email: "bob@example.com", blacklist: [] }
  ]);
});

test("toCsv round-trips", () => {
  const participants = [
    { name: "Alice", email: "alice@example.com", blacklist: ["Bob"] },
    { name: "Bob", email: "bob@example.com", blacklist: [] }
  ];
  assert.deepStrictEqual(parseCsv(toCsv(participants)), participants);
});

test("validateParticipants reports errors and warnings", () => {
  const { errors, warnings } = validateParticipants([
    { name: "Alice", email: "alice@example.com", blacklist: ["Zoe"] },
    { name: "alice", email: "not-an-email", blacklist: [] }
  ]);
  assert.deepStrictEqual(errors, ["Duplicate name: alice.", 'Invalid email for alice: "not-an-email".']);
  assert.deepStrictEqual(warnings, ['Alice excludes "Zoe" who is not a participant.']);
});
