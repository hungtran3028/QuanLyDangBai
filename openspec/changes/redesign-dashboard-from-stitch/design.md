## Context

The current frontend is plain HTML, CSS, and browser JavaScript. The first Stitch redesign pass improved the visual layout, but the markup still lives mostly inside `app/index.html`. The operator now wants major functions split into separate views so the app feels like an operations tool rather than one long page.

## Goals

- Keep the existing no-build frontend stack.
- Keep `app/index.html` as the shared shell only.
- Move feature-specific markup into view/template files under `app/views/`.
- Match the Stitch exported UI as closely as practical by using the same Tailwind CDN config, Inter font, Material Symbols, layout classes, spacing tokens, and color tokens.
- Preserve current backend APIs and file-based data.
- Preserve current DOM IDs or provide a reliable remounting layer so existing interactions continue to work.
- Support simple direct navigation with hash routes.

## Non-Goals

- Do not add React, Vue, Vite, or another frontend framework/build step.
- Do not add a database or backend routing system for each view.
- Do not change Facebook OAuth callback behavior.

## Proposed View Structure

- `app/index.html`: shared shell, sidebar, topbar host, main view root, toast.
- `app/views/dashboard.html`: summary metrics, status tabs, post queue, schedule list.
- `app/views/post-detail.html`: selected post detail, media set, readiness checklist, caption editor, scheduling, actions, history.
- `app/views/prompt-helper.html`: prompt controls and prompt preview.
- `app/views/facebook.html`: Facebook connection state, Page selector, connect action.
- `app/views/media-library.html`: student photo album selector and photo grid.

## Routing Approach

Use hash-based client routing such as `#/dashboard`, `#/detail/<slug>`, `#/prompt`, `#/facebook`, and `#/media`.

The app shell loads the matching HTML partial with `fetch()`, injects it into a shared `#viewRoot`, then initializes that view's event handlers. Shared state such as `posts`, `selectedSlug`, `albums`, `selectedAlbum`, and Facebook status remains in browser JavaScript.

The dashboard and prompt helper views should copy the Stitch export's structural classes and component shapes directly where behavior allows. Dynamic content may replace hardcoded Stitch sample text/counts, but visual primitives should remain aligned with the export.

## Compatibility Notes

The implementation should avoid breaking existing action behavior:

- Existing backend endpoints remain unchanged.
- Existing user-facing text remains Vietnamese.
- Existing publish, schedule, approve, retry, caption save/copy, prompt copy, Page select, and student photo add flows remain available.
- If a view requires a selected post but none exists, show an empty state and link back to the dashboard/queue.
