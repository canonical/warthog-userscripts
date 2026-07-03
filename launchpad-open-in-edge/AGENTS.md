# AGENTS.md — Launchpad "Open in Edge"

Context and findings for anyone (human or agent) working on this userscript.

## Goal

Add an **Open in Edge** action to the global-actions menu on Launchpad merge
proposal pages so users can quickly re-open the current page on the Edge build
of Launchpad (`edge.launchpad.net`).

## Temporary status

**This is a temporary userscript.** It exists only to bridge the gap until an
"Open in Edge" action ships as an official part of Launchpad. Once that lands
upstream, this script should be retired (remove the folder and its row in the
root `README.md`).

## Scope / matching

- `@match https://code.launchpad.net/~*/*/+git/*/+merge/*` — Git merge proposal
  pages only.
- `@grant GM_addStyle` is required for the injected spinner styles.
- `@run-at document-idle` so `#global-actions` exists before we query it.

## How it works

1. Injects CSS for the loading state and spinner via `GM_addStyle`.
2. Finds `#global-actions ul`; bails out early if the menu isn't present.
3. Builds the Edge URL by replacing the `https://code.launchpad.net` origin with
   `https://edge.launchpad.net` on the current `location.href`.
4. Appends a new `<li>` with the "Open in Edge" link styled like the existing
   menu items (`menu-link sprite edit`).
5. On click, prevents default navigation, shows a spinner, disables the link,
   then navigates to the Edge URL.

## Distribution

- Lives in `canonical/warthog-userscripts`, one folder per script.
- `@downloadURL` / `@updateURL` point at the raw `main` path:
  `https://raw.githubusercontent.com/canonical/warthog-userscripts/main/launchpad-open-in-edge/open-in-edge.user.js`
- **Bump `@version` on every change** — the auto-updater only installs when the
  remote version is higher than the installed one.
