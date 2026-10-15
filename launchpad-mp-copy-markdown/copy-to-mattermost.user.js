// ==UserScript==
// @name         Launchpad MP: Copy to Mattermost
// @namespace    https://github.com/canonical/warthog-userscripts
// @version      1.2.1
// @description  Copy Launchpad merge proposal links as Mattermost Markdown.
// @author       Canonical
// @icon         https://launchpad.net/@@/launchpad.png
// @downloadURL  https://raw.githubusercontent.com/canonical/warthog-userscripts/main/launchpad-mp-copy-markdown/copy-to-mattermost.user.js
// @updateURL    https://raw.githubusercontent.com/canonical/warthog-userscripts/main/launchpad-mp-copy-markdown/copy-to-mattermost.user.js
// @match        https://code.launchpad.net/*
// @grant        GM_setClipboard
// @grant        GM.setClipboard
// @run-at       document-idle
// ==/UserScript==

(() => {
  "use strict";

  const BUTTON_ID = "launchpad-mp-copy-markdown";
  const PORTLET_ID = "launchpad-mp-copy-markdown-portlet";
  const ACTIONS_SELECTOR = "#global-actions > ul";
  const SIDEBAR_SELECTOR = "#side-portlets";
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

  function getActionsContainer() {
    // Logged in: use the existing actions menu.
    const actions = document.querySelector(ACTIONS_SELECTOR);
    if (actions) return actions;

    // Logged out: create an Actions portlet in the sidebar.
    const sidebar = document.querySelector(SIDEBAR_SELECTOR);
    if (!sidebar) return null;

    let portlet = document.getElementById(PORTLET_ID);

    if (!portlet || portlet.parentElement !== sidebar) {
      portlet?.remove();

      portlet = document.createElement("div");
      portlet.id = PORTLET_ID;
      portlet.className = "portlet";

      const heading = document.createElement("h2");
      heading.textContent = "Actions";

      const list = document.createElement("ul");

      portlet.append(heading, list);
      sidebar.prepend(portlet);
    }

    return portlet.querySelector("ul");
  }

  function refresh() {
    const existing = document.getElementById(BUTTON_ID);
    const fallbackPortlet = document.getElementById(PORTLET_ID);

    // Only display on merge proposal pages.
    if (!currentMP()) {
      existing?.remove();
      fallbackPortlet?.remove();
      return;
    }

    const actions = getActionsContainer();

    if (!actions) {
      existing?.remove();
      fallbackPortlet?.remove();
      return;
    }

    // Reuse the existing button to avoid duplicates.
    const item = existing || createAction();

    if (item.parentElement !== actions) {
      actions.append(item);
    }

    // Remove fallback when the standard actions menu exists.
    if (document.querySelector(ACTIONS_SELECTOR)) {
      document.getElementById(PORTLET_ID)?.remove();
    }
  }

  let scheduled = false;

  function scheduleRefresh() {
    if (scheduled) return;
    scheduled = true;

    requestAnimationFrame(() => {
      scheduled = false;
      refresh();
    });
  }

  new MutationObserver(scheduleRefresh).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  window.addEventListener("popstate", scheduleRefresh);
  window.addEventListener("pageshow", scheduleRefresh);

  refresh();
})();
