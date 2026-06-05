## ADDED Requirements

### Requirement: Stitch-Informed Operations Shell
The system SHALL present Sao Viet Content Studio as a compact internal operations dashboard that matches the Stitch screen `Dashboard Content Studio - Desktop` as closely as practical.

#### Scenario: Operator opens the dashboard on desktop
- **WHEN** the operator opens the app on a desktop viewport
- **THEN** the UI shows a fixed left navigation area with Sao Viet branding
- **AND** the UI shows a top operational bar with Facebook connection/page context and refresh access
- **AND** the main workspace shows summary metrics above a queue/detail split layout
- **AND** the interface uses Vietnamese labels and Sao Viet brand context.
- **AND** the UI uses the Stitch Tailwind color tokens, spacing tokens, typography, Material Symbols, and component proportions.

#### Scenario: Official logo is displayed
- **WHEN** the dashboard renders brand identity
- **THEN** the UI uses `assets/brand/logo-primary.png`
- **AND** it does not use remote generated placeholder logos for the official brand mark.

### Requirement: Operational Summary And Queue
The system SHALL make daily publishing status scannable through summary metrics, filters, and post rows.

#### Scenario: Summary metrics are visible
- **WHEN** posts are loaded
- **THEN** the dashboard shows counts for `Cần xử lý`, `Sẵn sàng đăng`, `Đã hẹn giờ`, and `Đã đăng`
- **AND** selecting a summary metric filters the post queue to the matching operational group.

#### Scenario: Operator filters posts
- **WHEN** the operator selects a status filter such as `Tất cả`, `Cần xử lý`, `Chờ duyệt`, `Đã duyệt`, `Hẹn giờ`, `Đã đăng`, or `Lỗi`
- **THEN** the queue updates without a page reload
- **AND** each visible post row shows title, slug/status context, next action or blocker information, and media count where available.

#### Scenario: Scheduled posts are reviewed
- **WHEN** scheduled posts exist
- **THEN** the dashboard shows a compact upcoming schedule list
- **AND** selecting a scheduled item opens that post in the detail workspace.

### Requirement: Post Detail Workspace
The system SHALL provide a dense detail workspace for reviewing and preparing a selected post.

#### Scenario: Operator selects a post
- **WHEN** the operator selects a post from the queue
- **THEN** the detail workspace shows the post title, status, slug, media set, readiness checklist, student photo album picker, caption editor, prompt helper, schedule controls, publish history, and relevant action buttons.

#### Scenario: No post is selected
- **WHEN** no post is selected
- **THEN** the detail workspace shows a clear empty state explaining that saved posts from `outputs/bai-viet/` will appear in the queue.

#### Scenario: Readiness checks include blockers
- **WHEN** a selected post has failed readiness checks
- **THEN** the checklist visually distinguishes successful checks, ignored checks, and blocking checks
- **AND** blocking checks provide the existing ignore/recheck interaction where supported.

### Requirement: Media And Student Photo Controls
The system SHALL preserve media management workflows while presenting them in a Stitch-like media grid.

#### Scenario: Selected post has media
- **WHEN** a selected post has one or more media items
- **THEN** the UI shows each item with thumbnail, title/type context, order controls, and remove control
- **AND** the first media item is visually understandable as part of the publishable media set.

#### Scenario: Operator adds a student photo
- **WHEN** the operator chooses an album and selects a student photo
- **THEN** the existing student photo add behavior is preserved
- **AND** the updated media set remains visible after the add operation completes.

### Requirement: Prompt Generator Surface
The system SHALL provide a prompt helper surface informed by the Stitch screen `Gợi ý Prompt Kiểu Bài Viết`.

#### Scenario: Operator configures a prompt
- **WHEN** a post is selected
- **THEN** the prompt helper exposes controls for post type, course/topic, audience, goal, length, tone, image type, student photo usage, and extra notes
- **AND** the generated prompt preview updates from the selected options and current post content.

#### Scenario: Operator copies a prompt
- **WHEN** the operator clicks the prompt copy action
- **THEN** the current generated prompt is copied to the clipboard
- **AND** the UI shows feedback using the existing toast pattern.

### Requirement: Caption Editing And Publishing Actions
The system SHALL preserve all existing content editing, scheduling, and publishing actions in the redesigned UI.

#### Scenario: Operator edits content
- **WHEN** the operator edits the title or caption and saves
- **THEN** the app persists the content through the existing backend endpoint
- **AND** the selected post detail refreshes without losing the redesigned layout.

#### Scenario: Operator schedules or publishes
- **WHEN** the operator schedules, approves, publishes, retries, or republishes a post
- **THEN** the existing action endpoints and disabled/hidden button rules continue to apply
- **AND** the action controls remain easy to find in the detail workspace.

### Requirement: Responsive Plain Frontend
The system SHALL implement the redesign with the existing plain frontend stack.

#### Scenario: Frontend assets are delivered
- **WHEN** the dashboard is loaded
- **THEN** it works with plain HTML, CSS, and browser JavaScript in `app/`
- **AND** it may use the Stitch-exported Tailwind CDN and Material Symbols links
- **AND** it does not require React, Vue, Vite, or another frontend build step.

#### Scenario: Operator uses a smaller viewport
- **WHEN** the viewport is tablet or mobile width
- **THEN** the sidebar, summary metrics, queue, detail workspace, prompt controls, and action buttons reflow without overlapping text or controls
- **AND** all existing actions remain accessible.

### Requirement: Separated Frontend Views
The system SHALL separate major content operations functions into distinct frontend views instead of keeping all feature markup directly inside `app/index.html`.

#### Scenario: App shell loads
- **WHEN** the operator opens the app
- **THEN** `app/index.html` provides only the shared app shell such as sidebar navigation, top-level container, shared status/header area, and toast host
- **AND** feature-specific markup is loaded from separate view/template files under `app/views/`.

#### Scenario: Operator navigates between functions
- **WHEN** the operator selects a sidebar destination
- **THEN** the app switches to the matching view without requiring a full frontend framework
- **AND** the active sidebar item reflects the current view.

#### Scenario: Dashboard view is opened
- **WHEN** the operator opens the dashboard/queue view
- **THEN** the view shows the operational summary metrics, status filters, post queue, and upcoming schedule list
- **AND** selecting a post can navigate the operator to the post detail view with that post selected.

#### Scenario: Post detail view is opened
- **WHEN** the operator opens the post detail view for a selected post
- **THEN** the view shows the selected post title/status/slug, media controls, readiness checklist, caption editor, scheduling controls, publish actions, errors, and publish history.

#### Scenario: Prompt helper view is opened
- **WHEN** the operator opens the prompt helper view
- **THEN** the view shows prompt configuration controls and the generated prompt preview
- **AND** it can use the current selected post context when one exists.

#### Scenario: Facebook view is opened
- **WHEN** the operator opens the Facebook Page view
- **THEN** the view shows connection status, available Page selector, and connect action
- **AND** Page selection continues to call the existing backend endpoint.

#### Scenario: Media library view is opened
- **WHEN** the operator opens the media/student-photo view
- **THEN** the view shows the student photo album selector and available photos
- **AND** selecting a photo can add it to the currently selected post when a post is selected.

#### Scenario: Direct view URL is used
- **WHEN** the operator opens a URL with a view hash or route such as dashboard, detail, prompt, facebook, or media
- **THEN** the app opens the corresponding view
- **AND** if a selected post is required but absent, the view presents a clear empty state rather than broken controls.
