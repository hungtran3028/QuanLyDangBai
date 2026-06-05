## ADDED Requirements

### Requirement: Operations Dashboard Readiness

The system SHALL present a clear operations dashboard that separates posts by actionable state and highlights blockers before approval or publishing.

#### Scenario: Operator reviews the dashboard
- **WHEN** the operator opens the app
- **THEN** the app shows post groups for blockers, ready/approved, scheduled, published, and failed states
- **AND** each post exposes its current readiness status and next likely action

#### Scenario: Operator opens a blocked post
- **WHEN** the operator selects a post with failed readiness checks
- **THEN** the detail view lists each blocking check and explains what must be fixed
- **AND** the operator can ignore a failed check so it no longer blocks approval or publishing

### Requirement: Banned Marketing Term Guardrail

The system SHALL detect banned absolute marketing terms in post content or publish metadata and block approval/publishing until the operator fixes or ignores the check.

The banned terms SHALL include:

- `nhất`
- `duy nhất`
- `số một`
- `100%`

#### Scenario: Banned term blocks approval
- **GIVEN** a post caption contains `100%`
- **WHEN** the operator attempts to approve the post
- **THEN** the system rejects the approval
- **AND** the readiness checklist identifies `100%` as a banned term

#### Scenario: Operator ignores a banned term check
- **GIVEN** a post caption contains `100%`
- **WHEN** the operator chooses to ignore the banned-term check
- **THEN** the post can be approved or published without changing the caption

#### Scenario: Banned term blocks publishing
- **GIVEN** a post contains `duy nhất`
- **AND** the post is otherwise ready
- **WHEN** the operator attempts to publish or schedule the post
- **THEN** the system blocks the action
- **AND** the system does not call the Facebook publishing API

### Requirement: Manual Post Editing

The system SHALL allow the operator to manually edit post title and caption in the app detail view.

#### Scenario: Operator edits caption before publishing
- **GIVEN** a post is open in the detail view
- **WHEN** the operator updates the title or caption and saves
- **THEN** the app persists the edited content to `post.json`
- **AND** subsequent readiness checks and publishing use the edited content

### Requirement: Chatbox Prompt Suggestions

The system SHALL provide copyable prompt suggestions that help the operator ask the chatbox to create, revise, or troubleshoot post content using selectable post type and context fields.

#### Scenario: Operator copies a suggested prompt
- **GIVEN** a post is open in the detail view
- **WHEN** the operator selects a post type, course/topic, audience, goal, length, tone, image type, student-photo preference, and optional notes
- **THEN** the app shows a prompt that includes those selections, the current post title, caption context, brand requirements, address, hotline, and save-path guidance
- **AND** the operator can copy that prompt to paste into the chatbox

### Requirement: Student Photo Library Albums

The system SHALL manage real student photos separately from generated post images and organize them by subject album.

#### Scenario: Operator browses student photos
- **GIVEN** student photos exist under subject albums
- **WHEN** the operator opens the media library
- **THEN** the app lists available albums such as `tin-hoc`, `ky-thuat`, `ke-toan`, and `tre-em`
- **AND** the operator can view photos within each album

#### Scenario: Any album photo is available for publishing
- **GIVEN** a student photo exists in an album
- **WHEN** the operator selects media for a post
- **THEN** the app allows the photo to be added to a publishable media set regardless of approval metadata

### Requirement: Post Media Sets

The system SHALL support post media sets containing one or more media items from AI-generated images and student photos.

#### Scenario: Legacy single-image post is normalized
- **GIVEN** a post has `image_path` but no `media` array
- **WHEN** the backend reads the post
- **THEN** it treats `image_path` as a single cover media item
- **AND** existing approval and publishing behavior remains available

#### Scenario: Operator builds a mixed media set
- **GIVEN** a post has an AI-generated cover image
- **WHEN** the operator adds student photos from an album
- **THEN** the post media set contains the AI image and the selected student photos in operator-defined order

#### Scenario: Operator creates a many-image post
- **GIVEN** a post media set contains multiple media items
- **WHEN** the operator views the post detail
- **THEN** the app shows every media item in order
- **AND** the operator can distinguish AI-generated images from student photos

### Requirement: Facebook Multi-Image Publishing

The system SHALL publish posts with multiple media items as a multi-image Facebook post while preserving single-image publishing behavior.

#### Scenario: Single-image post uses existing publishing flow
- **GIVEN** a post has exactly one media item
- **WHEN** the operator publishes it
- **THEN** the system publishes it using the single-photo flow

#### Scenario: Multi-image post publishes all selected media
- **GIVEN** a post has multiple media items
- **WHEN** the operator publishes it
- **THEN** the system uploads all selected media items
- **AND** creates a Facebook post containing those media items

#### Scenario: Publishing history records media used
- **GIVEN** a post is published successfully
- **WHEN** the system updates `post.json`
- **THEN** `publish_history` records the fanpage, Facebook post ID, timestamp, and media items used
