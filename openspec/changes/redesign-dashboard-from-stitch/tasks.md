## 1. Implementation

- [x] 1.1 Audit the current `app/index.html` IDs used by `app/script.js` and preserve every required interactive hook.
- [x] 1.2 Rebuild the dashboard shell to follow the Stitch desktop screen: fixed sidebar, top bar, metric cards, queue column, detail column, and sticky action area.
- [x] 1.3 Restyle post rows, status filters, schedule list, Facebook Page connection, media grid, checklist, history, and toast states.
- [x] 1.4 Rebuild the prompt helper section to follow the Stitch prompt-generator screen while keeping the existing prompt option IDs and copy behavior.
- [x] 1.5 Ensure the official brand logo asset `assets/brand/logo-primary.png` is used in the sidebar instead of generated or remote placeholder logos.
- [x] 1.6 Keep the UI responsive for desktop, tablet, and mobile without adding Tailwind, Material Symbols, or a frontend build step.
- [x] 1.7 Refactor `app/index.html` into an app shell only, with feature markup moved into separate files under `app/views/`.
- [x] 1.8 Add plain browser JavaScript view routing so sidebar navigation switches between views without requiring a frontend framework.
- [x] 1.9 Split or reorganize frontend JavaScript into small view-aware modules/helpers while preserving existing backend API behavior.
- [x] 1.10 Ensure direct URL/hash navigation opens the intended view and keeps selected post state understandable.
- [x] 1.11 Replace the previous inspired CSS treatment with Stitch-exported Tailwind CDN tokens, Material Symbols, and structural classes for high-fidelity matching.

## 2. Verification

- [x] 2.1 Run `node --check app/script.js`.
- [x] 2.2 Run `node --check server/server.js`.
- [x] 2.3 Run `npm test`.
- [ ] 2.4 Start the app with the project runtime flow and ensure Tailscale Serve proxies local port `3000`.
- [ ] 2.5 Manually verify post listing, status filtering, selected post detail, caption save/copy, prompt copy, media ordering/removal, student photo add, schedule save, Facebook Page selection, and publish action buttons still work.
- [x] 2.6 Compare the resulting dashboard against both Stitch screenshots for layout intent, spacing, density, and visual hierarchy.
- [x] 2.7 Manually verify each separated view loads independently through the app shell: dashboard, post detail, prompt helper, Facebook Page, and media/student photos.

Notes:

- Tailscale Serve verification is pending because `tailscale serve --bg --yes 3000` returned `Access denied` and requested sudo/operator setup.
- The redesigned app was verified on `PORT=3001` with HTTP checks and Chromium screenshots for the Stitch dashboard and prompt views.
