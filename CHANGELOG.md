# Changelog

## Unreleased

### Removed - **BREAKING CHANGE: Legacy System Removal (2026-01-12)**
- **Table System Removal:**
  - Removed all Aspects, Domains, Oracles, and The Weave systems
  - Removed Table Forge feature (AI-powered oracle/table generator)
  - Removed all table-related UI components, stores, and IPC handlers
  - Removed core data directories (tables, weaves)
  - Removed table-related dependencies and integrations
- **Map System Removal:**
  - Removed canvas-based map editor
  - Removed map-related UI components and stores
  - Removed map data management
  - Removed map-related dependencies (konva, pixi.js, plough-map-engine, react-konva)
- **Cleaned Up Integration Points:**
  - Updated all references to removed features throughout the codebase
  - Fixed compilation errors from removals
  - Updated UI to reflect current feature set
- **Data Preservation:**
  - All removed data backed up to `_BACKUP/2026-01-12_11-56-15/` directory
  - Backup includes tables (aspects, domains, oracles), weaves, and map data
  - Rollback procedures available in `_DEVELOPMENT/rollback-plan.md`

### Breaking Changes
- **Table/Oracle System:** All table and oracle functionality has been removed. Users who relied on Aspects, Domains, Oracles, or The Weave will need to adapt their workflows.
- **Map System:** The canvas-based map editor has been removed. Users who used maps will need to use external tools or wait for future map implementations.
- **Data Migration:** No automatic migration is provided. Users can access their old data in the `_BACKUP/` directory if needed.
- **Rollback:** A rollback procedure is available in `_DEVELOPMENT/rollback-plan.md` for users who need to restore the previous version.

### Migration Notes
- All legacy data has been preserved in `_BACKUP/2026-01-12_11-56-15/` directory
- See `_DEVELOPMENT/migration-guide.md` for detailed migration information
- Rollback instructions available in `_DEVELOPMENT/rollback-plan.md`
- Current features remain fully functional: Dice Rolling, Tapestry Management, Thread System, AI Integration, Session Management, Tag System, Bookmark System, Markdown Editor

### Added
- **Raw Milkdown Editor Migration:** Replaced `@milkdown/crepe` with raw Milkdown for greater control over plugins and custom nodes.
- **Source Mode:** Added "Source Mode" (Code icon) to the editor toolbar for viewing and editing raw Markdown/JSON.
- **Inline Thread Cards:** Implemented custom ProseMirror node and React NodeView for rendering Thread Cards directly within the editor.
- **Gap Cursor & Trailing Paragraph:** Improved editor usability by allowing cursor placement between cards and ensuring a trailing paragraph for typing after the last card.
- **First Look Persistence Fix:** Fixed an issue where deleting a panel didn't clear it from editor memory, preventing "First Look" from running on a recreated panel.

### Changed
- **Editor Padding:** Standardized padding (`p-8`) across Edit, View, and Source modes for visual consistency.
- **Thread Card Styling:** Updated Edit Mode cards to use `PanelThreadCard` component, ensuring pixel-perfect match with View Mode.
- **Source Mode Logic:** Updated `TapestryEditor` to use `MilkdownEditor` for Source Mode, enabling raw code editing.

### Fixed
- **Duplicate Editors:** Fixed a race condition in `MilkdownEditor` that caused duplicate editor instances when switching modes or opening panels.
- **Runtime Errors:** Fixed `prose is not a function` error by correctly registering `gapCursor` plugin.
- **Missing Icons:** Fixed missing `ArrowDownToLine` import in `GlobalLastThread`.


## 0.3.0 - 2025-11-30

### Added
- **AI Integration System:** Full AI-powered interpretation and content generation
  - AI Settings panel with OpenAI-compatible API configuration
  - GM Persona system with 7 default personas (customizable names and instructions)
  - Active persona selection with per-persona instruction overrides
  - AI client service with centralized error handling and response parsing
  - "Interpret with AI" button on thread cards for contextual interpretations
  - AI interpretations displayed as separate purple-themed thread cards
- Themed confirmation dialogs using global `useDialogStore` (replaced native browser confirm dialogs)
- "Change Badge" context menu option for panels (right-click to change category)
- Support for escaped wiki link brackets (`\[\[...\]\]`) in stitch parser
- **Tagging System:** Comprehensive tag management for panels
  - Tags stored in frontmatter with add/remove UI in panel headers
  - Inline `#hashtag` detection and styling in markdown content
  - Click-to-filter: Click any tag to filter tree to matching panels
  - Tag indexing for fast lookups (`useTagStore`)
  - Filter indicator with clear button in tree header
- **Panel Title Improvements:**
  - Auto-open newly created panels in editor
  - Real-time header title updates on panel rename
  - Removed redundant H1 title from new panel content

### Changed
- **Layout Refactoring:** Transitioned from docking system (rc-dock) to Obsidian-style pane system
  - Left and right panes now collapsible with collapse buttons in top toolbar
  - Resizable panes with drag handles for customizable layout
  - Vertical sidebars on left and right with focused toolbar sections
- **Toolbar Reorganization:**
  - Left pane mode switchers (Tapestry/Tags/Bookmarks) now in top horizontal toolbar
  - Right pane mode switchers (Dice/Results) in top toolbar
  - Collapse buttons positioned in top-left and top-right of toolbar
- **Tapestry Tree Toolbar:**
  - New Folder button (FolderTree icon) now creates folders when clicked
  - New Panel button (Plus icon) creates panels when clicked
  - Both icons positioned together in tree header toolbar
- **Dice Tray Access:** Fixed Dice icon in top toolbar to properly open dice tray in right pane
- Thread card styling: AI interpretations use distinct purple theme
- Renamed "Outgoing" to "Stitches"
- All confirmation dialogs now use consistent slate-800/900 theme

### Fixed
- Panel tab switching now correctly syncs with editor
- Wiki link navigation now opens/activates corresponding tabs
- Wiki link protocol (`wiki:`) no longer stripped by react-markdown
- Tab system and editor state now stay synchronized
- Panel header titles now update immediately when renamed (no app restart needed)
- New panels now automatically open and focus in the editor
- Persona loading fixed for browser environment using `import.meta.glob`
- Tag search bar position fixed in left pane

### Technical Improvements
- Centralized AI client with OpenAI-compatible API support
- Prompt builder system with universal GM instructions
- Response parser for structured AI outputs
- Comprehensive type definitions for AI settings and personas

## 0.2.0 - 2025-11-28

### Added
- Tapestry system for managing worlds/campaigns as on-disk folders with a registry, metadata, and entry tree.
- Milkdown/Crepe-based editor for Panels (entries) with edit/view modes and auto-save.
- Thread system (Result Cards) for logging dice and outcomes, with Latest Thread and Thread History views.
- Logging Threads into Panels, embedding them as fenced `result-card` blocks that can be expanded in the viewer.
- Dice tool with expression parsing, rolling, and Thread generation.
- Right-pane tools layout (Dice, Results) using `rc-dock`.
- Tapestry tree manager with folders, Panels, move/rename/delete, and context menus.
- Settings system for dice visuals and editor behavior (themes, GFM, history, etc.).

### Changed
- Unified terminology around Threads (results) and Panels (entries) in the UI.
- Result logging pipeline now ensures consistent structure between live Threads and embedded Threads, including shared timestamps.

### Removed
- Legacy 3D dice engine and assets (kept only the 2D dice roller as the active implementation).
