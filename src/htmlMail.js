const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function paragraphs(text, highlight) {
  const strong = `<strong style="color:#b3261e;font-size:1.15em;">${escapeHtml(highlight.value)}</strong>`;
  return text
    .trim()
    .split(/\n\s*\n/)
    .map(block => escapeHtml(block).split(highlight.token).join(strong).replace(/\n/g, "<br>"))
    .map(block => `<p style="margin:0 0 16px;">${block}</p>`)
    .join("");
}

function detail(icon, label, value) {
  return `<td style="padding:6px;" width="50%" valign="top">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1e9;border-radius:12px;">
        <tr><td style="padding:14px 16px;font-family:${FONT};">
          <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#7a6f63;">${icon} ${label}</div>
          <div style="font-size:18px;font-weight:700;color:#1f2a24;margin-top:4px;">${escapeHtml(value)}</div>
        </td></tr>
      </table>
    </td>`;
}

function renderHtml({ subject, text, highlight, budget, date }) {
  const details = [budget && detail("💰", "Budget", budget), date && detail("📅", "Date", date)].filter(Boolean);

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#efe7da;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#efe7da;">
  <tr><td align="center" style="padding:32px 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:18px;overflow:hidden;font-family:${FONT};color:#1f2a24;">
      <tr><td align="center" style="background:#b3261e;background-image:linear-gradient(135deg,#c0392b 0%,#8e1b14 100%);padding:36px 24px 30px;color:#ffffff;">
        <div style="font-size:14px;letter-spacing:6px;opacity:0.7;">❄ ❄ ❄</div>
        <div style="font-size:56px;line-height:1.2;margin-top:6px;">🎅</div>
        <div style="font-size:26px;font-weight:800;letter-spacing:0.5px;margin-top:6px;">Secret Santa</div>
      </td></tr>
      <tr><td style="padding:32px 32px 16px;font-size:17px;line-height:1.6;">
        ${paragraphs(text, highlight)}
      </td></tr>
      ${
        details.length
          ? `<tr><td style="padding:0 26px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${details.join("")}</tr></table>
      </td></tr>`
          : ""
      }
      <tr><td align="center" style="background:#1e5c3a;color:#ffffff;padding:16px;font-size:14px;">
        🎄 Shh… it's a secret! 🎄
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>
`;
}

module.exports = { renderHtml, escapeHtml };
