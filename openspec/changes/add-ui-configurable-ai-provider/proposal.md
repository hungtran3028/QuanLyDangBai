# Change: Add UI-configurable AI providers for Prompt Generator

## Why

The Prompt Generator currently builds a local copyable prompt, but the operator wants the app to generate usable draft content directly. The AI setup must be configurable from the app UI, support both Gemini and a custom provider, and persist the configuration into `.env` so it survives restarts.

## What Changes

- Add AI provider settings to the Prompt Generator or Settings view.
- Support provider modes:
  - `Gemini`: operator can enter only an API key; the system validates it, detects available models, and selects a usable default.
  - `Custom Provider`: operator can enter API base URL, API key, model, and optional endpoint style for OpenAI-compatible providers.
- Persist AI settings into `.env`; never commit `.env`.
- Add backend APIs to read masked AI config, save AI config, test provider connectivity, list models when supported, generate draft post content, and apply a selected draft to a post.
- Keep generation operator-reviewed: generated drafts do not auto-approve, schedule, publish, or create images.

## Impact

- Affected specs: `ai-prompt-generator`
- Affected code:
  - `server/server.js`
  - `.env.example`
  - `app/views/prompt-helper.html`
  - `app/views/facebook.html` or a future settings view if AI settings are placed there
  - `app/script.js`
- Data impact:
  - Adds `ai_drafts` metadata to `post.json`.
  - Writes AI provider config into `.env`.
- External impact:
  - Calls Gemini API or the configured custom provider from the backend only.
