# Change: Improve Content Operations Dashboard

## Why

The current app can read saved posts, approve/schedule/publish them, select Facebook Pages, and track publish history. The next operational need is to make daily publishing more reliable and polished: clearer dashboard flow, safer content guardrails, support for student photo assets, and multi-image posting patterns such as carousel-style posts.

## What Changes

- Refine the dashboard into a smarter operations view with clearer readiness, blockers, status groups, selected fanpage, and next actions.
- Add strict content guardrails that block approval and publishing when risky absolute marketing terms are present.
- Add a student photo library organized by subject album, stored separately from generated post output images.
- Extend post metadata from a single image path toward a media set that can represent one image, multiple AI images, student photos, mixed media, carousel-style posts, and album-style posts.
- Add Facebook multi-photo publishing support for posts with more than one selected media item.
- Preserve compatibility with existing `post.json` records that only have `image_path`.

## Impact

- Affected specs: `content-operations`
- Affected code:
  - `server/server.js`
  - `app/index.html`
  - `app/script.js`
  - `app/styles.css`
  - `outputs/bai-viet/<slug>/post.json`
  - future `assets/student-photos/` library
- Data impact:
  - Adds `media` and richer publish-history metadata.
  - Keeps legacy `image_path` support.
- External impact:
  - Uses existing Meta/Facebook Graph API connection.
  - No new OpenAI API integration inside the app.
