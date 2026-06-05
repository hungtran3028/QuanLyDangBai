## 1. Dashboard UX

- [x] 1.1 Redesign the top-level dashboard into clearer operational groups: blockers, ready, scheduled, published, failed.
- [x] 1.2 Add clearer selected fanpage context and per-post next-action controls.
- [x] 1.3 Add a compact calendar/list view for scheduled posts.
- [x] 1.4 Keep the interface responsive and usable on desktop and mobile.

## 2. Content Guardrails

- [x] 2.1 Add banned-term detection for `nhất`, `duy nhất`, `số một`, and `100%`.
- [x] 2.2 Show exact detected terms in the readiness checklist.
- [x] 2.3 Block approval when banned terms are present unless the operator ignores the check.
- [x] 2.4 Block publishing when banned terms are present unless the operator ignores the check, including scheduled publishing.
- [x] 2.5 Add manual title/caption editing in the post detail view.
- [x] 2.6 Exclude image/media checks from the readiness blocker list.
- [x] 2.7 Add copyable chatbox prompt suggestions with selectable post type and context fields.

## 3. Student Photo Library

- [x] 3.1 Add a file-based student photo library structure under `assets/student-photos/`.
- [x] 3.2 Support subject albums such as `tin-hoc`, `ky-thuat`, `ke-toan`, and `tre-em`.
- [x] 3.3 Add backend APIs to list albums and photos.
- [x] 3.4 Add frontend media picker for selecting photos by album.
- [x] 3.5 Allow any student photo in an album to be added to publishable media sets.

## 4. Media Sets And Multi-Image Posts

- [x] 4.1 Add read-time support for `post.json.media`.
- [x] 4.2 Preserve legacy `image_path` compatibility.
- [x] 4.3 Add UI for ordering/removing media items in a post.
- [x] 4.4 Support single-image publishing through the existing flow.
- [x] 4.5 Support multi-image Facebook publishing for posts with multiple media items.
- [x] 4.6 Record media used in `publish_history`.

## 5. Verification

- [x] 5.1 Validate this OpenSpec change with `openspec validate improve-content-operations-dashboard --strict`.
- [x] 5.2 Run `node --check server/server.js`.
- [x] 5.3 Run `node --check app/script.js`.
- [x] 5.4 Run `npm test`.
- [x] 5.5 Manually verify one legacy single-image post still loads and can pass readiness checks.
- [x] 5.6 Manually verify one draft multi-image post shows media order and blocked-term checks correctly.
