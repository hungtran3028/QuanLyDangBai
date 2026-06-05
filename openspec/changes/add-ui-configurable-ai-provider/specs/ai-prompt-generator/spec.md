## ADDED Requirements

### Requirement: UI-Configurable AI Providers
The system SHALL allow the operator to configure AI provider settings from the app UI and persist them to `.env`.

#### Scenario: Operator saves Gemini key
- **WHEN** the operator selects `Gemini`, enters a Gemini API key, and saves
- **THEN** the backend writes the relevant AI settings to `.env`
- **AND** the UI shows configured status with a masked key
- **AND** the full API key is not returned to the browser after saving.

#### Scenario: Operator saves custom provider
- **WHEN** the operator selects `Custom Provider`, enters base URL, API key, endpoint style, and model
- **THEN** the backend writes those AI settings to `.env`
- **AND** existing unrelated `.env` settings such as Meta/Facebook settings remain unchanged.

#### Scenario: Required fields are missing
- **WHEN** the operator attempts to save an incomplete provider config
- **THEN** the backend rejects the request with the missing fields
- **AND** the UI shows a clear configuration error.

### Requirement: Provider Connectivity And Model Detection
The system SHALL test saved or submitted provider settings before generation.

#### Scenario: Gemini key is tested
- **WHEN** the operator tests a Gemini API key
- **THEN** the backend validates the key against Gemini APIs
- **AND** returns available content-generation models
- **AND** selects a default usable model if none has been selected.

#### Scenario: Custom provider is tested
- **WHEN** the operator tests a custom provider config
- **THEN** the backend verifies the base URL, key, endpoint style, and model can complete a minimal request
- **AND** reports success or a safe error message.

#### Scenario: Model list is refreshed
- **WHEN** the operator refreshes models for a configured provider
- **THEN** the UI updates the model selector with models returned by the backend when model listing is supported.

### Requirement: AI Draft Generation
The system SHALL generate reviewable post drafts from Prompt Generator options and optional selected post context.

#### Scenario: Operator generates a draft for selected post
- **GIVEN** AI provider settings are configured
- **AND** a post is selected
- **WHEN** the operator clicks `Tạo nháp AI`
- **THEN** the backend calls the configured provider using the selected post context and prompt options
- **AND** returns a draft with title, caption, image prompt, and hashtags
- **AND** stores the draft in `post.json.ai_drafts`.

#### Scenario: Operator generates without selected post
- **GIVEN** AI provider settings are configured
- **AND** no post is selected
- **WHEN** the operator clicks `Tạo nháp AI`
- **THEN** the backend returns a draft for preview/copy
- **AND** the UI disables applying the draft to a post.

#### Scenario: Provider output is invalid
- **WHEN** the provider returns content that cannot be parsed into the required draft fields
- **THEN** the UI shows the raw result and an error state
- **AND** applying the draft is blocked until a valid draft is generated.

### Requirement: Draft Application
The system SHALL let the operator explicitly apply a generated draft to a selected post.

#### Scenario: Operator applies a draft
- **GIVEN** a valid draft exists for the selected post
- **WHEN** the operator clicks `Áp dụng vào bài đang chọn`
- **THEN** the backend updates the post title and caption in `post.json`
- **AND** marks the draft with `applied_at`
- **AND** does not approve, schedule, publish, or create media automatically.

#### Scenario: Readiness refreshes after applying draft
- **WHEN** a draft is applied to a post
- **THEN** subsequent post reads and UI refreshes use the updated title/caption
- **AND** readiness checks run against the updated content.

### Requirement: Secret Safety
The system SHALL protect AI API keys from accidental disclosure.

#### Scenario: Config is displayed
- **WHEN** the UI loads AI configuration status
- **THEN** only a masked key or configured boolean is shown
- **AND** the full key is never included in config/status/model/generation responses.

#### Scenario: Provider returns error
- **WHEN** the provider returns an authentication, rate-limit, timeout, or validation error
- **THEN** the backend returns a safe operator-facing message
- **AND** the message does not include the API key.
