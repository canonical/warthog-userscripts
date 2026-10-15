// ==UserScript==
// @name         Launchpad MP: Copy to Mattermost
// @namespace    https://github.com/canonical/warthog-userscripts
// @version      1.5.2
// @description  Copy Launchpad merge proposal links as Mattermost Markdown.
// @author       Canonical
// @icon         https://launchpad.net/@@/launchpad.png
// @downloadURL  https://raw.githubusercontent.com/canonical/warthog-userscripts/main/launchpad-mp-copy-markdown/copy-to-mattermost.user.js
// @updateURL    https://raw.githubusercontent.com/canonical/warthog-userscripts/main/launchpad-mp-copy-markdown/copy-to-mattermost.user.js
// @require      https://raw.githubusercontent.com/canonical/warthog-userscripts/main/shared/launchpad-actions.js?v=1.0.0
// @match        https://code.launchpad.net/*
// @grant        GM_setClipboard
// @grant        GM.setClipboard
// @run-at       document-idle
// ==/UserScript==

(() => {
  "use strict";

  const BUTTON_ID = "launchpad-mp-copy-markdown";
  const BUTTON_LABEL = "Copy to Mattermost";
  const TOOLTIP = "Copy merge proposal link for Mattermost";

  function currentMP() {
    const match = location.pathname.match(
      /^(\/.+\/\+merge\/(\d+))(?:\/.*)?$/
    );
    if (!match) return null;

    return {
      number: match[2],
      url: `${location.origin}${match[1]}`,
    };
  }

  function readTitle() {
    const selectors = ["#maincontent h1", "#main-content h1", "h1"];

    for (const selector of selectors) {
      const node = document.querySelector(selector);
      const title = node?.textContent.replace(/\s+/g, " ").trim();

      if (title && !/^(Launchpad|Merge proposal)$/i.test(title)) {
        return title;
      }
    }

    const pageTitle = document.title
      .replace(/\s*[:|·—-]\s*Launchpad\s*$/i, "")
      .replace(/\s+/g, " ")
      .trim();

    return pageTitle || null;
  }

  function escapeMarkdown(text) {
    return text.replace(/[\\[\]`*_<>~]/g, "\\$&");
  }

  async function copyText(text) {
    if (typeof GM_setClipboard === "function") {
      await GM_setClipboard(text, "text");
    } else if (
      typeof GM !== "undefined" &&
      typeof GM.setClipboard === "function"
    ) {
      await GM.setClipboard(text, "text");
    } else {
      await navigator.clipboard.writeText(text);
    }
  }

  function createAction() {
    const item = document.createElement("li");
    item.id = BUTTON_ID;

    const link = document.createElement("a");
    link.href = "#";
    link.className = "menu-link sprite edit";
    link.textContent = BUTTON_LABEL;

    function setTooltip(text) {
      link.title = text;
      link.setAttribute("aria-label", text);
    }

    setTooltip(TOOLTIP);

    let resetTimer;

    link.addEventListener("click", async (event) => {
      event.preventDefault();
      clearTimeout(resetTimer);

      const mp = currentMP();
      const title = readTitle();

      if (!mp || !title) {
        setTooltip("Title not ready — try again.");
      } else {
        try {
          const markdown =
            `[:pr: ${escapeMarkdown(title)} \`#${mp.number}\`](${mp.url})`;

          await copyText(markdown);

          link.textContent = "Copied!";
          setTooltip("Copied!");
        } catch (error) {
          setTooltip("Copy failed — check clipboard permissions.");
          console.warn("[Launchpad MP: Copy to Mattermost]", error);
        }
      }

      resetTimer = setTimeout(() => {
        link.textContent = BUTTON_LABEL;
        setTooltip(TOOLTIP);
      }, 1800);
    });

    item.append(link);
    return item;
  }

  launchpadActions.register({
    id: BUTTON_ID,
    isActive: currentMP,
    createAction,
  });
})();
