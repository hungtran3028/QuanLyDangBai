## Context

The project is a local-first solo-operator dashboard. Current content generation is done by copying a prompt into chatbox/Codex. The new capability should make AI drafting available inside the app while preserving the existing review and publish workflow.

## Goals

- Configure AI from the UI.
- Support Gemini with only API key input.
- Support a custom provider with UI-entered base URL, key, and model.
- Persist configuration to `.env`.
- Keep secrets server-side after submission.
- Generate reviewable drafts, not automatically published content.

## Non-Goals

- Do not generate images directly in the app.
- Do not add accounts, roles, database, or a secrets vault.
- Do not auto-approve or auto-publish AI output.
- Do not expose full API keys back to the browser after saving.

## Configuration Model

`.env.example` should document:

```env
AI_PROVIDER=gemini
AI_API_KEY=
AI_API_BASE_URL=
AI_MODEL=
AI_ENDPOINT_STYLE=gemini
AI_API_TIMEOUT_MS=30000
```

Rules:

- `AI_PROVIDER=gemini` uses Google Gemini REST APIs.
- `AI_PROVIDER=custom` uses `AI_API_BASE_URL`, `AI_API_KEY`, `AI_MODEL`, and `AI_ENDPOINT_STYLE`.
- `AI_ENDPOINT_STYLE=openai-compatible` means `POST {baseUrl}/chat/completions`.
- `AI_ENDPOINT_STYLE=gemini` means Gemini-style model endpoints.
- The backend writes or updates only AI-related keys in `.env`; it must preserve unrelated environment variables.
- Status responses return masked keys only, such as `...ABCD`.

## UI Placement

The Prompt Generator view should include a compact provider settings panel above or beside the generation form:

- Provider selector: `Gemini` or `Custom Provider`.
- API key input.
- For Gemini:
  - Button: `Kiểm tra key`.
  - Model dropdown auto-filled from detected models.
- For Custom Provider:
  - Base URL input.
  - Endpoint style selector.
  - Model input or dropdown if listing is supported.
  - Button: `Kiểm tra kết nối`.
- Save button writes `.env`.
- Generate button is disabled until provider status is configured.

## Backend Interfaces

- `GET /api/ai/config`
  - Returns provider, masked key, base URL, selected model, endpoint style, configured status, and missing fields.
- `POST /api/ai/config`
  - Saves UI-provided provider config into `.env`.
  - Validates required fields before writing.
- `POST /api/ai/test`
  - Tests current or submitted config without generating a post draft.
  - For Gemini, lists models and returns models that support content generation.
  - For custom OpenAI-compatible providers, performs a minimal chat completion test unless model listing is supported.
- `GET /api/ai/models`
  - Returns model choices for the saved provider when supported.
- `POST /api/ai/generate`
  - Receives prompt options and optional `slug`.
  - Uses selected post context when `slug` is provided.
  - Returns and stores a draft when a valid post is selected.
- `POST /api/posts/:slug/ai-drafts/:draftId/apply`
  - Applies title/caption from a stored draft into `post.json`.

## Draft Data

Each post may store:

```json
{
  "ai_drafts": [
    {
      "id": "ai-20260603-001",
      "created_at": "2026-06-03T00:00:00.000Z",
      "provider": "gemini",
      "model": "gemini-1.5-flash",
      "input_options": {},
      "title": "Draft title",
      "caption": "Draft caption",
      "image_prompt": "Draft image prompt",
      "hashtags": ["#TinHocSaoViet"],
      "raw_text": "...",
      "applied_at": null
    }
  ]
}
```

The app should preserve existing fields and append new drafts. Applying a draft updates `title`, `caption`, `updated_at`, and draft `applied_at`; it does not change status to approved or published.

## Failure Handling

- Missing config: show a UI message and disable generation.
- Invalid key: show provider-specific error without echoing the key.
- Timeout/rate limit: show retryable error.
- Invalid AI JSON: show raw text in the draft panel and block apply until required fields are manually recoverable or generated again.
