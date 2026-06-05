<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# Project Instructions

This project is a content production workspace for Trung Tâm Tin Học Sao Việt Biên Hòa.

## Required Workflow

Before creating any post content, image prompt, AI-generated image, or saved content artifact, read and follow:

`docs/content-production-workflow.md`

This workflow is mandatory for all content-building conversations and tasks in this repository.

## Key Rules

- Always create both the written post and the matching image when the user asks for a post.
- Images must be generated with AI, not built with code.
- Always use `assets/brand/logo-primary.png` as the official Sao Việt logo reference for generated images.
- Every generated post image must include the address: `91 Đoàn Văn Cự, Tam Hiệp, Thành phố Đồng Nai`.
- Save each post under `outputs/bai-viet/<slug>/`.
- Name the image after the post slug, for example `<slug>.png`.
- Also copy the final image into `outputs/images/<slug>.png`; this folder is the image collection archive.
- Facebook/Zalo posts should use lively, purposeful icons/emoji while staying professional.

## App Runtime Rule

- Always use Tailscale for the running app and Facebook OAuth callback.
- Keep `APP_BASE_URL` set to `https://hungtran.tail07d810.ts.net`.
- When starting or troubleshooting the app, ensure Tailscale Serve is active with `tailscale serve --bg --yes 3000` so the Tailscale URL proxies to local port `3000`.
- Use `https://hungtran.tail07d810.ts.net/api/facebook/callback` as the Meta OAuth redirect URI, not a localhost callback.

If any instruction here conflicts with the detailed workflow, follow `docs/content-production-workflow.md`.
