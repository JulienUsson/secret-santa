const $ = selector => document.querySelector(selector);

const state = {
  participants: [],
  dirty: false
};

const storage = {
  get(key, fallback) {
    try {
      const value = localStorage.getItem(`secret-santa:${key}`);
      return value === null ? fallback : JSON.parse(value);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(`secret-santa:${key}`, JSON.stringify(value));
    } catch {}
  }
};

async function api(method, url, body) {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || response.statusText);
  }
  return data;
}

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([key, value]) => {
    if (key.startsWith("on")) {
      node.addEventListener(key.slice(2), value);
    } else if (key in node) {
      node[key] = value;
    } else {
      node.setAttribute(key, value);
    }
  });
  children.flat().forEach(child => node.append(child));
  return node;
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function setStatus(target, kind, lines) {
  const node = $(target);
  node.className = `status ${kind}`;
  node.replaceChildren(
    ...[]
      .concat(lines)
      .filter(Boolean)
      .map(line => el("div", { textContent: line }))
  );
}

function sameEntry(a, b) {
  return a.toLowerCase() === b.toLowerCase();
}

function refersTo(entry, participant) {
  return sameEntry(entry, participant.name) || sameEntry(entry, participant.email);
}

function labelFor(entry) {
  const match = state.participants.find(p => refersTo(entry, p));
  return match ? match.name : entry;
}

function addExclusion(participant, other) {
  if (!participant.blacklist.some(entry => refersTo(entry, other))) {
    participant.blacklist.push(other.name);
  }
  if ($("#mutual").checked && !other.blacklist.some(entry => refersTo(entry, participant))) {
    other.blacklist.push(participant.name);
  }
}

function removeExclusion(participant, entry) {
  const other = state.participants.find(p => refersTo(entry, p));
  participant.blacklist = participant.blacklist.filter(e => e !== entry);
  if (other && $("#mutual").checked) {
    other.blacklist = other.blacklist.filter(e => !refersTo(e, participant));
  }
}

function renameReferences(oldName, newName) {
  state.participants.forEach(p => {
    p.blacklist = p.blacklist.map(entry => (sameEntry(entry, oldName) ? newName : entry));
  });
}

function changed() {
  state.dirty = true;
  renderParticipants();
  checkParticipants();
  updatePreview();
}

function renderParticipants() {
  const body = $("#participants-body");
  const { participants } = state;
  $("#participant-count").textContent = participants.length ? `(${participants.length})` : "";
  $("#save-participants").classList.toggle("dirty", state.dirty);

  if (participants.length === 0) {
    body.replaceChildren(
      el(
        "tr",
        {},
        el("td", {
          colSpan: 4,
          className: "empty",
          textContent: "No participants yet. Add some below or import a CSV."
        })
      )
    );
    return;
  }

  body.replaceChildren(
    ...participants.map((participant, index) => {
      const others = participants.filter(
        other => other !== participant && !participant.blacklist.some(entry => refersTo(entry, other))
      );

      const select = el(
        "select",
        {
          className: "exclude-select",
          onchange: event => {
            const other = participants[Number(event.target.value)];
            if (other) {
              addExclusion(participant, other);
              changed();
            }
          }
        },
        el("option", { value: "", textContent: "+ exclude…" }),
        others.map(other => el("option", { value: String(participants.indexOf(other)), textContent: other.name }))
      );
      select.hidden = others.length === 0;

      return el(
        "tr",
        {},
        el(
          "td",
          {},
          el("input", {
            value: participant.name,
            "aria-label": "Name",
            onchange: event => {
              const newName = event.target.value.trim();
              renameReferences(participant.name, newName);
              participant.name = newName;
              changed();
            }
          })
        ),
        el(
          "td",
          {},
          el("input", {
            type: "email",
            value: participant.email,
            "aria-label": "Email",
            onchange: event => {
              participant.email = event.target.value.trim();
              changed();
            }
          })
        ),
        el(
          "td",
          {},
          el(
            "div",
            { className: "chips" },
            participant.blacklist.map(entry =>
              el(
                "span",
                { className: "chip" },
                labelFor(entry),
                el("button", {
                  className: "chip-remove",
                  title: "Remove exclusion",
                  textContent: "×",
                  onclick: () => {
                    removeExclusion(participant, entry);
                    changed();
                  }
                })
              )
            ),
            select
          )
        ),
        el(
          "td",
          {},
          el("button", {
            className: "icon",
            title: "Remove participant",
            textContent: "✕",
            onclick: () => {
              participants.splice(index, 1);
              participants.forEach(p => {
                p.blacklist = p.blacklist.filter(entry => !refersTo(entry, participant));
              });
              changed();
            }
          })
        )
      );
    })
  );
}

const checkParticipants = debounce(async () => {
  if (state.participants.length === 0) {
    setStatus("#check-status", "", "");
    return;
  }
  const { errors, warnings, feasible } = await api("POST", "/api/check", { participants: state.participants });
  if (errors.length) {
    setStatus("#check-status", "error", errors);
  } else {
    setStatus("#check-status", warnings.length ? "warning" : "success", [
      feasible ? "✅ A valid draw is possible." : null,
      ...warnings.map(w => `⚠️ ${w}`)
    ]);
  }
}, 250);

function readTemplate() {
  return {
    from: $("#mail-from").value,
    subject: $("#mail-subject").value,
    content: $("#mail-content").value
  };
}

function readSmtp() {
  return {
    host: $("#smtp-host").value.trim(),
    port: Number($("#smtp-port").value) || undefined,
    secure: $("#smtp-secure").checked,
    user: $("#smtp-user").value.trim(),
    password: $("#smtp-password").value || undefined
  };
}

const updatePreview = debounce(async () => {
  const template = readTemplate();
  storage.set("template", template);
  const { mail, error } = await api("POST", "/api/preview", { participants: state.participants, template });
  if (error) {
    $("#preview-text").textContent = error;
    $("#mail-preview").classList.add("invalid");
    return;
  }
  $("#mail-preview").classList.remove("invalid");
  $("#preview-to").textContent = mail.to;
  $("#preview-subject").textContent = mail.subject;
  $("#preview-text").textContent = mail.text;
}, 200);

function parseCsv(text) {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith("#"))
    .map(line => {
      const [name = "", email = "", blacklist = ""] = line.split(";");
      return {
        name: name.trim(),
        email: email.trim(),
        blacklist: blacklist
          .split(",")
          .map(e => e.trim())
          .filter(Boolean)
      };
    });
}

async function saveParticipants() {
  try {
    const result = await api("PUT", "/api/participants", { participants: state.participants });
    state.participants = result.participants;
    state.dirty = false;
    renderParticipants();
    checkParticipants();
  } catch (error) {
    setStatus("#check-status", "error", error.message);
  }
}

function confirmSend(count) {
  const dialog = $("#confirm-dialog");
  $("#confirm-text").textContent =
    `${count} participants will receive their Secret Santa by mail. Each new draw is different, so only do this once!`;
  dialog.showModal();
  return new Promise(resolve => {
    dialog.addEventListener("close", () => resolve(dialog.returnValue === "ok"), { once: true });
  });
}

async function send(dryRun) {
  if (!dryRun && !(await confirmSend(state.participants.length))) {
    return;
  }
  const buttons = [$("#send"), $("#dry-run")];
  buttons.forEach(button => (button.disabled = true));
  $("#dry-run-result").hidden = true;
  setStatus("#send-status", "pending", dryRun ? "Drawing…" : "Drawing and sending mails…");

  try {
    const result = await api("POST", "/api/send", {
      participants: state.participants,
      template: readTemplate(),
      smtp: readSmtp(),
      save: $("#save-mails").checked,
      dryRun
    });

    if (result.error) {
      setStatus("#send-status", "error", result.errors || result.error);
      return;
    }

    const warnings = (result.warnings || []).map(w => `⚠️ ${w}`);

    if (dryRun) {
      setStatus("#send-status", "success", ["✅ Dry run done, no mail was sent.", ...warnings]);
      $("#dry-run-mails").classList.add("spoiler");
      $("#dry-run-mails").replaceChildren(
        ...result.mails.map(mail =>
          el(
            "li",
            {},
            el("div", { className: "mail-meta" }, el("strong", { textContent: mail.to }), ` — ${mail.subject}`),
            el("pre", { textContent: mail.text })
          )
        )
      );
      $("#dry-run-result").hidden = false;
      return;
    }

    const failed = result.results.filter(r => !r.ok);
    setStatus("#send-status", failed.length ? "error" : "success", [
      failed.length
        ? `${result.results.length - failed.length}/${result.results.length} mails sent.`
        : `🎉 ${result.results.length} mails sent! Merry Christmas!`,
      ...failed.map(r => `❌ ${r.to}: ${r.error}`),
      ...warnings
    ]);
  } catch (error) {
    setStatus("#send-status", "error", error.message);
  } finally {
    buttons.forEach(button => (button.disabled = false));
  }
}

async function init() {
  const data = await api("GET", "/api/state");
  state.participants = data.participants;
  $("#santas-file").textContent = data.santasFile;

  const template = { ...data.template, ...storage.get("template", {}) };
  $("#mail-from").value = template.from;
  $("#mail-subject").value = template.subject;
  $("#mail-content").value = template.content;

  const smtp = { ...data.smtp, ...storage.get("smtp", {}) };
  $("#smtp-host").value = smtp.host;
  $("#smtp-port").value = smtp.port;
  $("#smtp-secure").checked = smtp.secure;
  $("#smtp-user").value = smtp.user;
  $("#smtp-password").placeholder = data.smtp.hasPassword ? "•••••• (from .env)" : "";
  $("#save-mails").checked = data.saveMails;

  renderParticipants();
  checkParticipants();
  updatePreview();

  ["#mail-from", "#mail-subject", "#mail-content"].forEach(id => $(id).addEventListener("input", updatePreview));

  ["#smtp-host", "#smtp-port", "#smtp-secure", "#smtp-user"].forEach(id =>
    $(id).addEventListener("change", () => {
      const { password, ...rest } = readSmtp();
      storage.set("smtp", rest);
    })
  );

  $("#add-participant").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.target;
    const { name, email } = form.elements;
    state.participants.push({ name: name.value.trim(), email: email.value.trim(), blacklist: [] });
    form.reset();
    name.focus();
    changed();
  });

  $("#import-csv").addEventListener("change", async event => {
    const file = event.target.files[0];
    if (!file) return;
    state.participants = parseCsv(await file.text());
    event.target.value = "";
    changed();
  });

  $("#save-participants").addEventListener("click", saveParticipants);

  $("#test-smtp").addEventListener("click", async () => {
    setStatus("#smtp-status", "pending", "Connecting…");
    const { ok, error } = await api("POST", "/api/smtp/test", { smtp: readSmtp() });
    setStatus("#smtp-status", ok ? "success" : "error", ok ? "✅ Connection successful." : `❌ ${error}`);
  });

  $("#dry-run").addEventListener("click", () => send(true));
  $("#send").addEventListener("click", () => send(false));
  $("#reveal").addEventListener("click", () => $("#dry-run-mails").classList.toggle("spoiler"));

  window.addEventListener("beforeunload", event => {
    if (state.dirty) {
      event.preventDefault();
    }
  });
}

init().catch(error => setStatus("#check-status", "error", `Failed to load: ${error.message}`));
