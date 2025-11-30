# Changelog

## Unreleased

### Changed
- **Layout Refactoring:** Transitioned from docking system (rc-dock) to Obsidian-style pane system
  - Left and right panes now collapsible with collapse buttons in top toolbar
  - Resizable panes with drag handles for customizable layout
  - Vertical sidebars on left and right with focused toolbar sections
- **Toolbar Reorganization:**
  - Left pane mode switchers (Tapestry/Tags/Bookmarks) now in top horizontal toolbar
  - Right pane mode switchers (Dice/Environments/Oracles/Stitchboard/Weave/Results) in top toolbar
  - Collapse buttons positioned in top-left and top-right of toolbar
- **Tapestry Tree Toolbar:**
  - New Folder button (FolderTree icon) now creates folders when clicked
  - New Panel button (Plus icon) creates panels when clicked
  - Both icons positioned together in tree header toolbar
- **Dice Tray Access:** Fixed Dice icon in top toolbar to properly open dice tray in right pane

### Added
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

### Fixed
- Panel tab switching now correctly syncs with editor and Stitchboard
- Wiki link navigation now opens/activates corresponding tabs
- Stitchboard now populates correctly with stitches and backstitches
- Wiki link protocol (`wiki:`) no longer stripped by react-markdown
- Tab system and editor state now stay synchronized
- Panel header titles now update immediately when renamed (no app restart needed)
- New panels now automatically open and focus in the editor

### Changed
- Renamed "Outgoing" to "Stitches" in Stitchboard
- All confirmation dialogs now use consistent slate-800/900 theme

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
