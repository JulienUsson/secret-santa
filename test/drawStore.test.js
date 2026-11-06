const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const drawStore = require("../src/drawStore");
const { resend } = require("../src/secretSanta");

function setup() {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "santa-")), "draw.json");
  const assignments = [
    { santa: { name: "Alice", email: "alice@example.com" }, receiver: { name: "Bob" } },
    { santa: { name: "Bob", email: "bob@example.com" }, receiver: { name: "Alice" } }
  ];
  const mails = assignments.map(a => ({ to: a.santa.email, text: `You gift ${a.receiver.name}` }));
  const draw = drawStore.createDraw(file, assignments, mails);
  return { file, draw };
}

test("saved draw does not contain receiver names in clear text", () => {
  const { file } = setup();
  const raw = fs.readFileSync(file, "utf8");
  assert.doesNotMatch(raw, /You gift/);
});

test("statuses are updated and persisted", () => {
  const { file, draw } = setup();
  drawStore.updateStatuses(file, draw, [
    { to: "alice@example.com", ok: true },
    { to: "bob@example.com", ok: false, error: "boom" }
  ]);
  const summary = drawStore.summarize(drawStore.readDraw(file));
  assert.deepStrictEqual(
    summary.entries.map(e => [e.name, e.status, e.error]),
    [
      ["Alice", "sent", undefined],
      ["Bob", "failed", "boom"]
    ]
  );
  assert.strictEqual(summary.entries[0].mail, undefined);
});

test("resend finds the original mail by name or email", async () => {
  const { file } = setup();
  assert.deepStrictEqual((await resend("BOB", { drawFile: file, dryRun: true })).mails, [
    { to: "bob@example.com", text: "You gift Alice" }
  ]);
  assert.strictEqual(
    (await resend("alice@example.com", { drawFile: file, dryRun: true })).mails[0].text,
    "You gift Bob"
  );
  await assert.rejects(resend("Zoe", { drawFile: file, dryRun: true }), /not part of the last draw/);
});
