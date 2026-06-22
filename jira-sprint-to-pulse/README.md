# Jira Sprint → Pulse

Replaces the keyword **"sprint"** with **"pulse"** (our internal name for sprints)
across the Jira Software UI on `https://warthogs.atlassian.net/jira/software*`.

## Install

[Click here to install](https://raw.githubusercontent.com/canonical/warthog-userscripts/main/jira-sprint-to-pulse/sprint-to-pulse.user.js)
(requires [Tampermonkey](https://www.tampermonkey.net/) or
[Violentmonkey](https://violentmonkey.github.io/)).

## What it does

- Case-preserving replacement: `Sprint → Pulse`, `SPRINT → PULSE`, `sprint → pulse`,
  including plurals (`sprints → pulses`).
- Uses word boundaries (`\bsprints?\b`) so it never touches substrings.

## Performance notes

Jira is DOM-heavy, so the script is built to stay light:

- **Cheap pre-filter** — every "sprint" contains the substring `print`, so text
  nodes are rejected with a fast `indexOf` check before any regex runs.
- **TreeWalker** over text nodes only — markup is never re-parsed.
- **Skip list** for `<script>`, `<style>`, `<input>`, `<textarea>`,
  `contentEditable`, etc., so code blocks and editable fields are left intact.
- **Debounced `MutationObserver`** flushed on `requestAnimationFrame` — catches
  new popups/dialogs and runs before the next paint to avoid flicker.
