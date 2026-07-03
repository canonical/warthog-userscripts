// ==UserScript==
// @name         Launchpad 'Open in Edge' Redirect with Spinner
// @namespace    https://github.com/canonical/warthog-userscripts
// @version      1.5.0
// @description  Adds an 'Open in Edge' action to the global-actions menu on code.launchpad.net merge pages, with a spinner while loading. TEMPORARY: intended to be superseded once this becomes an official Launchpad feature.
// @author       Canonical
// @icon         https://launchpad.net/@@/launchpad.png
// @downloadURL  https://raw.githubusercontent.com/canonical/warthog-userscripts/main/launchpad-open-in-edge/open-in-edge.user.js
// @updateURL    https://raw.githubusercontent.com/canonical/warthog-userscripts/main/launchpad-open-in-edge/open-in-edge.user.js
// @match        https://code.launchpad.net/~*/*/+git/*/+merge/*
// @run-at       document-idle
// @grant        GM_addStyle
// ==/UserScript==

// NOTE: This is a TEMPORARY userscript. It exists to bridge the gap until an
// "Open in Edge" action is shipped as an official part of Launchpad. Once that
// lands upstream, this script can be retired.

(function () {
  'use strict';

  // --- 1. Define Styles ---
  GM_addStyle(`
        #lp-edge-redirect-link.lp-loading {
            opacity: 0.6;
            cursor: not-allowed;
            pointer-events: none;
        }
        .lp-spinner {
            border: 2px solid #f3f3f3;
            border-top: 2px solid currentColor;
            border-radius: 50%;
            width: 10px;
            height: 10px;
            animation: lp-spin 1s linear infinite;
            display: inline-block;
            vertical-align: middle;
            margin-right: 4px;
        }
        @keyframes lp-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `);

  // --- 2. Find the target menu ---
  const menu = document.querySelector('#global-actions ul');
  if (!menu) return;

  // --- 3. Create the link inside a new <li> ---
  const newUrl = window.location.href.replace(
    'https://code.launchpad.net',
    'https://edge.launchpad.net'
  );

  const li = document.createElement('li');
  const link = document.createElement('a');
  link.id = 'lp-edge-redirect-link';
  link.className = 'menu-link sprite edit';
  link.href = newUrl;
  link.textContent = 'Open in Edge';
  link.title = 'Open this page on the Edge build of Launchpad';

  // --- 4. Click handler with spinner ---
  link.addEventListener('click', (e) => {
    e.preventDefault();
    link.classList.add('lp-loading');
    link.innerHTML = '<span class="lp-spinner"></span>Loading...';
    window.location.href = newUrl;
  });

  // --- 5. Insert into the menu ---
  li.appendChild(link);
  menu.appendChild(li);
})();
