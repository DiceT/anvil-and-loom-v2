# Anvil & Loom v2 Scaffolding Plan

## Overview

Scaffold a React + TypeScript + Electron desktop application for TTRPG journaling with a three-lane layout (Tapestry file tree | Workspace tabs | Tools & Results). This is a greenfield project with comprehensive design specifications already defined.

## Technology Stack

**Core Stack:**
- **Build Tool**: Vite 6.x with vite-plugin-electron (faster HMR, simpler config than Webpack)
- **Framework**: React 18.x + TypeScript 5.x
- **Desktop**: Electron 33.x
- **State Management**: Zustand 5.x (lightweight, TypeScript-friendly)
- **Styling**: Tailwind CSS 3.x (utility-first, perfect for icon-focused design)
- **Icons**: lucide-react

**Key Libraries:**
- **Markdown**: react-markdown + remark-gfm + rehype-raw (for Result Card HTML rendering)
- **File Tree**: react-arborist or custom implementation
- **Canvas**: Excalidraw or custom SVG/Canvas rendering (placeholder for v2)
- **3D Dice**: @3d-dice/dice-box (stub for v2, full integration later)
- **IPC**: Electron's contextBridge + ipcMain/ipcRenderer

## File Structure

```
anvil-and-loom-v2/
├── electron/
│   ├── main.ts                    # Main process entry
│   ├── preload.ts                 # contextBridge API
│   └── ipc/
│       ├── fileSystem.ts          # File operations handlers
│       └── storage.ts             # Results persistence
│
├── src/
│   ├── main.tsx                   # React entry
│   ├── App.tsx                    # Root component
│   │
│   ├── core/                      # Core engines & business logic
│   │   ├── dice/
│   │   │   ├── diceEngine.ts      # rollDiceExpression() API
│   │   │   ├── diceParser.ts      # Expression parsing
│   │   │   └── types.ts           # DiceRollResult, DiceOptions
│   │   │
│   │   ├── results/
│   │   │   ├── resultCardEngine.ts # logResultCard() API
│   │   │   ├── types.ts            # ResultCard, ResultSource
│   │   │   └── store.ts            # Results store setup
│   │   │
│   │   ├── tables/
│   │   │   ├── tableProvider.ts    # Table registry/loader
│   │   │   ├── types.ts            # Table, TableRow
│   │   │   └── data/
│   │   │       ├── aspects.json    # Example aspect tables
│   │   │       └── oracles.json    # Example oracle tables
│   │   │
│   │   └── entries/
│   │       ├── entryManager.ts     # Entry CRUD
│   │       ├── types.ts            # Entry types
│   │       └── parser.ts           # Frontmatter/Result Card parsing
│   │
│   ├── components/
│   │   ├── layout/                 # Three-lane structure
│   │   │   ├── AppLayout.tsx       # Main container
│   │   │   ├── TopBar.tsx          # Tapestry name + toggles
│   │   │   ├── LeftLane.tsx        # Tapestry wrapper
│   │   │   ├── CenterLane.tsx      # Workspace wrapper
│   │   │   └── RightLane.tsx       # Tools & Results wrapper
│   │   │
│   │   ├── tapestry/               # Left lane components
│   │   │   ├── TapestryTree.tsx    # Directory tree
│   │   │   └── TreeNode.tsx        # File/folder nodes
│   │   │
│   │   ├── workspace/              # Center lane components
│   │   │   ├── WorkspaceTabs.tsx   # Tab bar
│   │   │   ├── JournalEntry.tsx    # Journal tab
│   │   │   ├── CanvasEntry.tsx     # Canvas tab
│   │   │   ├── MarkdownEditor.tsx  # Edit mode
│   │   │   └── MarkdownViewer.tsx  # View mode w/ Result Cards
│   │   │
│   │   ├── tools/                  # Right lane tools
│   │   │   ├── ToolIconRail.tsx    # Icon rail
│   │   │   ├── ToolPanel.tsx       # Active tool container
│   │   │   ├── dice/
│   │   │   │   └── DiceTool.tsx
│   │   │   ├── environments/
│   │   │   │   └── EnvironmentsTool.tsx
│   │   │   ├── oracles/
│   │   │   │   └── OraclesTool.tsx
│   │   │   ├── ai/
│   │   │   │   └── AITool.tsx
│   │   │   └── registry.ts         # Tool registration
│   │   │
│   │   ├── results/                # Results display
│   │   │   ├── ResultsHistory.tsx  # Scrollable list
│   │   │   ├── ResultCard.tsx      # Individual card
│   │   │   └── GlobalLastResult.tsx # Pinned last result
│   │   │
│   │   └── ui/                     # Reusable UI components
│   │       ├── IconButton.tsx      # s/m/l/xl variants
│   │       ├── Panel.tsx
│   │       └── Card.tsx
│   │
│   ├── stores/                     # Zustand state stores
│   │   ├── useResultsStore.ts      # Results state + persistence
│   │   ├── useWorkspaceStore.ts    # Open tabs, active entry
│   │   ├── useTapestryStore.ts     # File tree state
│   │   └── useToolStore.ts         # Active tool, panel state
│   │
│   ├── types/
│   │   └── electron.d.ts           # window.electron types
│   │
│   └── styles/
│       └── globals.css             # Tailwind + custom styles
│
├── public/
│   └── icon.png
│
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── electron-builder.json
├── tailwind.config.js
├── postcss.config.js
└── .gitignore
```

## Architecture Decisions

### 1. File System Access (Electron IPC)
- **Pattern**: contextBridge exposes sanitized API (`window.electron.*`)
- **Security**: No direct Node.js access from renderer
- **Tapestry Provider**: Clean abstraction layer - v2 uses stubbed in-memory tree, but IPC designed for real FS swap later
- **API Surface**:
  ```ts
  window.electron.tapestry.getTree()          // Returns stubbed tree structure
  window.electron.tapestry.readEntry(path)    // Read .md or .canvas.json
  window.electron.tapestry.writeEntry(path, content)
  window.electron.tapestry.saveResults(cards) // Save to /.anvil-loom/results.json
  window.electron.tapestry.loadResults()      // Load from active Tapestry
  ```

### 2. State Management (Zustand)
Four main stores:
- **useResultsStore**: ResultCard[] + persistence hooks
- **useWorkspaceStore**: Open tabs, active entry, entry content
- **useTapestryStore**: File tree structure, selected node
- **useToolStore**: Active tool ID, panel visibility

**Why Zustand**: Minimal boilerplate, excellent TypeScript support, no Provider nesting

### 3. Component Organization
- **By Domain**: Organized by feature area (layout, tapestry, workspace, tools, results, ui)
- **Tool Pattern**: Each tool is self-contained, registered in `registry.ts`
- **Reusable UI**: IconButton, Panel, Card extracted for consistency

### 4. Plugin Extension Seams
- **Tool Registry**: `registry.ts` exports `ToolConfig[]` - add tools without touching layout
- **Dice Engine API**: Public `rollDiceExpression()` - tools never touch internals
- **ResultCard Engine API**: Public `logResultCard()` - single entry point
- **Table Provider**: `tableProvider.ts` returns `Table[]` - swappable/extendable

## Implementation Specifications

### Canvas Format (.canvas.json)
**Custom minimal schema** for v2:
```ts
interface CanvasData {
  version: string;        // "1.0.0"
  nodes: CanvasNode[];
  edges?: CanvasEdge[];   // Optional for v2
}

interface CanvasNode {
  id: string;
  type: string;           // "text", "card", etc.
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  meta?: Record<string, unknown>;
}

interface CanvasEdge {
  from: string;           // node id
  to: string;             // node id
  label?: string;
}
```
Do NOT adopt Obsidian/Excalidraw formats yet - import/export can be added later.

### Dice Engine Complexity
**Basic RPG expressions only** for v2:
- `XdY` - e.g., `2d6`, `1d20`, `3d8`
- `XdY+modifier` - e.g., `1d20+5`, `2d6-2`
- `XdY+XdZ` - compound rolls, e.g., `1d6+1d8`
- `1d100` - percentile rolls

**NOT in v2**: keep/drop (kh, dl), exploding dice, success pools, challenge dice

Design types to be extensible:
```ts
interface DiceRollResult {
  expression: string;
  total?: number;
  rolls: RollResult[];
  modifier?: number;
  meta?: Record<string, unknown>;  // For future extensions
}
```

### Result Card Persistence Strategy
**Per-Tapestry persistence**:
- Results saved to `/.anvil-loom/results.json` within the active Tapestry root
- When Tapestry loads: hydrate Results store from this file
- On new Result Card: auto-save to this file
- If NO Tapestry open: Results are in-memory only (don't persist)
- Do NOT use Electron userData directory for Results in v2

### Development Priority: "Somewhere in Between"
**Fully Implement:**
- ✅ Dice Engine → working expression parser and roller
- ✅ ResultCard Engine → real logging and persistence
- ✅ Results history + Global Last Result → live updates
- ✅ Journal Entries → real markdown edit/view with icon toggle (Lucide Edit3/Eye)
- ✅ "Log to Entry" → actually embeds Result Cards in Journal markdown

**Stub with Minimal UI:**
- ⚠️ Environments Tool - hardcoded example tables, basic UI
- ⚠️ Oracles Tool - hardcoded example tables, basic UI
- ⚠️ AI Tool - placeholder button, fake output
- ⚠️ Tapestry FS - stubbed in-memory tree with clean provider interface
- ⚠️ Canvas rendering - minimal node display, no editing yet

## Implementation Phases

### Phase 1: Project Initialization
1. Initialize npm project and install dependencies
2. Set up TypeScript configs (tsconfig.json, tsconfig.node.json)
3. Configure Vite for Electron renderer
4. Configure Tailwind CSS + PostCSS
5. Create folder structure
6. Create .gitignore

**Milestone**: Project builds successfully (empty app)

### Phase 2: Electron Setup
7. Create electron/main.ts with BrowserWindow
8. Create electron/preload.ts with contextBridge stubs
9. Configure vite-plugin-electron
10. Set up IPC handlers (fileSystem.ts, storage.ts)
11. Create window.electron type definitions
12. Test app launches with blank window

**Milestone**: Electron app opens successfully

### Phase 3: Core Layout
13. Create AppLayout.tsx (three-lane grid)
14. Create TopBar.tsx (tapestry name)
15. Create LeftLane.tsx (placeholder)
16. Create CenterLane.tsx (placeholder)
17. Create RightLane.tsx (vertical flex layout)
18. Apply Tailwind base styling (dark slate blue theme)
19. Wire App.tsx → AppLayout
20. Test three-lane structure visible

**Milestone**: App displays three-lane layout

### Phase 4: Core Systems
21. Define core types (DiceRollResult, ResultCard, ResultSource)
22. Implement diceEngine.ts with rollDiceExpression():
    - Parse `XdY`, `XdY+mod`, `XdY+XdZ`, `1d100`
    - NO keep/drop, exploding, or pools in v2
    - Design types to be extensible for future
23. Create useResultsStore.ts (Zustand)
24. Implement resultCardEngine.ts (logResultCard)
25. Connect ResultCard engine to Results store
26. Implement Results persistence (IPC to `/.anvil-loom/results.json`)
27. Test programmatic dice rolls and result logging

**Milestone**: Core engines functional with real dice rolling

### Phase 5: UI Components
28. Create IconButton.tsx (s/m/l/xl variants)
29. Implement color + glow states (idle/hover/active/focus)
30. Create ResultCard.tsx (source-based header colors)
31. Create ResultsHistory.tsx (scrollable list)
32. Create GlobalLastResult.tsx (pinned bottom)
33. Wire to useResultsStore
34. Test manual ResultCard addition

**Milestone**: Results display in UI

### Phase 6: Tool Infrastructure
35. Create tool registry (tools/registry.ts)
36. Create ToolIconRail.tsx (renders from registry)
37. Create useToolStore.ts (active tool state)
38. Create ToolPanel.tsx (conditional render)
39. Wire icon clicks to store
40. Test tool panel toggling

**Milestone**: Tool infrastructure working

### Phase 7: Dice Tool (First Complete Tool)
41. Create DiceTool.tsx (expression builder UI)
42. Wire Roll button to diceEngine
43. Convert DiceRollResult to ResultCard format
44. Call resultCardEngine.logResultCard()
45. Test end-to-end: Roll → Result Card in history + Last Result

**Milestone**: First complete tool-to-result flow working

### Phase 8: Tapestry & File Tree
46. Create tapestryProvider abstraction in core/
47. Implement stubbed in-memory tree provider (clean interface for future FS swap)
48. Wire provider through IPC (`window.electron.tapestry.getTree()`)
49. Create TapestryTree.tsx (uses provider data)
50. Create TreeNode.tsx (file/folder rendering)
51. Define useTapestryStore.ts
52. Implement click handlers (open .md/.canvas.json)
53. Wire to useWorkspaceStore (open tab)
54. Test file clicking opens tab

**Milestone**: File tree interactive with clean provider abstraction

### Phase 9: Workspace & Entries
55. Create useWorkspaceStore.ts (tabs, active entry)
56. Create WorkspaceTabs.tsx (tab bar + close)
57. Create JournalEntry.tsx with Edit/View toggle:
    - Use Lucide Edit3 icon for Edit mode
    - Use Lucide Eye icon for View mode
    - Icons follow global icon rules (color/glow states)
58. Create MarkdownEditor.tsx (textarea with basic styling)
59. Create MarkdownViewer.tsx:
    - Use react-markdown + remark-gfm
    - Custom renderer for Result Card HTML blocks
    - Render with source-based header colors
60. Create CanvasEntry.tsx:
    - Minimal display of custom .canvas.json nodes
    - No editing in v2, just render nodes at x/y positions
61. Wire tabs to store
62. Test Journal tab Edit/View toggle + markdown rendering

**Milestone**: Journal entries fully functional with real markdown

### Phase 10: Additional Tools
63. Create EnvironmentsTool.tsx:
    - Minimal UI with hardcoded example tables
    - Browse Aspect/Domain tables
    - Wire to diceEngine + resultCardEngine (basic functionality)
64. Create OraclesTool.tsx:
    - Minimal UI with hardcoded example oracles
    - Action+Theme, Descriptor+Focus
    - Wire to diceEngine + resultCardEngine (basic functionality)
65. Create AITool.tsx (stub only):
    - Placeholder button
    - Fake/canned output
    - Log as Result Card with source="interpretation"
66. Register all tools in registry.ts
67. Test all tool icons appear and panels show

**Milestone**: All tools present, Environments/Oracles minimally functional

### Phase 11: Integration & Polish
68. Implement "Log to Entry" toggle in TopBar:
    - When enabled, logResultCard appends HTML/markdown block to active Journal Entry
    - Result Cards embedded with source-based styling preserved
69. Implement tableProvider.ts in core/tables/:
    - Load hardcoded example Aspect/Domain tables
    - Load hardcoded example Oracle tables (Action+Theme, Descriptor+Focus)
70. Ensure EnvironmentsTool and OraclesTool use tableProvider
71. Test complete flow: Tool → dice roll → Result Card → history + Last Result
72. Test "Log to Entry": Result Cards properly embedded in Journal markdown

**Milestone**: End-to-end functionality complete, all systems integrated

### Phase 12: Persistence & Final Testing
73. Test Results persistence:
    - Verify Results saved to `/.anvil-loom/results.json`
    - Close and reopen app
    - Verify Results history + Last Result restored
74. Implement Journal Entry save via IPC (auto-save on edit)
75. Test Journal Entry persistence across app restarts
76. Polish UI colors and spacing:
    - Dark slate blue theme from design spec
    - Source-based Result Card header colors (dice=steel blue, table=green, oracle=teal, interpretation=purple)
    - Icon button states (idle/hover/active/focus with glow)
77. Test keyboard navigation and accessibility
78. Final smoke test: All phases working together

**Milestone**: v2 scaffold complete and fully demonstrable

## Critical Files for Implementation

- `src/core/dice/diceEngine.ts` - Core dice API
- `src/core/results/resultCardEngine.ts` - Central logging system
- `src/stores/useResultsStore.ts` - Results state management
- `src/components/layout/AppLayout.tsx` - Layout foundation
- `src/components/tools/registry.ts` - Tool registration
- `electron/main.ts` - Electron entry point
- `vite.config.ts` - Build configuration

## Success Criteria

After completing all phases, the v2 scaffold should:

1. ✅ Launch as an Electron desktop app
2. ✅ Display three-lane layout (Tapestry | Workspace | Tools & Results)
3. ✅ Allow opening/editing Journal entries with Edit/View toggle
4. ✅ Show all tool icons in right rail
5. ✅ Support complete Dice tool flow: expression → roll → Result Card
6. ✅ Display Results history and Global Last Result
7. ✅ Support "Log to Entry" to embed Result Cards in Journal
8. ✅ Have stubbed Environments, Oracles, and AI tools
9. ✅ Persist Results across app restarts
10. ✅ Follow icon/color design specifications

The app will have placeholder functionality where needed (3D dice, AI service, real canvas) but the entire architecture and UX flow will be demonstrable and ready for feature expansion.
