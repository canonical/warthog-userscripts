// ==UserScript==
// @name         GitHub PR: Copy to Mattermost
// @namespace    https://github.com/canonical/warthog-userscripts
// @version      1.1.1
// @description  Copy GitHub pull request links as Mattermost Markdown.
// @author       Canonical
// @icon         https://github.com/favicon.ico
// @downloadURL  https://raw.githubusercontent.com/canonical/warthog-userscripts/main/github-pr-copy-markdown/copy-to-mattermost.user.js
// @updateURL    https://raw.githubusercontent.com/canonical/warthog-userscripts/main/github-pr-copy-markdown/copy-to-mattermost.user.js
// @match        https://github.com/*
// @grant        GM_setClipboard
// @grant        GM.setClipboard
// @run-at       document-idle
// ==/UserScript==

(() => {
  "use strict";

  const BUTTON_ID = "github-pr-copy-markdown";
  const ACTIONS_SELECTOR = '[data-component="PH_Actions"], .gh-header-actions';
  const TOOLTIP = "Copy pull request link for Mattermost";

  function currentPR() {
    const match = location.pathname.match(
      /^\/([^/]+)\/([^/]+)\/pull\/(\d+)(?:\/.*)?$/
    );
    if (!match) return null;

    const [, owner, repo, number] = match;
    return {
      owner,
      repo,
      number,
      url: `${location.origin}/${owner}/${repo}/pull/${number}`,
    };
  }

  function readTitle(pr) {
    const node = document.querySelector(".js-issue-title, .markdown-title");

    if (node) {
      const heading = node.closest('h1, [data-component="PH_Title"]');
      const headingNumber = heading?.textContent.match(/#(\d+)\s*$/)?.[1];

      if (headingNumber && headingNumber !== pr.number) return null;

      const title = node.textContent.replace(/\s+/g, " ").trim();
      if (title) return title;
    }

    const suffix = ` · Pull Request #${pr.number} · ${pr.owner}/${pr.repo}`;
    const pageTitle = document.title.replace(/ · GitHub$/, "");
    if (!pageTitle.endsWith(suffix)) return null;

    return pageTitle
      .slice(0, -suffix.length)
      .replace(/ by \S+$/, "")
      .replace(/\s+/g, " ")
      .trim() || null;
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

  function createButton(actions) {
    const button = document.createElement("button");
    button.id = BUTTON_ID;
    button.type = "button";
    button.setAttribute("data-component", "Button");
    button.setAttribute("data-size", "medium");
    button.setAttribute("data-variant", "default");
    button.style.cssText = "width:32px;min-width:32px;padding:0;";

    const content = document.createElement("span");
    content.setAttribute("data-component", "buttonContent");
    content.setAttribute("data-align", "center");
    content.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round"
           aria-hidden="true" focusable="false"
           style="display:block">
        <rect x="9" y="9" width="13" height="13" rx="2"/>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
      </svg>
    `;
    button.append(content);

    // Reuse GitHub's current native button styling.
    const nativeButton = actions.querySelector(
      'button[data-component="Button"], button'
    );

    for (const [element, reference, prefix] of [
      [button, nativeButton, "prc-Button-ButtonBase-"],
      [
        content,
        nativeButton?.querySelector('[data-component="buttonContent"]'),
        "prc-Button-ButtonContent-",
      ],
    ]) {
      const className = reference &&
        [...reference.classList].find((name) => name.startsWith(prefix));
      if (className) element.classList.add(className);
    }

    if (!button.className) button.className = "btn";

    function setTooltip(text) {
      button.title = text;
      button.setAttribute("aria-label", text);
    }
    setTooltip(TOOLTIP);

    let resetTimer;
    button.addEventListener("click", async () => {
      if (button.disabled) return;
      clearTimeout(resetTimer);

      const pr = currentPR();
      const title = pr && readTitle(pr);

      if (!title) {
        setTooltip("Title not ready — wait for the PR to load and try again.");
      } else {
        button.disabled = true;
        try {
          await copyText(
            `[:pr: ${escapeMarkdown(title)} \`#${pr.number}\`](${pr.url})`
          );
          setTooltip("Copied!");
        } catch (error) {
          setTooltip("Copy failed — check clipboard permissions.");
          console.warn("[GitHub PR: Copy to Mattermost]", error);
        } finally {
          button.disabled = false;
        }
      }

      resetTimer = setTimeout(() => setTooltip(TOOLTIP), 1800);
    });

    return button;
  }

  function refresh() {
    const actions = currentPR() && document.querySelector(ACTIONS_SELECTOR);
    const existing = document.getElementById(BUTTON_ID);

    if (!actions) {
      existing?.remove();
      return;
    }
    if (existing?.parentElement === actions) return;

    existing?.remove();
    actions.append(createButton(actions));
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
    characterData: true,
  });

  for (const event of ["turbo:load", "turbo:render", "pjax:end", "soft-nav:end"]) {
    document.addEventListener(event, scheduleRefresh);
  }

  window.addEventListener("popstate", scheduleRefresh);
  window.addEventListener("pageshow", scheduleRefresh);
  refresh();
})();
