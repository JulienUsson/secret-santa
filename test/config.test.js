const test = require("node:test");
const assert = require("node:assert");
const { getConfig } = require("../src/config");

test("MAIL_PORT from env enables TLS on 465", () => {
  assert.strictEqual(getConfig({ MAIL_PORT: "465" }).smtp.secure, true);
  assert.strictEqual(getConfig({ MAIL_PORT: "587" }).smtp.secure, false);
  assert.strictEqual(getConfig({}).smtp.secure, true);
  assert.strictEqual(getConfig({ MAIL_PORT: "587", MAIL_SECURE: "true" }).smtp.secure, true);
});

test("MAIL_FROM falls back to MAIL_USER", () => {
  assert.strictEqual(getConfig({ MAIL_USER: "me@example.com" }).mail.from, "me@example.com");
  assert.strictEqual(getConfig({ MAIL_USER: "me@example.com", MAIL_FROM: "santa@example.com" }).mail.from, "santa@example.com");
});
