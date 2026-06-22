# AGENTS.md — Jira Sprint → Pulse

Context and findings for anyone (human or agent) working on this userscript.

## Goal

Replace the keyword **"sprint"** with **"pulse"** across the Jira Software UI on
`https://warthogs.atlassian.net/jira/software*`. "Pulse" is our internal name for
sprints, so the script just makes the UI match the terminology we actually use.

## Scope / matching

- `@match https://warthogs.atlassian.net/jira/software*` — Jira Software pages only.
- Replacement is **case-preserving**: `Sprint→Pulse`, `SPRINT→PULSE`,
  `sprint→pulse`, and plurals (`sprints→pulses`).
- Uses word boundaries (`\bsprints?\b`) so substrings are never touched.
- Only visible **text nodes** are rewritten — attributes (e.g. `href`) and URLs
  are intentionally left alone so copied links keep working.

## Performance findings (Jira is DOM-heavy)

- **Cheap pre-filter:** every "sprint" contains the substring `print`, so text
  nodes are rejected with a fast `indexOf('print')` check before any regex runs.
  This avoids running the regex over the vast majority of nodes.
- **TreeWalker** with `SHOW_TEXT` only — markup is never re-parsed; we only visit
  text nodes.
- **Skip list** for `<script>`, `<style>`, `<noscript>`, `<textarea>`, `<input>`,
  `<code>`, `<pre>`, `<select>`, and any `contentEditable` element — prevents
  corrupting code blocks and fields the user is typing into.
- **MutationObserver** (childList + subtree + characterData) catches new
  popups/dialogs/menus. Mutations are **queued and debounced**, and only the
  added subtrees are reprocessed — never the whole page.

## Flicker fix (important)

Originally the debounce flushed via `requestIdleCallback`, which runs **after**
paint. Jira re-renders the same nodes several times during initial load, so users
saw "Sprint" painted then swapped to "Pulse" repeatedly → visible flicker.

**Fix:** flush on `requestAnimationFrame`, which runs **before** the next paint.
The replacement lands in the same frame React mutated the DOM, so the
intermediate "Sprint" frame is never shown.

If a single flash still appears on first load, the next lever is moving
`@run-at` to `document-start` and attaching the observer as early as possible so
even the very first render pass is caught. (Not done yet — current behavior is
acceptable.)

## Distribution

- Lives in `canonical/warthog-userscripts`, one folder per script.
- `@downloadURL` / `@updateURL` point at the raw `main` path:
  `https://raw.githubusercontent.com/canonical/warthog-userscripts/main/jira-sprint-to-pulse/sprint-to-pulse.user.js`
- **Bump `@version` on every change** — the auto-updater only installs when the
  remote version is higher than the installed one.

## Ideas / not done

- Optionally rewrite `sprint` inside link text vs. URLs (currently URLs untouched).
- `document-start` + early observer attach if first-load flash becomes an issue.
- Could generalize the find/replace into a config map if more term swaps are wanted.
