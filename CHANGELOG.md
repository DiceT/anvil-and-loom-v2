# Changelog

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
