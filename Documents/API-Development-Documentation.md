# Anvil and Loom - API & Development Documentation

**Version:** 0.1.0  
**Description:** A story-first TTRPG engine for journaling, dice, and oracles  
**Generated:** 2025-11-25

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Build System](#build-system)
4. [Electron Main Process](#electron-main-process)
5. [IPC Communication](#ipc-communication)
6. [Core Engines](#core-engines)
7. [State Management](#state-management)
8. [Component APIs](#component-apis)
9. [Type Definitions](#type-definitions)
10. [Dependencies](#dependencies)

---

## Project Overview

Anvil and Loom is an Electron-based desktop application built with:
- **Frontend:** React 19.2.0 + TypeScript
- **State Management:** Zustand 5.0.8
- **Styling:** TailwindCSS 3.4.18
- **Build Tools:** Vite 7.2.4 + electron-vite 4.0.1
- **Desktop:** Electron 39.2.3

The application provides tools for tabletop RPG players to manage their campaigns, including dice rolling, Weaves (custom random tables), oracles, and result tracking.

---

## Architecture

```
anvil-and-loom-v2/
├── electron/                  # Electron main process
│   ├── main.ts               # Application entry point
│   ├── preload.ts            # Context bridge for IPC
│   └── ipc/                  # IPC handlers
│       ├── fileSystem.ts     # File system operations
│       ├── storage.ts        # Results storage
│       ├── tables.ts         # Table loading
│       └── weaves.ts         # Weave CRUD operations
├── src/                      # React application
│   ├── components/           # React components
│   ├── core/                 # Business logic engines
│   │   ├── dice/             # Dice rolling engine
│   │   ├── tables/           # Table system
│   │   ├── weave/            # Weave system
│   │   └── results/          # Result cards
│   ├── stores/               # Zustand state stores
│   └── types/                # TypeScript definitions
├── out/                      # Build output (electron-vite)
│   ├── main/                 # Main process (CJS)
│   ├── preload/              # Preload scripts (CJS)
│   └── renderer/             # Renderer (bundled React)
├── electron.vite.config.ts   # electron-vite configuration
└── Documents/                # Documentation folder
```

---

## Build System

Anvil and Loom uses **electron-vite** for building the application, which properly handles the dual-environment architecture of Electron (Node.js main process + Chromium renderer).

### electron.vite.config.ts

**Location:** `/electron.vite.config.ts`

Defines separate build configurations for:
- **Main process** → CommonJS output (`out/main/main.cjs`)
- **Preload scripts** → CommonJS output (`out/preload/preload.cjs`)  
- **Renderer** → Bundled React app (`out/renderer/`)

**Configuration:**
```typescript
export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: 'electron/main.ts',
        formats: ['cjs']
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: 'electron/preload.ts',
        formats: ['cjs']
      }
    }
  },
  renderer: {
    root: '.',
    build: {
      rollupOptions: {
        input: resolve(__dirname, 'index.html')
      }
    },
    plugins: [react()]
  }
});
```

**Key Points:**
- `externalizeDepsPlugin()` prevents bundling of `electron` and Node.js built-ins
- `formats: ['cjs']` ensures CommonJS output for main/preload (required by Electron)
- Renderer uses standard Vite React bundling

### Build Scripts

**Development:**
```bash
pnpm dev
```
Starts electron-vite dev server with hot reload.

**Production Build:**
```bash
pnpm run build
```
Builds all processes and packages with electron-builder.

**Preview:**
```bash
pnpm preview
```
Runs built application without packaging.

---

## Electron Main Process

### `main.ts`

**Location:** `/electron/main.ts`

The main entry point for the Electron application.

#### Functions

##### `createWindow()`

Creates the main browser window.

**Signature:**
```typescript
function createWindow(): void
```

**Details:**
- Window dimensions: 1400x900
- Enables context isolation
- Disables node integration for security
- Loads from Vite dev server in development
- Opens DevTools in development mode

#### Lifecycle Hooks

- **`app.whenReady()`**: Initializes IPC handlers and creates window
- **`app.on('activate')`**: Recreates window on macOS when activated
- **`app.on('window-all-closed')`**: Quits app on Windows/Linux when all windows closed

---

## IPC Communication

### Preload Script

**Location:** `/electron/preload.ts`

Exposes safe IPC methods to the renderer process via `window.electron`.

#### Exposed API: `window.electron.tapestry`

All methods return Promises.

##### `getTree()`

Retrieves the Tapestry file tree structure.

**Signature:**
```typescript
getTree(): Promise<unknown>
```

**Returns:** Promise resolving to the file tree object.

---

##### `readEntry(path: string)`

Reads content from a Tapestry entry.

**Signature:**
```typescript
readEntry(path: string): Promise<string>
```

**Parameters:**
- `path` (string): The path to the entry to read

**Returns:** Promise resolving to the entry content as a string.

---

##### `writeEntry(path: string, content: string)`

Writes content to a Tapestry entry.

**Signature:**
```typescript
writeEntry(path: string, content: string): Promise<{ success: boolean }>
```

**Parameters:**
- `path` (string): The path to the entry to write
- `content` (string): The content to write

**Returns:** Promise resolving to success status.

---

##### `saveResults(cards: unknown[])`

Persists result cards to storage.

**Signature:**
```typescript
saveResults(cards: unknown[]): Promise<{ success: boolean }>
```

**Parameters:**
- `cards` (unknown[]): Array of result card objects

**Returns:** Promise resolving to success status.

---

##### `loadResults()`

Loads saved result cards from storage.

**Signature:**
```typescript
loadResults(): Promise<unknown[]>
```

**Returns:** Promise resolving to array of result cards.

---

### IPC Handlers

#### File System Handler

**Location:** `/electron/ipc/fileSystem.ts`

##### `setupFileSystemHandlers()`

Registers IPC handlers for file system operations.

**Signature:**
```typescript
export function setupFileSystemHandlers(): void
```

**Registered Handlers:**

1. **`tapestry:getTree`** - Returns stubbed Tapestry tree
2. **`tapestry:readEntry`** - Returns content for given path
3. **`tapestry:writeEntry`** - Saves content to given path

**Current Implementation:** Uses in-memory stubbed data. Will be replaced with real file system operations.

**Stubbed Data Structure:**
```typescript
{
  name: 'My Campaign',
  children: [
    { name: 'session-01.md', type: 'file', path: '/session-01.md' },
    { name: 'notes', type: 'folder', path: '/notes', children: [...] }
  ]
}
```

---

#### Storage Handler

**Location:** `/electron/ipc/storage.ts`

##### `setupStorageHandlers()`

Registers IPC handlers for result storage operations.

**Signature:**
```typescript
export function setupStorageHandlers(): void
```

**Registered Handlers:**

1. **`tapestry:saveResults`** - Saves result cards to cache
2. **`tapestry:loadResults`** - Retrieves saved result cards

**Current Implementation:** Uses in-memory cache. TODO: Implement file-based persistence to `/.anvil-loom/results.json`.

---

#### Table Handler

**Location:** `/electron/ipc/tables.ts`

##### `setupTableHandlers()`

Registers IPC handlers for table operations.

**Signature:**
```typescript
export function setupTableHandlers(): void
```

**Registered Handlers:**

1. **`tables:loadAll`** - Loads all tables from core and user directories.
2. **`tables:getUserDir`** - Returns the user tables directory path.

---

#### Weave Handler

**Location:** `/electron/ipc/weaves.ts`

##### `setupWeaveHandlers()`

Registers IPC handlers for Weave CRUD operations.

**Signature:**
```typescript
export function setupWeaveHandlers(): void
```

**Registered Handlers:**

1. **`weaves:loadAll`** - Loads all Weaves from core and user directories (user Weaves override core).
2. **`weaves:save`** - Saves a Weave to the user directory as JSON.
3. **`weaves:delete`** - Deletes a Weave from the user directory.

**Directory Structure:**
- **Core Weaves:** `app/core-data/weaves/`
- **User Weaves:** `{userData}/AnvilAndLoom/assets/weaves/`

---

## Core Engines

### Dice Engine

**Location:** `/src/core/dice/diceEngine.ts`

Handles dice rolling logic and calculations.

#### Functions

##### `rollDiceExpression(expression: string, options?: DiceOptions)`

Rolls dice based on a string expression and returns detailed results.

**Signature:**
```typescript
async function rollDiceExpression(
  expression: string,
  options?: DiceOptions
): Promise<DiceRollResult>
```

**Parameters:**
- `expression` (string): Dice expression (e.g., "2d6+3", "1d20", "3d8-2")
- `options` (DiceOptions, optional): Additional options with metadata

**Returns:** Promise resolving to `DiceRollResult` object containing:
- `expression`: Original expression
- `total`: Final calculated total
- `rolls`: Array of individual roll results
- `modifier`: Applied modifier (if any)
- `meta`: Optional metadata

**Example:**
```typescript
const result = await rollDiceExpression("2d6+3");
// result.total = 12
// result.rolls = [{ value: 4, sides: 6 }, { value: 5, sides: 6 }]
// result.modifier = 3
```

---

##### `rollDie(sides: number)` (Internal)

Rolls a single die with specified number of sides.

**Signature:**
```typescript
function rollDie(sides: number): number
```

**Parameters:**
- `sides` (number): Number of sides on the die

**Returns:** Random number between 1 and sides (inclusive).

---

### Dice Parser

**Location:** `/src/core/dice/diceParser.ts`

Parses dice notation strings into structured data.

#### Functions

##### `parseDiceExpression(expression: string)`

Parses a dice expression string into dice groups and modifiers.

**Signature:**
```typescript
export function parseDiceExpression(expression: string): ParsedExpression
```

**Parameters:**
- `expression` (string): The dice expression to parse

**Returns:** `ParsedExpression` object with:
- `dice`: Array of `ParsedDice` objects (count and sides)
- `modifier`: Numeric modifier to add/subtract

**Supported Patterns:**
- Dice notation: `XdY` where X is count and Y is sides (e.g., "2d6", "1d20")
- Implicit count: `dY` defaults to 1dY (e.g., "d20" becomes "1d20")
- Keep modifiers: `XdYkh` (keep highest), `XdYkl` (keep lowest)
- Keep count: `XdYkhN` (keep highest N), `XdYklN` (keep lowest N)
- Modifiers: `+N` or `-N` at the end (e.g., "+3", "-2")
- Multiple dice groups: "2d6+1d8+3"
- Trailing operators stripped automatically

**Keep Modifier Examples:**
- `2d20kh` - Roll 2d20, keep the highest (advantage)
- `2d20kl` - Roll 2d20, keep the lowest (disadvantage)
- `4d6kh3` - Roll 4d6, keep the highest 3 dice
- `6d8kl2` - Roll 6d8, keep the lowest 2 dice

**Example:**
```typescript
const parsed = parseDiceExpression("4d6kh3+2");
// {
//   dice: [
//     { count: 4, sides: 6, keepModifier: 'kh', keepCount: 3 }
//   ],
//   modifier: 2
// }
```

---

### Result Card Engine

**Location:** `/src/core/results/resultCardEngine.ts`

Manages creation and persistence of result cards.

#### Functions

##### `logResultCard(input: LogResultCardInput)`

Creates a result card and adds it to the store and persists it.

**Signature:**
```typescript
export function logResultCard(input: LogResultCardInput): void
```

**Parameters:**
- `input` (LogResultCardInput): Object with the following properties:
  - `header` (string): Card header/title
  - `result` (string): The main result value
  - `content` (string): Detailed content/breakdown
  - `source` (ResultSource, optional): Source type (defaults to 'other')
  - `meta` (Record<string, unknown>, optional): Additional metadata

**Side Effects:**
1. Generates unique ID and timestamp
2. Adds card to Zustand store
3. Persists all cards via IPC to electron main process

**Example:**
```typescript
logResultCard({
  header: "Dice Roll: 2d6+3",
  result: "12",
  content: "Rolls: 4 + 5 +3",
  source: "dice",
  meta: { expression: "2d6+3" }
});
```

---

##### `generateId()` (Internal)

Generates a unique ID for result cards.

**Signature:**
```typescript
function generateId(): string
```

**Returns:** Unique string ID based on timestamp and random characters.

---

### Table Engine

**Location:** `/src/core/tables/`

Manages loading, indexing, and resolving random tables (Aspects, Domains, Oracles).

#### Functions

##### `loadAndBuildRegistry()`

Loads all tables and builds the registry.

**Signature:**
```typescript
export async function loadAndBuildRegistry(): Promise<TableRegistry>
```

**Returns:** Promise resolving to `TableRegistry`.

---

### Weave Engine

**Location:** `/src/core/weave/weaveEngine.ts`

Handles rolling on Weaves (custom random tables).

#### Functions

##### `rollWeave(weave: Weave)`

Rolls on a Weave and returns the matching row.

**Signature:**
```typescript
export function rollWeave(weave: Weave): { roll: number; row: WeaveRow }
```

**Parameters:**
- `weave` (Weave): The Weave to roll on

**Returns:** Object containing:
- `roll`: The die roll result (1 to `weave.maxRoll`)
- `row`: The matching `WeaveRow` for that roll

**Behavior:**
- Rolls a die with `weave.maxRoll` sides
- Finds the row where `roll >= row.from && roll <= row.to`
- Throws error if no row matches the roll

**Example:**
```typescript
const result = rollWeave(myWeave);
// result.roll = 47
// result.row = { id: '...', from: 41, to: 60, targetType: 'oracle', targetId: 'action' }
```

---

## State Management

The application uses Zustand for state management with two primary stores.

### Results Store

**Location:** `/src/stores/useResultsStore.ts`

Manages result cards state.

#### Interface: `ResultsStore`

```typescript
interface ResultsStore {
  cards: ResultCard[];
  addCard: (card: ResultCard) => void;
  clearCards: () => void;
  loadCards: (cards: ResultCard[]) => void;
}
```

#### Store: `useResultsStore`

**Import:**
```typescript
import { useResultsStore } from './stores/useResultsStore';
```

#### State

##### `cards`

Array of all result cards.

**Type:** `ResultCard[]`

**Access:**
```typescript
const cards = useResultsStore(state => state.cards);
```

---

#### Actions

##### `addCard(card: ResultCard)`

Adds a new result card to the store.

**Signature:**
```typescript
addCard: (card: ResultCard) => void
```

**Parameters:**
- `card` (ResultCard): The card to add

**Usage:**
```typescript
useResultsStore.getState().addCard(newCard);
```

---

##### `clearCards()`

Removes all result cards from the store.

**Signature:**
```typescript
clearCards: () => void
```

**Usage:**
```typescript
useResultsStore.getState().clearCards();
```

---

##### `loadCards(cards: ResultCard[])`

Replaces all cards in the store with the provided array.

**Signature:**
```typescript
loadCards: (cards: ResultCard[]) => void
```

**Parameters:**
- `cards` (ResultCard[]): Array of cards to load

**Usage:**
```typescript
useResultsStore.getState().loadCards(loadedCards);
```

---

### Tool Store

**Location:** `/src/stores/useToolStore.ts`

Manages active tool state.

#### Interface: `ToolStore`

```typescript
interface ToolStore {
  activeTool: string | null;
  setActiveTool: (toolId: string | null) => void;
}
```

#### Store: `useToolStore`

**Import:**
```typescript
import { useToolStore } from './stores/useToolStore';
```

#### State

##### `activeTool`

ID of the currently active tool, or null if none selected.

**Type:** `string | null`

**Access:**
```typescript
const activeTool = useToolStore(state => state.activeTool);
```

---

#### Actions

##### `setActiveTool(toolId: string | null)`

Sets the active tool.

**Signature:**
```typescript
setActiveTool: (toolId: string | null) => void
```

**Parameters:**
- `toolId` (string | null): Tool ID to activate, or null to deactivate

**Usage:**
```typescript
useToolStore.getState().setActiveTool('dice');
```

---

### Table Store

**Location:** `/src/stores/useTableStore.ts`

Manages the table registry and loading state.

#### Interface: `TableStore`

```typescript
interface TableStore {
  registry: TableRegistry | null;
  isLoading: boolean;
  error: string | null;
  loadTables: () => Promise<void>;
}
```

#### Store: `useTableStore`

**Import:**
```typescript
import { useTableStore } from './stores/useTableStore';
```

#### Actions

##### `loadTables()`

Loads all tables and updates the registry.

**Signature:**
```typescript
loadTables: () => Promise<void>
```

---

### Weave Store

**Location:** `/src/stores/useWeaveStore.ts`

Manages the Weave registry and active Weave state.

#### Interface: `WeaveStore`

```typescript
interface WeaveStore {
  registry: WeaveRegistry | null;
  activeWeaveId: string | null;
  isLoading: boolean;
  error: string | null;
  loadWeaves: () => Promise<void>;
  setActiveWeave: (id: string | null) => void;
  createWeave: (partial?: { name?: string; author?: string }) => Weave;
  updateWeave: (weave: Weave) => void;
  saveWeave: (id: string) => Promise<void>;
  deleteWeave: (id: string) => Promise<void>;
}
```

#### Store: `useWeaveStore`

**Import:**
```typescript
import { useWeaveStore } from './stores/useWeaveStore';
```

#### Key Actions

##### `loadWeaves()`

Loads all Weaves from IPC and builds registry.

##### `createWeave(partial?)`

Creates a new Weave with default values.

##### `updateWeave(weave)`

Updates a Weave in the registry.

##### `saveWeave(id)`

Saves a Weave to disk via IPC.

##### `deleteWeave(id)`

Deletes a Weave from disk and registry.

---

## Component APIs

### Tool Registry

**Location:** `/src/components/tools/registry.ts`

Central registry for all tool configurations.

#### Interface: `ToolConfig`

Defines the structure of a tool configuration.

```typescript
export interface ToolConfig {
  id: string;              // Unique identifier
  name: string;            // Display name
  icon: LucideIcon;        // Icon component
  component: ComponentType; // React component
}
```

#### Constant: `tools`

Array of all registered tools.

**Type:** `ToolConfig[]`

**Current Tools:**
- Dice Tool (`id: 'dice'`)

**Usage:**
```typescript
import { tools } from './components/tools/registry';

tools.forEach(tool => {
  console.log(tool.id, tool.name);
});
```

---

### Dice Tool Component

**Location:** `/src/components/tools/dice/DiceTool.tsx`

React component for the dice rolling interface.

#### Component: `DiceTool`

**Signature:**
```typescript
export function DiceTool(): JSX.Element
```

**State:**
- `expression` (string): Current dice expression input
- `error` (string | null): Current error message
- `advantageMode` (AdvantageMode): Current advantage/disadvantage mode ('none' | 'advantage' | 'disadvantage')

**Methods:**

##### `handleDiceClick(die: string)`

Handles dice icon clicks. Supports both normal dice addition and advantage/disadvantage mode.

**Parameters:**
- `die` (string): The die type (e.g., "d4", "d6", "d20")

**Behavior:**
- Normal mode: Increments existing dice count or adds new die
- Advantage mode: Adds `2{die}kh` and resets mode
- Disadvantage mode: Adds `2{die}kl` and resets mode

---

##### `handleModifierClick(modifier: string)`

Appends a modifier to the expression.

**Parameters:**
- `modifier` (string): Modifier string (e.g., "+1", "-1")

---

##### `handleRoll()`

Executes the dice roll and creates a result card.

**async function**

**Side Effects:**
1. Validates expression is not empty
2. Rolls dice using `rollDiceExpression()`
3. Formats result with **bold** for kept dice
4. Creates result card via `logResultCard()`
5. Expression persists for easy re-rolling

---

##### `handleClear()`

Clears the expression input and error state.

---

**Features:**
- Geometric dice icons (Triangle/d4, Square/d6, Diamond/d8, Circle/d10, Pentagon/d12, Hexagon/d20, Percent/d100)
- Advantage/Disadvantage toggles (DIS/ADV buttons)
- Modifier buttons (-1, +1)
- Text input for custom expressions with Enter key support
- Expression builder info tooltip (kl/kh modifiers)
- Custom themed tooltips with monospace font
- Expression persistence after rolling
- Clear button to reset expression
- Bold formatting for kept dice in results
- Error handling with user-friendly messages

---

## Type Definitions

### Dice Types

**Location:** `/src/core/dice/types.ts`

#### `RollResult`

Represents a single die roll result.

```typescript
export interface RollResult {
  value: number;   // The rolled value
  sides: number;   // Number of sides on the die
  kept?: boolean;  // Whether this die was kept (for advantage/disadvantage)
}
```

---

#### `DiceRollResult`

Complete result of a dice expression roll.

```typescript
export interface DiceRollResult {
  expression: string;                    // Original expression
  total: number;                         // Final calculated total
  rolls: RollResult[];                   // Individual roll results
  modifier?: number;                     // Applied modifier
  meta?: Record<string, unknown>;        // Optional metadata
}
```

---

#### `DiceOptions`

Options for dice rolling.

```typescript
export interface DiceOptions {
  meta?: Record<string, unknown>;  // Reserved for future extensions
}
```

---

### Result Types

**Location:** `/src/core/results/types.ts`

#### `ResultSource`

Type of source that generated a result.

```typescript
export type ResultSource =
  | 'dice'           // Dice roll
  | 'table'          // Random table
  | 'oracle'         // Oracle consultation
  | 'interpretation' // Interpretation tool
  | 'system'         // System-generated
  | 'other';         // Other source
```

---

#### `ResultCard`

A result card displayed in the results history.

```typescript
export interface ResultCard {
  id: string;                        // Unique identifier
  timestamp: string;                 // ISO format timestamp
  header: string;                    // Card title/header
  result: string;                    // Main result value
  content: string;                   // Detailed content/breakdown
  source?: ResultSource;             // Source type
  meta?: Record<string, unknown>;    // Additional metadata
}
```

---

### Table Types

**Location:** `/src/core/tables/types.ts`

#### `RollTable`

Represents a single random table.

```typescript
export interface RollTable {
  id: string;              // Generated ID
  name: string;            // Display name
  category: string;        // "Oracle", "Aspect", "Domain"
  tableData: TableRow[];   // Array of floor/ceiling/result entries
  maxRoll: number;         // Usually 100
  tags: string[];          // Categorization tags
}
```

#### `TableRegistry`

Central registry for all loaded tables.

```typescript
export interface TableRegistry {
  aspectPacks: Map<string, TablePackMetadata>;
  domainPacks: Map<string, TablePackMetadata>;
  oracles: Map<string, OracleTableMetadata>;
  tablesById: Map<string, RollTable>;
  oraclesByTag: Map<string, string[]>;
}
```

---

### Weave Types

**Location:** `/src/core/weave/weaveTypes.ts`

#### `WeaveTargetType`

Type of target that a Weave row can reference.

```typescript
export type WeaveTargetType = 'oracle' | 'oracleCombo' | 'aspect' | 'domain';
```

#### `WeaveRow`

A single row in a Weave table.

```typescript
export interface WeaveRow {
  id: string;        // Local row UUID for UI
  from: number;      // Inclusive range start
  to: number;        // Inclusive range end
  targetType: WeaveTargetType;
  targetId: string;  // ID resolvable by TableRegistry or known oracle IDs
}
```

#### `Weave`

A custom random table (Weave).

```typescript
export interface Weave {
  id: string;        // Slug / filename-safe identifier
  name: string;      // Display name
  author: string;    // Creator name
  maxRoll: number;   // Die size: 10, 20, 100, etc.
  rows: WeaveRow[];  // Array of roll ranges
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}
```

#### `WeaveRegistry`

Registry containing all loaded Weaves.

```typescript
export interface WeaveRegistry {
  weaves: Map<string, Weave>;
}
```

---

### Electron API Types

**Location:** `/src/types/electron.d.ts`

#### `ElectronAPI`

TypeScript definitions for the exposed Electron API.

```typescript
export interface ElectronAPI {
  tapestry: {
    getTree: () => Promise<unknown>;
    readEntry: (path: string) => Promise<string>;
    writeEntry: (path: string, content: string) => Promise<{ success: boolean }>;
    saveResults: (cards: unknown[]) => Promise<{ success: boolean }>;
    loadResults: () => Promise<unknown[]>;
  };
  tables: {
    loadAll: () => Promise<{ success: boolean; data?: unknown; error?: string }>;
    getUserDir: () => Promise<string>;
  };
  weaves: {
    loadAll: () => Promise<{ success: boolean; data?: Weave[]; error?: string }>;
    save: (weave: Weave) => Promise<{ success: boolean; error?: string }>;
    delete: (id: string) => Promise<{ success: boolean; error?: string }>;
  };
}
```

**Global Declaration:**
```typescript
declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
```

**Usage:**
```typescript
// Access via window.electron
const tree = await window.electron.tapestry.getTree();
```

---

## Dependencies

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^19.2.0 | UI framework |
| `react-dom` | ^19.2.0 | React DOM rendering |
| `zustand` | ^5.0.8 | State management |
| `lucide-react` | ^0.554.0 | Icon library |
| `react-markdown` | ^10.1.0 | Markdown rendering |
| `rehype-raw` | ^7.0.0 | HTML in markdown support |
| `remark-gfm` | ^4.0.1 | GitHub Flavored Markdown |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `electron` | ^39.2.3 | Desktop application framework |
| `vite` | ^7.2.4 | Build tool and dev server |
| `typescript` | ^5.9.3 | TypeScript compiler |
| `tailwindcss` | ^3.4.18 | CSS framework |
| `electron-builder` | ^26.0.12 | Electron app builder |
| `vite-plugin-electron` | ^0.29.0 | Vite Electron integration |
| `@vitejs/plugin-react` | ^5.1.1 | Vite React plugin |

---

## Development Scripts

### `pnpm dev`

Starts the development server with hot reload.

**Command:**
```bash
pnpm dev
```

**Details:**
- Runs Vite dev server
- Launches Electron in development mode
- Opens DevTools automatically
- Enables hot module replacement

---

### `pnpm build`

Builds the production application.

**Command:**
```bash
pnpm build
```

**Steps:**
1. Compiles TypeScript
2. Builds Vite bundle
3. Packages with Electron Builder

---

### `pnpm preview`

Previews the production build.

**Command:**
```bash
pnpm preview
```

---

## Notes for Developers

### Current Limitations

1. **File System:** Currently using stubbed in-memory data. Real file system integration is pending.
2. **Results Storage:** Using in-memory cache. Persistence to `/.anvil-loom/results.json` is TODO.
3. **Tools:** Only the Dice tool is currently implemented. More tools are planned (Environments, Oracles, AI).

### Future Tools (Planned)

As indicated in the tool registry:
- Environments Tool
- Oracles Tool
- AI Tool
- Additional utility tools

### Code Patterns

1. **State Management:** Use Zustand stores for global state
2. **IPC Communication:** All main process communication goes through the preload script
3. **Result Cards:** Use `logResultCard()` for creating any type of result
4. **Engines:** Core logic is separated into engine modules (`/src/core/`)
5. **Components:** UI components are in `/src/components/` with clear separation of concerns

---

## API Quick Reference

### Dice Rolling
```typescript
import { rollDiceExpression } from './core/dice/diceEngine';
const result = await rollDiceExpression("2d6+3");
```

### Creating Result Cards
```typescript
import { logResultCard } from './core/results/resultCardEngine';
logResultCard({
  header: "My Result",
  result: "42",
  content: "Detailed breakdown",
  source: "dice"
});
```

### Accessing Results Store
```typescript
import { useResultsStore } from './stores/useResultsStore';

// In component
const cards = useResultsStore(state => state.cards);

// Outside component
const cards = useResultsStore.getState().cards;
useResultsStore.getState().addCard(newCard);
```

### IPC Communication
```typescript
// Read entry
const content = await window.electron.tapestry.readEntry('/path/to/file.md');

// Write entry
await window.electron.tapestry.writeEntry('/path/to/file.md', 'content');

// Save/Load results
await window.electron.tapestry.saveResults(cards);
const loaded = await window.electron.tapestry.loadResults();
```

---

**End of API Documentation**
