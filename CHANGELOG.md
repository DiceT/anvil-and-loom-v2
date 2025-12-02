# Changelog

## Unreleased

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
- **Table Forge:** AI-powered oracle/table generator for solo RPG play
  - Support for Aspect, Domain, and Oracle table types
  - Empty table template generation (6 tables for Aspects/Domains, 1 for Oracles)
  - Sophisticated AI content generation with persona integration
  - Custom tags input (merged with default category tags)
  - Individual table filling or batch generation
  - Save to JSON file (exports to user tables directory)
  - Table viewer modal with Floor/Ceiling/Result columns
  - Macro preservation (ACTION+THEME, DESCRIPTOR+FOCUS, ROLL TWICE, CONNECTION WEB)
  - Comprehensive prompt engineering for quality oracle outputs:
    - Weirdness level detection (Mundane/Mixed/Bizarre)
    - Oracle shape & structure guidance (Action/Theme/Descriptor/Focus)
    - Context-aware content with diversity and quality filtering
- **First Look Feature:** AI-powered place introduction system
  - Generates Atmosphere and Discovery results for new places
  - Leverages active aspects, domains, and weave context
  - Creates formatted thread cards with structured output
- Themed confirmation dialogs using global `useDialogStore` (replaced native browser confirm dialogs)
- "Change Badge" context menu option for panels (right-click to change category)  
- "Rebuild Index" button in Stitchboard for manual index rebuilding
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
  - Right pane mode switchers (Dice/Environments/Oracles/Stitchboard/Weave/Results) in top toolbar
  - Collapse buttons positioned in top-left and top-right of toolbar
  - Table Forge button (Wand icon) added to top-right toolbar
- **Tapestry Tree Toolbar:**
  - New Folder button (FolderTree icon) now creates folders when clicked
  - New Panel button (Plus icon) creates panels when clicked
  - Both icons positioned together in tree header toolbar
- **Dice Tray Access:** Fixed Dice icon in top toolbar to properly open dice tray in right pane
- Thread card styling: AI interpretations use distinct purple theme to differentiate from oracle results
- Renamed "Outgoing" to "Stitches" in Stitchboard
- All confirmation dialogs now use consistent slate-800/900 theme

### Fixed
- Panel tab switching now correctly syncs with editor and Stitchboard
- Wiki link navigation now opens/activates corresponding tabs
- Stitchboard now populates correctly with stitches and backstitches
- Wiki link protocol (`wiki:`) no longer stripped by react-markdown
- Tab system and editor state now stay synchronized
- Panel header titles now update immediately when renamed (no app restart needed)
- New panels now automatically open and focus in the editor
- Persona loading fixed for browser environment using `import.meta.glob`
- First Look oracle combo resolution (Descriptor+Focus) now correctly parses macro results
- Tag search bar position fixed in left pane

### Technical Improvements
- Centralized AI client with OpenAI-compatible API support
- Prompt builder system with universal GM instructions
- Response parser for structured AI outputs
- Table Forge engine with empty table generation and AI filling
- IPC handlers for saving forged tables to user directory
- Comprehensive type definitions for AI settings and personas

## 0.2.0 - 2025-11-28

### Added
- Tapestry system for managing worlds/campaigns as on-disk folders with a registry, metadata, and entry tree.
- Milkdown/Crepe-based editor for Panels (entries) with edit/view modes and auto-save.
- Thread system (Result Cards) for logging dice, oracle, table, and Weave outcomes, with Latest Thread and Thread History views.
- Logging Threads into Panels, embedding them as fenced `result-card` blocks that can be expanded in the viewer.
- Dice tool with expression parsing, rolling, and Thread generation.
- Tables and Oracles engine with macro support (e.g., Action+Theme, Descriptor+Focus) and Thread generation.
- Weave engine and editor for building and rolling combined Aspect/Domain tables, with environment/oracle follow-up actions.
- Right-pane tools layout (Dice, Environments, Oracles, Weave, Results) using `rc-dock`.
- Tapestry tree manager with folders, Panels, move/rename/delete, and context menus.
- Settings system for dice visuals and editor behavior (themes, GFM, history, etc.).

### Changed
- Unified terminology around Threads (results) and Panels (entries) in the UI.
- Result logging pipeline now ensures consistent structure between live Threads and embedded Threads, including shared timestamps.

### Removed
- Legacy 3D dice engine and assets (kept only the 2D dice roller as the active implementation).
