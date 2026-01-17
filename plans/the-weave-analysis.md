# The Weave - Integration Analysis for Anvil and Loom v2

**Date**: 2026-01-12  
**Purpose**: Analyze the existing the-weave project to understand how to properly integrate it into anvil-and-loom-v2

---

## Executive Summary

The Weave is a **standalone React/Vite web application** for managing and rolling on random tables. It is **not** an Electron application like Anvil and Loom v2. This is a critical distinction that impacts the integration strategy significantly.

**Key Finding**: The Weave uses in-memory storage with no backend API, while Anvil and Loom v2 uses Electron IPC handlers for file system access. The integration will require adapting the Weave's React components and state management to work within Anvil and Loom's Electron architecture.

---

## 1. Project Structure and Architecture

### 1.1 Project Type
- **Framework**: React 19.2.0 with Vite 7.2.4
- **Build System**: Vite (dev server, build, preview)
- **TypeScript**: Version 5.9.3
- **Platform**: Web application (not Electron)

### 1.2 Directory Structure
```
the-weave/
├── data/                          # Hardcoded table data (JSON files)
│   └── tables/
│       ├── sample_loot.json
│       ├── gemstones.json
│       ├── dungeon_encounters.json
│       ├── guard_room.json
│       └── Oracles/
│           ├── action.json
│           ├── descriptor.json
│           ├── focus.json
│           └── theme.json
├── src/
│   ├── engine/                    # Core table rolling logic
│   │   ├── Table.ts             # Table data model
│   │   ├── TableRow.ts          # Row data model
│   │   ├── RollResult.ts        # Roll result model
│   │   ├── RollOptions.ts       # Roll configuration
│   │   ├── RandomTableEngine.ts  # Rolling logic
│   │   ├── SeededRNG.ts        # Seeded random number generator
│   │   ├── TokenResolver.ts     # [[ TAG ]] token resolution
│   │   ├── types.ts            # Shared types
│   │   └── ai/
│   │       └── AIService.ts     # AI integration
│   ├── data/                     # Data management
│   │   ├── TableRepository.ts   # Table storage (in-memory)
│   │   ├── TableValidator.ts    # Table validation
│   │   ├── TableLinkAnalyzer.ts # Table reference analysis
│   │   └── ManifestManager.ts  # Version tracking
│   ├── ui/                       # UI components
│   │   ├── App.tsx            # Main application layout
│   │   ├── App.css
│   │   ├── components/
│   │   │   ├── FileTree.tsx        # Left sidebar (table navigation)
│   │   │   ├── Workspace.tsx       # Center panel (table editing)
│   │   │   ├── ResultLog.tsx       # Right sidebar (results/AI/links)
│   │   │   ├── TableEditor.tsx     # Spreadsheet-style editor
│   │   │   ├── AIPanel.tsx        # AI generation/review
│   │   │   ├── MacroBar.tsx       # Quick roll macros
│   │   │   ├── MacroSlot.tsx      # Macro slot component
│   │   │   ├── MacroTooltip.tsx    # Macro hover tooltip
│   │   │   ├── CreateTableModal.tsx # New table dialog
│   │   │   ├── ConfirmDialog.tsx   # Confirmation dialogs
│   │   │   ├── ContextMenu.tsx     # Right-click context menus
│   │   │   ├── QuickImportModal.tsx # Bulk row import
│   │   │   ├── SchemaEditor.tsx    # Object schema editor
│   │   │   ├── TableLinkView.tsx   # Table reference visualization
│   │   │   └── ResultLogTab.tsx   # Roll history tab
│   │   ├── hooks/
│   │   │   └── useTableService.ts # Service initialization hook
│   │   ├── store/
│   │   │   └── appStore.ts       # Zustand global state
│   │   └── utils/
│   │       ├── MarkdownExporter.ts # Export to markdown
│   │       └── SmartNumbering.ts  # Auto-numbering logic
│   ├── main.tsx                  # React entry point
│   └── App.tsx                   # Default Vite app (unused)
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 2. Key Components and Their Purposes

### 2.1 UI Components

#### FileTree (Left Sidebar)
**File**: [`src/ui/components/FileTree.tsx`](../the-weave/src/ui/components/FileTree.tsx:1)

**Purpose**: Navigate and manage tables with folder/category organization

**Key Features**:
- Category-based table grouping (derived from table.category field)
- Search/filter functionality
- Drag-and-drop table reordering between categories
- Drag-and-drop to macro slots
- Quick roll button (🎲) on each table
- Context menu (right-click) for:
  - Export table (JSON/Markdown)
  - Duplicate table
  - Move to category
  - Delete table
- Preset table creation buttons (d66, d88, 2d6, 2d8)
- Import/Export functionality
- Validation badges (⚠️ for not rollable, ⚡ for warnings)
- Table tooltips showing description on hover

**Integration Note**: This component needs to be adapted to show in Anvil and Loom's right panel when the Weave icon is clicked in the toolbar.

#### Workspace (Center Panel)
**File**: [`src/ui/components/Workspace.tsx`](../the-weave/src/ui/components/Workspace.tsx:1)

**Purpose**: View and edit selected tables with tabbed interface

**Key Features**:
- Tabbed interface for multiple open tables
- Table metadata display (name, tags, row count, die type)
- Edit/Save mode toggle
- Roll button with dice icon
- Validation warnings display (collapsible)
- Table description display
- Table grid view (read-only mode)

**Integration Note**: This component should be integrated into Anvil and Loom's main window area as a new tab type ('weave' or 'table').

#### TableEditor
**File**: [`src/ui/components/TableEditor.tsx`](../the-weave/src/ui/components/TableEditor.tsx:1)

**Purpose**: Spreadsheet-style editor for table rows

**Key Features**:
- Drag-and-drop row reordering
- Row fields:
  - Roll range (floor-ceiling)
  - Weight (for smart numbering)
  - Result (text/table reference/object)
  - Result type selector (text/table/object)
- Add/Delete rows
- Auto-numbering by weight
- Table settings panel:
  - Name
  - Description
  - Max roll (die type selector)
  - Tags (comma-separated)
  - Auto-number button
- Object schema editor
- Quick import (bulk row import)
- Export to Markdown

**Integration Note**: This is the core editing component that needs to be integrated into Anvil and Loom's tab system.

#### ResultLog (Right Sidebar)
**File**: [`src/ui/components/ResultLog.tsx`](../the-weave/src/ui/components/ResultLog.tsx:1)

**Purpose**: Display roll history, AI tools, and table link analysis

**Key Features**:
- Tabbed interface:
  - AI Tool: Generate/review tables with AI
  - Result Log: Roll history (last 100 entries)
  - Table Links: Visualize table references
- Compact/Detailed view toggle
- Clear log button
- Auto-scroll to bottom

**Integration Note**: The Result Log functionality should be integrated into Anvil and Loom's existing Result Card system, not as a separate panel.

#### MacroBar
**File**: [`src/ui/components/MacroBar.tsx`](../the-weave/src/ui/components/MacroBar.tsx:1)

**Purpose**: Quick roll multiple tables at once

**Key Features**:
- 4 macro slots
- Drag-and-drop tables to slots (max 4 per slot)
- Hover tooltip shows tables in slot
- Roll all tables in slot (results combined with "+")
- Clear macro slot

**Integration Note**: This feature could be integrated as a toolbar component or as part of the Weave panel.

### 2.2 Core Engine Components

#### RandomTableService
**File**: [`src/engine/RandomTableService.ts`](../the-weave/src/engine/RandomTableService.ts:1)

**Purpose**: Main orchestration layer for table operations

**Key Methods**:
- `roll(tableIdOrTag, options)`: Roll on a table with token resolution
- `rollMultiple(tableIds)`: Roll multiple tables without callbacks
- `saveTable(table)`: Save table to repository
- `deleteTable(id)`: Delete table from repository
- `getAllTables()`: Get all tables
- `getTableById(id)`: Get table by ID
- `getTableByTag(tag)`: Get table by tag
- `validate(table)`: Validate table data
- `onRoll(callback)`: Register roll event callback
- `onResolveToken(callback)`: Register token resolution callback
- `onError(callback)`: Register error callback

**Integration Note**: This service needs to be adapted to use Electron IPC handlers instead of in-memory storage.

#### RandomTableEngine
**File**: [`src/engine/RandomTableEngine.ts`](../the-weave/src/engine/RandomTableEngine.ts:1)

**Purpose**: Core rolling logic for random tables

**Key Features**:
- Seeded RNG for deterministic results
- Row matching against floor/ceiling ranges
- Gap handling (no match)
- Duplicate match resolution (random selection)
- Support for:
  - Standard dice (d6, d8, d10, d12, d20, d100)
  - d66 (two d6 combined as tens and ones)
  - d88 (two d8 combined as tens and ones)
  - 2dX (2d6, 2d8, 2d10, 2d12, 2d20)

**Integration Note**: This engine can be used directly as-is, but needs to integrate with Anvil and Loom's dice engine.

#### TokenResolver
**File**: [`src/engine/TokenResolver.ts`](../the-weave/src/engine/TokenResolver.ts:1)

**Purpose**: Handle recursive resolution of [[ TAG ]] tokens

**Key Features**:
- Token syntax: `[[ TAG_NAME ]]`
- Max recursion depth: 10
- Cycle detection
- Fallback: `[UNRESOLVED:TAG]`
- Resolves tokens in both text and object results
- Tracks table chain and roll values

**Integration Note**: This is a critical component for table references and should be integrated into Anvil and Loom's Thread Card engine.

#### AIService
**File**: [`src/engine/ai/AIService.ts`](../the-weave/src/engine/ai/AIService.ts:1)

**Purpose**: Vendor-agnostic AI integration for table review and generation

**Key Features**:
- Configuration: baseUrl, model, apiKey, systemPrompt
- Writing styles: neutral, dramatic, whimsical, gritty, custom
- Methods:
  - `reviewTable()`: Review table for tone, consistency, duplicates
  - `generateTable()`: Generate new table with specified row count
  - `fillTable()`: Add entries to existing table
- Simple numbered list output for better LLM compatibility
- Standard OpenAI-compatible API format

**Integration Note**: This should use Anvil and Loom's AI settings (API Key, Endpoint, Model, Prompt) instead of its own configuration.

---

## 3. Data Models and File Formats

### 3.1 Table Model
**File**: [`src/engine/Table.ts`](../the-weave/src/engine/Table.ts:1)

```typescript
interface Table {
    id: string;                    // UUIDv4
    schemaVersion: number;          // Current: 1
    sourcePath: string;            // Filesystem path
    tableType?: string;            // Optional semantic grouping
    category?: string;             // UI-only category
    name: string;                  // Display name
    tags: string[];                // For table reference resolution
    description: string;           // Used by AI
    maxRoll: number;              // Numeric domain (e.g., 100, 66, 88)
    headers: string[];             // Default: ["ROLL", "RESULT"]
    tableData: TableRow[];         // The actual rows
    schema?: TableSchema;          // Optional object schema
}
```

### 3.2 TableRow Model
**File**: [`src/engine/TableRow.ts`](../the-weave/src/engine/TableRow.ts:1)

```typescript
interface TableRow {
    floor: number;                 // Lower bound (inclusive)
    ceiling: number;               // Upper bound (inclusive)
    weight?: number;               // Editor-facing hint
    resultType: 'text' | 'table' | 'object';
    result: string | TableReference | ObjectResult;
}

interface TableReference {
    tag: string;                  // References another table by tag
}

type ObjectResult = Record<string, unknown>;
```

### 3.3 RollResult Model
**File**: [`src/engine/RollResult.ts`](../the-weave/src/engine/RollResult.ts:1)

```typescript
interface RollResult {
    seed: string;                 // RNG seed for reproducibility
    tableChain: string[];         // Chain of table names traversed
    rolls: number[];              // Numeric roll values
    warnings: string[];           // Any warnings generated
    result: string | ObjectResult; // Final resolved result
}
```

### 3.4 File Format

Tables are stored as JSON files with the following structure:

```json
{
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "schemaVersion": 1,
    "sourcePath": "data/tables/sample_loot.json",
    "tableType": "loot",
    "category": "Treasure",
    "name": "Sample Loot Table",
    "tags": ["loot", "treasure"],
    "description": "A sample loot table for testing.",
    "maxRoll": 100,
    "headers": ["ROLL", "RESULT"],
    "tableData": [
        {
            "floor": 1,
            "ceiling": 10,
            "weight": 10,
            "resultType": "text",
            "result": "A handful of copper coins (2d6 cp)"
        },
        {
            "floor": 61,
            "ceiling": 75,
            "weight": 15,
            "resultType": "text",
            "result": "A [[ gemstone ]] worth 50 gold pieces"
        }
    ]
}
```

**Integration Note**: This file format is compatible with Anvil and Loom's existing table system. Tables should be stored in the Tapestry's `.weave` folder.

---

## 4. State Management Approach

### 4.1 Zustand Store
**File**: [`src/ui/store/appStore.ts`](../the-weave/src/ui/store/appStore.ts:1)

The Weave uses Zustand for global state management with localStorage persistence.

**State Structure**:
```typescript
interface AppState {
    // Tables
    tables: Table[];
    selectedTableId: string | null;
    
    // Tabs
    openTabs: string[];
    activeTabId: string | null;
    
    // Roll Log
    rollLog: RollLogEntry[];
    
    // Macros
    macros: MacroSlot[];
    
    // UI State
    isLoading: boolean;
    error: string | null;
    
    // Actions
    setTables, addTable, updateTable, deleteTable, selectTable;
    openTab, closeTab, switchTab;
    addRollLogEntry, clearRollLog;
    addTableToMacro, removeTableFromMacro, clearMacro, removeTableFromAllMacros;
    setLoading, setError;
}
```

**Persistence**:
- Roll log: localStorage key `'rollLog'` (last 100 entries)
- Macros: localStorage key `'macros'` (4 slots)

**Integration Note**: Anvil and Loom should create a new Zustand store specifically for Weave functionality, or extend existing stores to include Weave state. The Weave state should be independent from Tapestry state.

---

## 5. Dependencies and Libraries

### 5.1 Core Dependencies
```json
{
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "zustand": "^5.0.9",
    "zod": "^4.3.5",
    "seedrandom": "^3.0.5",
    "uuid": "^13.0.0"
}
```

### 5.2 UI Dependencies
```json
{
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2"
}
```

### 5.3 Development Dependencies
```json
{
    "vite": "^7.2.4",
    "@vitejs/plugin-react": "^5.1.1",
    "typescript": "~5.9.3",
    "eslint": "^9.39.1",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.4.24"
}
```

**Integration Note**: All dependencies are compatible with Anvil and Loom v2, which uses React 19 and similar libraries. The @dnd-kit library is already used in Anvil and Loom for drag-and-drop functionality.

---

## 6. Integration Challenges and Solutions

### 6.1 Architecture Differences

**Challenge**: The Weave is a web app with in-memory storage, while Anvil and Loom is an Electron app with file system access via IPC.

**Solution**:
- Adapt `TableRepository` to use Electron IPC handlers instead of in-memory storage
- Create new IPC handlers in Anvil and Loom for Weave operations:
  - `weave:getTableFolders()`: Get table folders
  - `weave:getTable(folderPath, id)`: Get table by ID
  - `weave:saveTable(folderPath, table)`: Save table
  - `weave:deleteTable(folderPath, id)`: Delete table
  - `weave:createTableFolder(folderPath)`: Create folder
  - `weave:deleteTableFolder(folderPath)`: Delete folder
- Store Weave data in Tapestry's `.weave` folder (not displayed in Tapestry folder view)

### 6.2 State Management Integration

**Challenge**: The Weave uses its own Zustand store with localStorage persistence.

**Solution**:
- Create a new store: `src/stores/useWeaveStore.ts` (or use existing `useWeaveUIStore.ts`)
- Keep Weave state independent from Tapestry state
- Remove localStorage persistence (use file system instead)
- Integrate with Anvil and Loom's existing tab system:
  - Add 'weave' tab type to `useTabStore`
  - Weave tables open as tabs in the main window

### 6.3 UI Component Adaptation

**Challenge**: The Weave has a three-pane layout (FileTree, Workspace, ResultLog), while Anvil and Loom has a different layout.

**Solution**:
- Add a Weave button/icon to the upper right horizontal toolbar in [`TopToolbar.tsx`](src/components/layout/TopToolbar.tsx:1)
- When clicked, show the Weave UI in the right panel (replicating the Weave's left pane)
- Use the main window for table editing with tabs (as per requirement)
- Result Log functionality should integrate with Anvil and Loom's existing Result Card system

### 6.4 AI Integration

**Challenge**: The Weave has its own AI configuration (API Key, Endpoint, Model, Prompt).

**Solution**:
- Remove Weave's AI configuration UI
- Use Anvil and Loom's AI settings from [`electron/ipc/settings.ts`](electron/ipc/settings.ts:1)
- Adapt `AIService` to read from Anvil and Loom's settings store
- Ensure AI prompts are compatible with Anvil and Loom's persona system

### 6.5 Table Rolling Integration

**Challenge**: The Weave's roll results need to be sent to the Thread Card engine.

**Solution**:
- When a table is rolled in Weave, create a Thread Card with:
  - Header: Table name
  - Content: Roll value (e.g., "47/100")
  - Result: The rolled result
  - Color: Use a Weave-specific color (define in [`theme.ts`](src/constants/theme.ts:1))
- Integrate with [`src/core/results/threadEngine.ts`](src/core/results/threadEngine.ts:1) to log Weave results
- Ensure token resolution ([[ TAG ]]) works with Thread Cards

### 6.6 File System Organization

**Challenge**: Weave folders and tables need to be in their own folder inside the Tapestry folder, but not displayed in the Tapestry folder view.

**Solution**:
- Store Weave data in: `<tapestryPath>/.weave/`
- Update [`electron/main.ts`](electron/main.ts:1) to skip `.weave` folder when listing Tapestry entries:
  ```typescript
  if (dirent.name === ".loom" || dirent.name === ".weave") continue;
  ```
- Table folders: `<tapestryPath>/.weave/tables/<category>/`
- Table files: `<tapestryPath>/.weave/tables/<category>/<tableId>.json`

### 6.7 Drag-and-Drop Integration

**Challenge**: The Weave uses @dnd-kit for drag-and-drop, which needs to work within Anvil and Loom's layout.

**Solution**:
- @dnd-kit is already used in Anvil and Loom, so no new dependencies needed
- Ensure drag-and-drop contexts don't conflict between Tapestry and Weave panes
- Test drag-and-drop between Weave FileTree and MacroBar

---

## 7. Integration Strategy

### 7.1 Phase 1: Core Engine Integration
1. Copy Weave engine files to Anvil and Loom:
   - `src/core/weave/` (new directory)
   - Include: `Table.ts`, `TableRow.ts`, `RollResult.ts`, `RandomTableEngine.ts`, `TokenResolver.ts`, `SeededRNG.ts`
2. Adapt `RandomTableService` to use Electron IPC:
   - Create `src/core/weave/WeaveService.ts`
   - Replace in-memory storage with IPC calls
3. Create IPC handlers in `electron/ipc/weaves.ts`:
   - Table CRUD operations
   - Folder management
   - Roll operations

### 7.2 Phase 2: UI Component Integration
1. Create Weave-specific UI components:
   - `src/components/weave/WeavePanel.tsx` (FileTree adaptation)
   - `src/components/weave/WeaveTableEditor.tsx` (TableEditor adaptation)
   - `src/components/weave/MacroBar.tsx` (copy/adapt)
2. Integrate with Anvil and Loom's layout:
   - Add Weave button to [`TopToolbar.tsx`](src/components/layout/TopToolbar.tsx:1)
   - Show WeavePanel in right pane when button is active
   - Open Weave tables as tabs in main window
3. Adapt ResultLog functionality:
   - Integrate with existing Result Card system
   - Add Weave-specific result formatting

### 7.3 Phase 3: State Management Integration
1. Create or extend Weave store:
   - `src/stores/useWeaveStore.ts` (or use existing)
   - Remove localStorage persistence
   - Use file system via IPC
2. Integrate with tab system:
   - Add 'weave' tab type to `useTabStore`
   - Handle Weave tab opening/closing

### 7.4 Phase 4: AI Integration
1. Adapt `AIService`:
   - Remove configuration UI
   - Read from Anvil and Loom's settings
   - Ensure compatibility with persona system
2. Integrate AI features:
   - Table generation
   - Table review
   - Fill existing tables

### 7.5 Phase 5: Testing and Refinement
1. Test all Weave functionality:
   - Table creation/editing/deletion
   - Rolling with token resolution
   - Macro functionality
   - AI generation/review
2. Test integration points:
   - Thread Card creation from Weave rolls
   - File system operations
   - Tab management
3. Refine UI/UX based on testing

---

## 8. Reusable Code vs. Adaptation Needed

### 8.1 Can Be Used Directly
- **Engine Components**:
  - `RandomTableEngine` - Core rolling logic
  - `TokenResolver` - Token resolution
  - `SeededRNG` - Seeded random number generator
  - `TableValidator` - Table validation
  - `SmartNumbering` - Auto-numbering logic
- **Data Models**:
  - `Table`, `TableRow`, `RollResult` interfaces
  - Table file format (JSON schema)
- **Utilities**:
  - `MarkdownExporter` - Export functionality

### 8.2 Needs Adaptation
- **Service Layer**:
  - `RandomTableService` - Replace in-memory storage with IPC
  - `TableRepository` - Replace with file system operations
  - `AIService` - Use Anvil and Loom's AI settings
- **UI Components**:
  - `FileTree` - Adapt to show in right pane
  - `Workspace` - Integrate with tab system
  - `ResultLog` - Integrate with Result Card system
  - `MacroBar` - Ensure no conflicts with existing drag-and-drop
- **State Management**:
  - `appStore` - Create new Weave-specific store
  - Remove localStorage persistence

### 8.3 Not Needed
- **Entry Points**:
  - `main.tsx` - Anvil and Loom has its own entry point
  - `App.tsx` - Default Vite app (unused in Weave)
- **Build Configuration**:
  - `vite.config.ts` - Anvil and Loom uses electron-vite
  - `index.html` - Anvil and Loom has its own

---

## 9. Framework Compatibility

### 9.1 React Version
- **Weave**: React 19.2.0
- **Anvil and Loom**: React 19.x
- **Compatibility**: ✅ Fully compatible

### 9.2 TypeScript
- **Weave**: TypeScript 5.9.3
- **Anvil and Loom**: TypeScript 5.x
- **Compatibility**: ✅ Fully compatible

### 9.3 State Management
- **Weave**: Zustand 5.0.9
- **Anvil and Loom**: Zustand 5.x
- **Compatibility**: ✅ Fully compatible

### 9.4 Drag-and-Drop
- **Weave**: @dnd-kit 6.3.1
- **Anvil and Loom**: @dnd-kit (version to verify)
- **Compatibility**: ✅ Likely compatible (same library)

### 9.5 Styling
- **Weave**: Custom CSS with CSS variables
- **Anvil and Loom**: Tailwind CSS
- **Compatibility**: ⚠️ Needs adaptation - convert custom CSS to Tailwind classes or keep as separate CSS module

---

## 10. Potential Issues and Mitigations

### 10.1 File System Access
**Issue**: The Weave uses in-memory storage, while Anvil and Loom uses file system.

**Mitigation**:
- Create IPC handlers for all file operations
- Ensure proper error handling for file system failures
- Test on Windows, macOS, and Linux

### 10.2 State Conflicts
**Issue**: Weave state might conflict with Tapestry state.

**Mitigation**:
- Keep Weave state in separate store
- Use clear naming conventions (e.g., `weaveTables` vs `tapestryEntries`)
- Ensure no cross-store dependencies

### 10.3 Drag-and-Drop Conflicts
**Issue**: @dnd-kit contexts might conflict between Tapestry and Weave panes.

**Mitigation**:
- Use separate `DndContext` providers
- Test drag-and-drop between panes
- Consider disabling drag-and-drop in one pane when the other is active

### 10.4 AI Settings
**Issue**: Weave's AI configuration might conflict with Anvil and Loom's settings.

**Mitigation**:
- Remove Weave's AI configuration UI entirely
- Use Anvil and Loom's settings store directly
- Ensure AI prompts are compatible with persona system

### 10.5 Thread Card Integration
**Issue**: Weave roll results need to be formatted as Thread Cards.

**Mitigation**:
- Define Weave-specific color in theme
- Ensure Thread Card engine handles Weave results
- Test token resolution with Thread Cards

---

## 11. Recommendations

### 11.1 Architecture
1. **Keep Weave functionality modular**: Store Weave code in its own directory (`src/core/weave/`, `src/components/weave/`)
2. **Use existing patterns**: Follow Anvil and Loom's IPC handler patterns, store patterns, and UI patterns
3. **Maintain separation**: Keep Weave state separate from Tapestry state to avoid conflicts

### 11.2 UI/UX
1. **Replicate Weave's left pane in Anvil and Loom's right pane**: This is the user's explicit requirement
2. **Use tabs for table editing**: As per requirement, use the main window with tabs for editing tables
3. **Integrate with existing Result Card system**: Don't create a separate Result Log panel
4. **Add Weave-specific color**: Define a color for Weave table roll results in the theme

### 11.3 Data Storage
1. **Store in `.weave` folder**: Keep Weave data separate from Tapestry data
2. **Don't display in Tapestry folder view**: Skip `.weave` folder when listing Tapestry entries
3. **Use file system instead of localStorage**: Persist data to disk, not browser storage

### 11.4 AI Integration
1. **Use Anvil and Loom's AI settings**: Don't duplicate configuration
2. **Ensure persona compatibility**: AI prompts should work with Anvil and Loom's persona system
3. **Test vendor-agnostic API**: Ensure AI service works with different providers

### 11.5 Testing
1. **Test all Weave features**: Table CRUD, rolling, macros, AI generation/review
2. **Test integration points**: Thread Cards, file system, tab management
3. **Test on multiple platforms**: Windows, macOS, Linux
4. **User acceptance testing**: Get feedback from users familiar with The Weave

---

## 12. Conclusion

The Weave is a well-architected React application with clean separation of concerns between engine, data, and UI layers. The core engine components (rolling, token resolution, validation) can be reused directly with minimal adaptation. The main integration challenges are:

1. **Architecture**: Adapting from web app with in-memory storage to Electron app with file system access
2. **UI Layout**: Integrating three-pane layout into Anvil and Loom's existing layout
3. **State Management**: Creating separate Weave store and integrating with tab system
4. **AI Integration**: Using Anvil and Loom's AI settings instead of Weave's own configuration
5. **File System**: Storing Weave data in `.weave` folder without displaying in Tapestry view

With careful planning and phased integration, the Weave can be successfully integrated into Anvil and Loom v2 while maintaining its core functionality and user experience.

---

## Appendix A: File Reference Summary

### Core Engine Files
- [`src/engine/Table.ts`](../the-weave/src/engine/Table.ts:1) - Table data model
- [`src/engine/TableRow.ts`](../the-weave/src/engine/TableRow.ts:1) - Row data model
- [`src/engine/RollResult.ts`](../the-weave/src/engine/RollResult.ts:1) - Roll result model
- [`src/engine/RollOptions.ts`](../the-weave/src/engine/RollOptions.ts:1) - Roll configuration
- [`src/engine/RandomTableEngine.ts`](../the-weave/src/engine/RandomTableEngine.ts:1) - Rolling logic
- [`src/engine/SeededRNG.ts`](../the-weave/src/engine/SeededRNG.ts:1) - Seeded RNG
- [`src/engine/TokenResolver.ts`](../the-weave/src/engine/TokenResolver.ts:1) - Token resolution
- [`src/engine/ai/AIService.ts`](../the-weave/src/engine/ai/AIService.ts:1) - AI integration

### Data Management Files
- [`src/data/TableRepository.ts`](../the-weave/src/data/TableRepository.ts:1) - Table storage
- [`src/data/TableValidator.ts`](../the-weave/src/data/TableValidator.ts:1) - Table validation
- [`src/data/TableLinkAnalyzer.ts`](../the-weave/src/data/TableLinkAnalyzer.ts:1) - Table reference analysis
- [`src/data/ManifestManager.ts`](../the-weave/src/data/ManifestManager.ts:1) - Version tracking

### UI Component Files
- [`src/ui/App.tsx`](../the-weave/src/ui/App.tsx:1) - Main application layout
- [`src/ui/components/FileTree.tsx`](../the-weave/src/ui/components/FileTree.tsx:1) - Left sidebar
- [`src/ui/components/Workspace.tsx`](../the-weave/src/ui/components/Workspace.tsx:1) - Center panel
- [`src/ui/components/ResultLog.tsx`](../the-weave/src/ui/components/ResultLog.tsx:1) - Right sidebar
- [`src/ui/components/TableEditor.tsx`](../the-weave/src/ui/components/TableEditor.tsx:1) - Table editor
- [`src/ui/components/AIPanel.tsx`](../the-weave/src/ui/components/AIPanel.tsx:1) - AI panel
- [`src/ui/components/MacroBar.tsx`](../the-weave/src/ui/components/MacroBar.tsx:1) - Macro bar
- [`src/ui/store/appStore.ts`](../the-weave/src/ui/store/appStore.ts:1) - Zustand store
- [`src/ui/hooks/useTableService.ts`](../the-weave/src/ui/hooks/useTableService.ts:1) - Service initialization

### Sample Data Files
- [`data/tables/sample_loot.json`](../the-weave/data/tables/sample_loot.json:1) - Sample loot table
- [`data/tables/Oracles/action.json`](../the-weave/data/tables/Oracles/action.json:1) - Action oracle table

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-12
