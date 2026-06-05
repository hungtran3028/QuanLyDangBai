# Project Context

## Purpose

Content Studio Sao Viet is a local-first content operations workspace for Trung Tam Tin Hoc Sao Viet Bien Hoa.

The project helps the center:

- Produce Facebook/Zalo-ready post content and matching AI-generated images.
- Store every post as a durable content artifact under `outputs/bai-viet/<slug>/`.
- Manage approval, scheduling, fanpage selection, publishing history, and Facebook Page posting from a lightweight dashboard.
- Keep brand, contact information, address, and image-generation workflow consistent across all content.

The current operating model is:

- Chatbox/Codex creates written content, image prompts, AI-generated images, and saved artifacts.
- The app reads saved artifacts, validates readiness, lets the operator approve/schedule/publish, and posts to Facebook Pages.
- Future planning and feature proposals must be captured as OpenSpec changes before implementation.

## Tech Stack

- Runtime: Node.js.
- Backend: Express in `server/server.js`.
- Frontend: plain HTML, CSS, and browser JavaScript in `app/`.
- Storage: file-based JSON and Markdown, not a database.
- Content artifacts:
  - `outputs/bai-viet/<slug>/bai-viet.md`
  - `outputs/bai-viet/<slug>/post.json`
  - `outputs/bai-viet/<slug>/<slug>.png`
  - `outputs/images/<slug>.png`
- Brand assets: `assets/brand/`.
- Runtime exposure: Tailscale Serve proxies the local app to `https://hungtran.tail07d810.ts.net`.
- External publishing: Meta/Facebook Graph API.
- Spec workflow: OpenSpec under `openspec/`.

## Project Conventions

### Code Style

- Use CommonJS JavaScript for the backend, matching `server/server.js`.
- Use plain browser JavaScript for the frontend; avoid adding frontend frameworks unless an approved OpenSpec change requires it.
- Keep code readable and direct. Prefer small helper functions over broad abstractions.
- Use Vietnamese user-facing text in the app.
- Use ASCII for code and config where practical; Vietnamese content files may contain Vietnamese text and emoji when needed for posts.
- Keep secrets out of source control. `.env` must remain untracked; `.env.example` documents required variables.
- Do not expose Facebook Page tokens, app secrets, or `.data/` contents to the frontend or git.

### Architecture Patterns

- The backend is the source of truth for:
  - scanning `outputs/bai-viet/`
  - normalizing `post.json`
  - validating publish readiness
  - storing Facebook connection state in `.data/`
  - calling Meta Graph API
- The frontend is an operations dashboard only; it should call backend APIs rather than reading files directly.
- Content remains file-based:
  - Markdown stores human-readable post content and prompts.
  - `post.json` stores operational metadata such as status, schedule, media, publish history, and errors.
- Preserve compatibility with older posts. If a legacy post only has `image_path`, treat it as the main cover image.
- Do not add a database unless a future OpenSpec proposal explicitly approves the migration.
- Facebook runtime must use Tailscale, not localhost, for OAuth callbacks:
  - `APP_BASE_URL=https://hungtran.tail07d810.ts.net`
  - callback: `https://hungtran.tail07d810.ts.net/api/facebook/callback`

### Testing Strategy

- Before finishing code changes, run:
  - `node --check server/server.js`
  - `node --check app/script.js`
  - `npm test`
- For OpenSpec changes, run `openspec validate <change-id> --strict` before presenting the proposal as ready.
- For publishing features, test with API/status checks before any real publish action where possible.
- Guardrails that must be manually or automatically verified:
  - post has `bai-viet.md`
  - post has `post.json`
  - image exists in the post folder
  - final image exists in `outputs/images/`
  - caption includes hotline `093 11 44 858`
  - caption or metadata includes address `91 Đoàn Văn Cự, Tam Hiệp, Thành phố Đồng Nai`
  - caption is cleaned of Markdown before publishing
  - blocked marketing terms are detected before approval/publishing when that feature is implemented

### Git Workflow

- Main branch: `main`.
- Remote: `origin` on GitHub.
- Commit focused, working increments with concise imperative messages.
- Never commit `.env`, `.data/`, access tokens, local generated caches, or secrets.
- Avoid committing unrelated workspace artifacts unless explicitly requested.
- OpenSpec proposals should be committed before their implementation when they introduce new capabilities or architecture changes.

### OpenSpec Workflow

- Use OpenSpec for planning and feature changes.
- When the user asks to plan a new capability, create or update a change under `openspec/changes/<change-id>/`.
- Use verb-led, kebab-case change IDs, such as `add-student-photo-library`.
- Each change should include:
  - `proposal.md`
  - `tasks.md`
  - `design.md` when the change crosses multiple modules, changes data shape, or introduces notable risk
  - delta specs under `openspec/changes/<change-id>/specs/<capability>/spec.md`
- Use `#### Scenario:` headings in specs and validate with `openspec validate <change-id> --strict`.
- Do not implement proposed changes until the proposal is approved, unless the user explicitly asks for direct implementation after approval.

## Domain Context

The brand is Trung Tam Tin Hoc Sao Viet Bien Hoa.

Official information:

- Name: `Trung Tâm Tin Học Sao Việt Biên Hòa`
- Address: `91 Đoàn Văn Cự, Tam Hiệp, Thành phố Đồng Nai`
- Hotline: `093 11 44 858`
- Slogan: `Chuyên nghiệp - Tận tâm - Học thành nghề`
- Region: Bien Hoa, Dong Nai and nearby areas.

Core course groups:

- Tin hoc van phong: Word, Excel, PowerPoint, computer basics.
- Excel basic to advanced.
- MOS, IC3, and Vietnamese IT certificates.
- AutoCAD, SketchUp, SolidWorks.
- Photoshop, Illustrator, CorelDRAW, Canva, CapCut.
- Ke toan tong hop.
- AI applied to office work.
- Python, Scratch, VBA Excel.

Content voice:

- Friendly, clear, practical, and easy to understand.
- Emphasize hands-on practice and real work/study benefits.
- Use lively but purposeful emoji/icons for Facebook/Zalo posts.
- Avoid exaggerated or absolute claims.

Post creation workflow:

- Always read and follow `docs/content-production-workflow.md` before creating post content, image prompts, AI-generated images, or saved artifacts.
- When the user asks for a post, create both the written post and matching AI-generated image.
- Use `assets/brand/logo-primary.png` as the official logo reference for generated images.
- Every generated post image must include the official address and hotline.
- Save each post under `outputs/bai-viet/<slug>/`.
- Copy the final image into `outputs/images/<slug>.png`.

## Important Constraints

- Images for post content must be AI-generated, not built with code, canvas, SVG, HTML/CSS, or Pillow.
- The official logo must not be redrawn, recolored, distorted, or replaced with a fake logo in generated images.
- Every post image must visibly include:
  - `91 Đoàn Văn Cự, Tam Hiệp, Thành phố Đồng Nai`
  - `093 11 44 858`
- Avoid watermark, QR code, cluttered layout, tiny text, incorrect phone/address, and misleading offers.
- Do not invent discounts, guarantees, or extra brand claims unless the user explicitly provides them.
- Blocked/exaggerated terms for future guardrails include:
  - `nhất`
  - `duy nhất`
  - `số một`
  - `100%`
- The app is intended for a solo internal operator for now. Do not add user accounts, roles, or database complexity without an approved OpenSpec proposal.
- Facebook OAuth and app access should use Tailscale, not localhost, in normal operation.
- Student photos, when introduced, should be managed separately from generated post images and organized by subject album.

## External Dependencies

- Meta/Facebook Graph API:
  - OAuth login
  - Page access tokens
  - Page selection
  - photo/multi-photo publishing
  - publishing history tracking
- Tailscale Serve:
  - exposes local port `3000` at `https://hungtran.tail07d810.ts.net`
  - required for stable Facebook OAuth callbacks
- OpenSpec:
  - governs planning and feature proposals in `openspec/`
- AI image generation:
  - performed from chatbox/Codex workflow, not from the app in the current architecture
  - generated project images must be copied from tool output into the repo paths required by the content workflow
