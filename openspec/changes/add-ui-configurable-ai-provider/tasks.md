## 1. Proposal And Config

- [x] 1.1 Add AI provider environment variables to `.env.example`.
- [x] 1.2 Implement safe `.env` read/update helpers that preserve existing keys and write only AI-related settings.
- [x] 1.3 Ensure config/status APIs never return full API keys.

## 2. Backend AI Provider APIs

- [x] 2.1 Add `GET /api/ai/config`.
- [x] 2.2 Add `POST /api/ai/config`.
- [x] 2.3 Add `POST /api/ai/test`.
- [x] 2.4 Add `GET /api/ai/models`.
- [x] 2.5 Add `POST /api/ai/generate`.
- [x] 2.6 Add `POST /api/posts/:slug/ai-drafts/:draftId/apply`.
- [x] 2.7 Implement Gemini provider adapter.
- [x] 2.8 Implement custom OpenAI-compatible provider adapter.

## 3. Frontend Prompt Generator

- [x] 3.1 Add provider settings panel to the Prompt Generator view.
- [x] 3.2 Support Gemini mode with API key input and detected model dropdown.
- [x] 3.3 Support Custom Provider mode with base URL, API key, endpoint style, and model controls.
- [x] 3.4 Add buttons for save config, test connection, refresh models, generate draft, copy draft, and apply draft.
- [x] 3.5 Render provider errors and generation errors clearly without exposing secrets.

## 4. Draft Workflow

- [x] 4.1 Store generated drafts in `post.json.ai_drafts` when a post is selected.
- [x] 4.2 Allow generation without selected post but disable apply in that state.
- [x] 4.3 Apply draft title/caption only when operator clicks apply.
- [x] 4.4 Re-run readiness checks after applying a draft.

## 5. Verification

- [x] 5.1 Validate this OpenSpec change with `openspec validate add-ui-configurable-ai-provider --strict`.
- [x] 5.2 Run `node --check server/server.js`.
- [x] 5.3 Run `node --check app/script.js`.
- [x] 5.4 Run `npm test`.
- [ ] 5.5 Manually verify Gemini config save, test, model selection, draft generation, and apply flow.
- [ ] 5.6 Manually verify Custom Provider config save, test, draft generation, and apply flow using a mock or known-compatible endpoint.
