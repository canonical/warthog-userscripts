const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const { runInNewContext } = require("node:vm");

const source = readFileSync(join(__dirname, "copy-to-mattermost.user.js"), "utf8");
const genericTitle =
  "Merge ~ines-almeida/launchpad:add-metrics-on-person-creation into launchpad:master";

async function copyProposal({ heading, pageTitle = "", message }) {
  let action;
  let copied;
  const document = {
    title: pageTitle,
    querySelector(selector) {
      const text = selector === "#edit-commit_message .yui3-editable_text-text"
        ? message
        : heading;
      return text == null ? null : { textContent: text };
    },
    createElement() {
      return {
        append(child) { this.child = child; },
        setAttribute() {},
        addEventListener(event, handler) { this[event] = handler; },
      };
    },
  };

  runInNewContext(source, {
    document,
    location: {
      pathname: "/~example/project/+git/project/+merge/123",
      origin: "https://code.launchpad.net",
    },
    launchpadActions: { register(options) { action = options.createAction(); } },
    GM_setClipboard(text) { copied = text; },
    clearTimeout() {},
    setTimeout() {},
  });

  await action.child.click({ preventDefault() {} });
  return { copied, tooltip: action.child.title };
}

test("generic merge heading uses the commit subject, not the body or controls", async () => {
  const { copied } = await copyProposal({
    heading: genericTitle,
    message: "\n  Add metrics on person creation  \r\n\r\nDetailed explanation.",
  });
  assert.equal(copied,
    "[:pr: Add metrics on person creation `#123`](https://code.launchpad.net/~example/project/+git/project/+merge/123)");
});

test("an explicit proposal title is preserved", async () => {
  const { copied } = await copyProposal({
    heading: "Improve person creation",
    message: "Different commit subject",
  });
  assert.ok(copied.startsWith("[:pr: Improve person creation `#123`]"));
});

test("generic document title also uses the commit subject", async () => {
  const { copied } = await copyProposal({
    pageTitle: `${genericTitle} : Launchpad`,
    message: "Add metrics",
  });
  assert.ok(copied.startsWith("[:pr: Add metrics `#123`]"));
});

test("an explicit document title remains a fallback", async () => {
  const { copied } = await copyProposal({ pageTitle: "Add metrics : Launchpad" });
  assert.ok(copied.startsWith("[:pr: Add metrics `#123`]"));
});

test("generic titles without a usable commit message are not copied", async () => {
  for (const message of [undefined, "", " \n\t "]) {
    const result = await copyProposal({ heading: genericTitle, message });
    assert.equal(result.copied, undefined);
    assert.equal(result.tooltip, "Title not ready — try again.");
  }
});

test("commit subjects are whitespace-normalized and Markdown-escaped", async () => {
  const { copied } = await copyProposal({
    heading: genericTitle,
    message: "  Add   [metrics] *now*\nBody",
  });
  assert.ok(copied.startsWith("[:pr: Add \\[metrics\\] \\*now\\* `#123`]"));
});
