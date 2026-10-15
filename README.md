# warthog-userscripts

A collection of small quality-of-life (QoL) userscripts for Canonical's internal web tools.

## Installing

1. Install a userscript manager such as
   [Tampermonkey](https://www.tampermonkey.net/) or
   [Violentmonkey](https://violentmonkey.github.io/).
2. Click the **install** link for the script you want below — your userscript
   manager will open an install prompt automatically.
3. Scripts auto-update via their `@updateURL`, so you'll get fixes as they land.

## Scripts

| Script | Description | Install |
| ------ | ----------- | ------- |
| [Jira Sprint → Pulse](./jira-sprint-to-pulse) | Replaces the keyword "sprint" with "pulse" across the Jira Software UI. | [Install](https://raw.githubusercontent.com/canonical/warthog-userscripts/main/jira-sprint-to-pulse/sprint-to-pulse.user.js) |
| [Launchpad "Open in Edge"](./launchpad-open-in-edge) | _Temporary:_ adds an "Open in Edge" action to Launchpad merge pages, including when logged out, until this becomes an official part of Launchpad. | [Install](https://raw.githubusercontent.com/canonical/warthog-userscripts/main/launchpad-open-in-edge/open-in-edge.user.js) |
| [Launchpad MP: Copy to Mattermost](./launchpad-mp-copy-markdown) | Adds a "Copy to Mattermost" action to merge proposal pages, copying the title, proposal number, and canonical link as Markdown. Works when logged in or logged out. | [Install](https://raw.githubusercontent.com/canonical/warthog-userscripts/main/launchpad-mp-copy-markdown/copy-to-mattermost.user.js) |

## Contributing

- Put each script in its own folder with a short `README.md`.
- Bump the `@version` header on every change so the auto-updater picks it up.
- Point `@downloadURL` / `@updateURL` at the script's raw path on `main`.
- Both Launchpad scripts load `shared/launchpad-actions.js` via `@require` to
  reuse the standard actions menu or share a single logged-out sidebar portlet.
  When changing the helper, bump the version query in both `@require` URLs and
  both scripts' `@version` headers so userscript managers refresh the dependency.
