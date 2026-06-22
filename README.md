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

## Contributing

- Put each script in its own folder with a short `README.md`.
- Bump the `@version` header on every change so the auto-updater picks it up.
- Point `@downloadURL` / `@updateURL` at the script's raw path on `main`.
