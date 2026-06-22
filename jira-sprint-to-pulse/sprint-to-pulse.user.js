// ==UserScript==
// @name         Jira Sprint → Pulse
// @namespace    https://github.com/canonical/warthog-userscripts
// @version      1.0.0
// @description  Replace the keyword "sprint" with "pulse" across Jira Software UI (case-preserving), optimized for performance.
// @author       you
// @icon         https://warthogs.atlassian.net/favicon.ico
// @downloadURL  https://raw.githubusercontent.com/canonical/warthog-userscripts/main/jira-sprint-to-pulse/sprint-to-pulse.user.js
// @updateURL    https://raw.githubusercontent.com/canonical/warthog-userscripts/main/jira-sprint-to-pulse/sprint-to-pulse.user.js
// @match        https://warthogs.atlassian.net/jira/software*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // Case-preserving replacement of "sprint" -> "pulse" (handles plural "sprints" -> "pulses").
  const WORD_RE = /\bsprints?\b/gi;

  function replaceWord(match) {
    const isPlural = /s$/i.test(match);
    const base = isPlural ? match.slice(0, -1) : match;

    // Detect casing of the base word ("sprint").
    let replacement;
    if (base === base.toUpperCase()) {
      replacement = 'PULSE';
    } else if (base[0] === base[0].toUpperCase()) {
      replacement = 'Pulse';
    } else {
      replacement = 'pulse';
    }

    if (isPlural) {
      const sChar = match[match.length - 1];
      replacement += sChar === 'S' ? 'S' : 's';
    }
    return replacement;
  }

  // Skip nodes inside these elements (no user-visible text we want to touch).
  const SKIP_TAGS = new Set([
    'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'CODE', 'PRE', 'SELECT'
  ]);

  function shouldSkip(el) {
    if (!el) return false;
    if (SKIP_TAGS.has(el.tagName)) return true;
    // Don't rewrite editable fields (user could be typing).
    if (el.isContentEditable) return true;
    // Jira's rich-text editor is ProseMirror. Mutating DOM it owns corrupts its
    // document model (our change gets synced into the saved comment/description)
    // and its typeahead / slash-command overlays render in portals OUTSIDE the
    // contentEditable region, so isContentEditable misses them. Skip the editor
    // and anything it renders.
    if (el.closest && el.closest('.ProseMirror, [data-prosemirror-content-type], [role="textbox"], .akEditor, [data-editor-popup], [data-editor-container]')) {
      return true;
    }
    return false;
  }

  // Walk a root and replace text in qualifying text nodes.
  function processNode(root) {
    if (root.nodeType === Node.TEXT_NODE) {
      maybeReplaceText(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    if (shouldSkip(root)) return;

    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (!node.nodeValue || node.nodeValue.indexOf('print') === -1) {
            // Cheap pre-filter: every "sprint" contains "print".
            return NodeFilter.FILTER_REJECT;
          }
          if (shouldSkip(node.parentElement)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);
    for (const textNode of nodes) maybeReplaceText(textNode);
  }

  function maybeReplaceText(textNode) {
    const value = textNode.nodeValue;
    if (!value || value.indexOf('print') === -1) return;
    if (shouldSkip(textNode.parentElement)) return;
    WORD_RE.lastIndex = 0;
    if (!WORD_RE.test(value)) return;
    WORD_RE.lastIndex = 0;
    textNode.nodeValue = value.replace(WORD_RE, replaceWord);
  }

  // Initial pass.
  processNode(document.body);

  // Debounced batching of mutations to avoid thrashing on Jira's busy DOM.
  let queue = [];
  let scheduled = false;

  function flush() {
    scheduled = false;
    const batch = queue;
    queue = [];
    for (const node of batch) {
      // Node may have been detached; processNode tolerates this.
      try {
        processNode(node);
      } catch (e) {
        /* ignore detached / invalid nodes */
      }
    }
  }

  // Use requestAnimationFrame so replacements run BEFORE the next paint.
  // This keeps the intermediate "Sprint" frame from ever being shown,
  // which eliminates the flicker during Jira's multi-pass initial render.
  const raf = window.requestAnimationFrame || ((cb) => setTimeout(cb, 16));

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    raf(flush);
  }

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'childList') {
        for (const added of m.addedNodes) {
          if (added.nodeType === Node.ELEMENT_NODE || added.nodeType === Node.TEXT_NODE) {
            queue.push(added);
          }
        }
      } else if (m.type === 'characterData') {
        queue.push(m.target);
      }
    }
    if (queue.length) schedule();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
})();
