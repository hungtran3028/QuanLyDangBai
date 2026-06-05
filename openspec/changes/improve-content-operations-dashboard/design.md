## Context

Content Studio Sao Viet is a local-first content operations app. Chatbox/Codex creates posts and images; the app manages readiness, approval, scheduling, fanpage selection, and Facebook publishing. The current data model is file-based, with one `post.json` per post and final images under `outputs/images/`.

The next roadmap should improve operations without introducing database or multi-user complexity. The app remains a solo-operator internal tool exposed through Tailscale.

## Goals / Non-Goals

Goals:

- Make the UI clearer, more scientific, and more elegant for daily publishing.
- Block risky content terms before approval/publishing.
- Manage real student photos by subject album.
- Support media sets and multiple image posting patterns.
- Keep legacy posts working.

Non-Goals:

- Do not integrate OpenAI API into the app.
- Do not add Zalo/TikTok/website publishing.
- Do not migrate to a database.
- Do not add app user accounts, roles, or login.
- Do not edit/generate new composite images from student photos in this change.

## Decisions

- Decision: Keep file-based JSON metadata.
  - Alternatives considered: SQLite or full database.
  - Rationale: The app is for one operator, 5-20 posts per week, and git/file backup remains valuable.

- Decision: Add `media` as the forward-compatible model while preserving `image_path`.
  - Alternatives considered: replace `image_path` immediately.
  - Rationale: Existing posts must continue to publish without migration risk.

- Decision: Store student photos separately from generated final post images.
  - Alternatives considered: reuse `outputs/images`.
  - Rationale: `outputs/images` is an archive of final post images; student photos are reusable source assets and need album/permission metadata.

- Decision: Treat banned terms as operator-overridable readiness checks.
  - Alternatives considered: hard blocking at approval and publish time.
  - Rationale: The operator wants warnings surfaced clearly but wants final control through an explicit ignore action.

- Decision: Multi-image publishing uses Facebook multi-photo flow.
  - Alternatives considered: upload only the first image or force manual posting.
  - Rationale: The user wants flexible many-image posts and carousel-like operation.

## Data Model Direction

`post.json` should continue to include existing fields and add a media set:

```json
{
  "media": [
    {
      "id": "cover",
      "type": "ai_image",
      "path": "outputs/bai-viet/<slug>/<slug>.png",
      "role": "cover",
      "order": 1
    },
    {
      "id": "student-photo-001",
      "type": "student_photo",
      "path": "assets/student-photos/tin-hoc/example.jpg",
      "album": "tin-hoc",
      "role": "slide",
      "order": 2
    }
  ]
}
```

Legacy fallback:

- If `media` is missing and `image_path` exists, backend treats `image_path` as one `ai_image` cover item.

Student photo library metadata should live near the library, for example:

```text
assets/student-photos/
  albums.json
  tin-hoc/
    photos.json
    *.jpg
```

## Risks / Trade-offs

- Risk: Facebook multi-photo API can create duplicate uploads if retry logic is careless.
  - Mitigation: Keep retry manual and record publish history per media set.

- Risk: Student photos may require consent/privacy review.
  - Mitigation: Keep metadata such as `approved_for_use` available for reference, while allowing the operator to choose any album photo.

- Risk: UI may become cluttered.
  - Mitigation: Use progressive disclosure: dashboard summary first, media/checklist details only in selected post view.

- Risk: Banned-word detection can match innocent substrings.
  - Mitigation: Define normalized phrase matching and show exact matched terms so the operator can revise manually.

## Migration Plan

- Add read-time compatibility from `image_path` to `media`.
- Do not rewrite every existing post immediately.
- New or updated posts may write both `image_path` and `media` during the transition.
- Update `outputs/bai-viet/README.md` after implementation to document `media`.

## Open Questions

- Exact album names can start with `tin-hoc`, `ky-thuat`, `ke-toan`, and `tre-em`, then expand later.
- Consent metadata can remain as optional reference data such as `approved_for_use: true|false`; richer consent details can be a later OpenSpec change.
