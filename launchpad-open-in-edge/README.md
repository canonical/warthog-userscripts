# Launchpad "Open in Edge"

Adds an **Open in Edge** action to the global-actions menu on Launchpad merge
proposal pages (`https://code.launchpad.net/~*/*/+git/*/+merge/*`). Clicking it
reloads the current page on the [Edge build of Launchpad](https://edge.launchpad.net),
showing a spinner while it navigates.

> **⚠️ Temporary script.** This is a stop-gap userscript. The intention is for
> "Open in Edge" to become an official part of Launchpad, at which point this
> script can be retired.

## Install

[Click here to install](https://raw.githubusercontent.com/canonical/warthog-userscripts/main/launchpad-open-in-edge/open-in-edge.user.js)
(requires [Tampermonkey](https://www.tampermonkey.net/) or
[Violentmonkey](https://violentmonkey.github.io/)).

## What it does

- Injects an **Open in Edge** link into the `#global-actions` menu on merge
  proposal pages.
- Rewrites the current `code.launchpad.net` URL to `edge.launchpad.net` and
  navigates there when clicked.
- Shows a small spinner and disables the link while the redirect is in flight.
