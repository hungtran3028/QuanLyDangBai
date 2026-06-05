# Change: Redesign dashboard from Stitch screens

## Why

The current dashboard is functional but visually plain and harder to scan during daily publishing work. The Stitch screens provide a clearer operations-first direction for Sao Viet Content Studio: fixed navigation, compact metrics, post queue, detail workspace, media controls, checklist, action footer, and a dedicated prompt generator surface.

## What Changes

- Rebuild the existing plain HTML/CSS dashboard to match the Stitch exported UI as closely as possible while preserving the current backend APIs and publishing behavior.
- Split the current all-in-one `index.html` into an app shell plus separate frontend views/templates for dashboard queue, post detail, prompt helper, Facebook Page, and media/student-photo workflows.
- Use the downloaded Stitch references:
  - `stitch-downloads/dashboard-content-studio-desktop.html`
  - `stitch-downloads/dashboard-content-studio-desktop.png`
  - `stitch-downloads/goi-y-prompt-kieu-bai-viet.html`
  - `stitch-downloads/goi-y-prompt-kieu-bai-viet.png`
- Introduce a compact fixed sidebar, top status bar, summary metrics, queue/detail split workspace, media grid, readiness checklist, action footer, caption editor, and prompt generator layout.
- Keep Vietnamese user-facing text, Sao Viet brand context, Tailscale runtime assumptions, and existing file-based content operations.
- Use the Stitch-exported Tailwind CDN configuration, Material Symbols, Inter font, color tokens, spacing tokens, and component structure as the visual source of truth.
- Avoid adding a frontend framework, build step, or database.

## Impact

- Affected specs: `content-operations-ui`
- Affected code:
  - `app/index.html`
  - `app/styles.css`
  - `app/script.js` only where required to support styling or preserved interactions
  - `server/server.js` only for serving official brand assets
- No data model changes are required.
- No backend API changes are expected.
