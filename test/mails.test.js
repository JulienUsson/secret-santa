const test = require("node:test");
const assert = require("node:assert");
const { renderMail } = require("../src/mails");

const assignment = { santa: { name: "Alice", email: "alice@example.com" }, receiver: { name: "Zoé O'Brien <3" } };

test("renderMail fills people, santa, budget and date in text and subject", () => {
  const mail = renderMail(assignment, {
    from: "santa@example.com",
    subject: "Hi {{santa}}",
    content: "{{santa}}, you gift {{people}} ({{budget}}, {{date}})",
    budget: "20 €",
    date: "24/12"
  });
  assert.strictEqual(mail.from, "santa@example.com");
  assert.strictEqual(mail.to, "alice@example.com");
  assert.strictEqual(mail.subject, "Hi Alice");
  assert.strictEqual(mail.text, "Alice, you gift Zoé O'Brien <3 (20 €, 24/12)");
});

test("renderMail builds an escaped HTML version with the receiver highlighted", () => {
  const mail = renderMail(assignment, {
    from: "santa@example.com",
    subject: "Secret Santa",
    content: "Hello {{santa}}!\n\nYou gift <b>{{people}}</b>",
    budget: "20 €",
    date: ""
  });
  assert.match(mail.html, /Hello Alice!<\/p>/);
  assert.match(mail.html, /&lt;b&gt;<strong[^>]*>Zoé O&#39;Brien &lt;3<\/strong>&lt;\/b&gt;/);
  assert.match(mail.html, /20 €/);
  assert.doesNotMatch(mail.html, /📅/);
  assert.doesNotMatch(mail.html, /\u0000/);
});
