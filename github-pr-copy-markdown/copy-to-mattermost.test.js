const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const { runInNewContext } = require("node:vm");

const source = readFileSync(join(__dirname, "copy-to-mattermost.user.js"), "utf8");

function setup({
  title = "Add [metrics]",
  headingNumber = "123",
  pageTitle = "",
  pathname = "/canonical/project/pull/123/files",
  clipboard = "legacy",
  failCopy = false,
} = {}) {
  const buttons = [];
  const events = {};
  const copied = [];
  let mutated;
  const actions = {
    querySelector() { return null; },
    append(button) { buttons.push(button); button.parentElement = this; },
  };
  const location = { pathname, origin: "https://github.com" };
  const document = {
    documentElement: {},
    title: pageTitle,
    addEventListener(event, handler) { events[event] = handler; },
    querySelector(selector) {
      if (selector.includes("PH_Actions")) return actions;
      return title == null ? null : {
        textContent: title,
        closest() { return { textContent: `${title} #${headingNumber}` }; },
      };
    },
    getElementById(id) { return buttons.find((button) => button.id === id); },
    createElement() {
      return {
        style: {},
        className: "",
        append(child) { this.child = child; },
        setAttribute(key, value) { this[key] = value; },
        addEventListener(event, handler) { this[event] = handler; },
        remove() { buttons.splice(buttons.indexOf(this), 1); },
      };
    },
  };
  const copy = async (text) => {
    if (failCopy) throw new Error("Clipboard unavailable");
    copied.push(text);
  };
  runInNewContext(source, {
    document,
    location,
    window: { addEventListener(event, handler) { events[event] = handler; } },
    MutationObserver: class {
      constructor(handler) { mutated = handler; }
      observe() {}
    },
    requestAnimationFrame(handler) { handler(); },
    clearTimeout() {},
    setTimeout() {},
    console: { warn() {} },
    ...(clipboard === "legacy" ? { GM_setClipboard: copy } :
      clipboard === "modern" ? { GM: { setClipboard: copy } } :
        { navigator: { clipboard: { writeText: copy } } }),
  });
  return { buttons, events, copied, location, mutated };
}

test("copies escaped Mattermost Markdown with a canonical URL using each clipboard API", async () => {
  for (const clipboard of ["legacy", "modern", "browser"]) {
    const { buttons, copied } = setup({ clipboard });
    const button = buttons[0];
    assert.ok(button.child.innerHTML.includes("<svg"));
    assert.equal(button["aria-label"], "Copy pull request link for Mattermost");
    await button.click();
    assert.deepEqual(copied, [
      "[:pr: Add \\[metrics\\] `#123`](https://github.com/canonical/project/pull/123)",
    ]);
    assert.equal(button.title, "Copied!");
    assert.equal(button.disabled, false);
  }
});

test("falls back to a matching document title", async () => {
  const { buttons, copied } = setup({
    title: null,
    pageTitle: "Add metrics by developer · Pull Request #123 · canonical/project · GitHub",
  });
  await buttons[0].click();
  assert.ok(copied[0].startsWith("[:pr: Add metrics `#123`]"));
});

test("refuses stale headings and unrelated document titles", async () => {
  for (const options of [
    { headingNumber: "122" },
    { title: null, pageTitle: "Some other page · GitHub" },
  ]) {
    const { buttons, copied } = setup(options);
    await buttons[0].click();
    assert.equal(copied.length, 0);
    assert.match(buttons[0].title, /Title not ready/);
  }
});

test("navigation and mutations do not duplicate buttons and remove them off PR pages", () => {
  const state = setup();
  state.mutated();
  state.events["turbo:load"]();
  assert.equal(state.buttons.length, 1);
  state.location.pathname = "/canonical/project/issues";
  state.events.popstate();
  assert.equal(state.buttons.length, 0);
  state.location.pathname = "/canonical/project/pull/123";
  state.events["soft-nav:end"]();
  assert.equal(state.buttons.length, 1);
});

test("does not add a button on non-PR pages", () => {
  assert.equal(setup({ pathname: "/canonical/project" }).buttons.length, 0);
});

test("clipboard failure restores the button and provides feedback", async () => {
  const { buttons, copied } = setup({ failCopy: true });
  await buttons[0].click();
  assert.equal(copied.length, 0);
  assert.equal(buttons[0].disabled, false);
  assert.match(buttons[0].title, /Copy failed/);
});
