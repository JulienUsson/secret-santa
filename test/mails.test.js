const test = require("node:test");
const assert = require("node:assert");
const { renderMail } = require("../src/mails");

test("renderMail fills people and santa", () => {
  const mail = renderMail(
    { santa: { name: "Alice", email: "alice@example.com" }, receiver: { name: "Bob" } },
    { from: "santa@example.com", subject: "Hi {{santa}}", content: "{{santa}}, you gift {{people}}" }
  );
  assert.deepStrictEqual(mail, {
    from: "santa@example.com",
    to: "alice@example.com",
    subject: "Hi Alice",
    text: "Alice, you gift Bob"
  });
});
