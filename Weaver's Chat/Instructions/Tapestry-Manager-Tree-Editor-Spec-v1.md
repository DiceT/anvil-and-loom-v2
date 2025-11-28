# Anvil & Loom – Tapestry Manager, Tree, and Editor Spec (v1)

_Last updated: 2025-11-27_

## 0. Purpose

This document specifies the **first implementation pass** for:

- **Tapestry Manager** (world/campaign selection hub)
- **Tapestry Tree** (left pane navigation)
- **Markdown-based Editor** (center pane, Edit/View modes, powered by Milkdown)

The goal is to:

- Support multiple **Tapestries** (worlds/campaigns) with a simple registry.
- Display a Tapestry’s content as a **Tree** with user-defined ordering.
- Edit Entries as **Markdown files on disk**, using Milkdown for Edit mode and a Markdown renderer for View mode.
- Make **Result Cards** first-class, auto-inserted blocks that drive the “Result Card → Reaction Paragraph” gameplay loop.

---

## 1. High-Level Architecture

### 1.1 Core concepts

- **Tapestry**
  - A world or campaign, represented by a root folder on disk.
  - Each Tapestry has its own config, entries, and assets.

- **Entry**
  - A single Markdown document within a Tapestry.
  - Stored as `.md` with YAML frontmatter.
  - Represents: Session, World/Lore, NPC, Mechanics, etc.

- **Tapestry Manager**
  - App-level “vault selector” that lists all known Tapestries and allows:
    - Add / Edit / Open / Remove / Delete.

- **Tapestry Tree**
  - Left pane file tree for the active Tapestry.
  - Mirrors the filesystem but preserves a **custom order** using `.loom/order.json`.

- **Editor**
  - Center pane, tabbed.
  - Global **Editor Mode**: `edit` (Milkdown) or `view` (Markdown renderer).
  - Handles opening/saving Entries as `.md`.

- **Result Card**
  - A structured “resolution + prompt” block inserted by dice/oracle tools.
  - Persisted as a special Markdown block in Entries.
  - Rendered as a prominent component in View mode.

---

## 2. Data Models

### 2.1 Tapestry Registry

The registry tracks all known Tapestries globally.

- **File location (example, Electron):**
  - `app.getPath('userData')/tapestries.json`

```ts
export interface TapestryRegistryEntry {
  id: string;          // uuid
  name: string;
  path: string;        // absolute path to tapestry root
  description?: string;
  imagePath?: string;  // optional world image/logo
  createdAt: string;   // ISO datetime
  updatedAt: string;   // ISO datetime
  lastOpenedAt?: string;
}

export interface TapestryRegistry {
  tapestries: TapestryRegistryEntry[];
}
```

> The registry is the **source of truth** for which Tapestries the app knows about and where they live on disk.

### 2.2 Per-Tapestry Config

Each Tapestry root contains:

- `.loom/tapestry.json` – configuration specific to that Tapestry.

```ts
export type EntryCategory =
  | 'world'
  | 'session'
  | 'npc'
  | 'lore'
  | 'mechanics'
  | 'other';

export interface TapestryConfig {
  id: string;                // same as registry entry id
  name: string;
  description?: string;
  imagePath?: string;
  defaultEntryCategory?: EntryCategory;
  theme?: {
    accentColor?: string;    // future: per-tapestry theming
  };
  // Future fields: calendar, default Aspect/Domain set, etc.
}
```

### 2.3 Tapestry Tree Nodes & Folder Ordering

Each folder may contain a `.loom/order.json` file describing the desired order of items in that folder.

```ts
export interface FolderOrder {
  entries: string[];   // file/folder names, in desired order
}
```

Tree nodes:

```ts
export type NodeType = 'folder' | 'entry' | 'asset';

export interface TapestryNode {
  id: string;                // stable ID (e.g., frontmatter id or derived from path)
  type: NodeType;
  name: string;              // display name
  path: string;              // absolute path
  category?: EntryCategory;  // for 'entry' type nodes
  children?: TapestryNode[];
}
```

### 2.4 Entries (Markdown Documents)

Each Entry is a `.md` file with YAML frontmatter:

```markdown
---
id: "uuid-v4"
title: "The First Thread"
category: "session"
tags: ["intro"]
---

# The First Thread

Your content here...
```

Frontmatter model:

```ts
export interface EntryFrontmatter {
  id: string;
  title: string;
  category: EntryCategory;
  tags?: string[];
}
```

In-memory representation:

```ts
export interface EntryDoc {
  id: string;
  path: string;
  title: string;
  category: EntryCategory;
  content: string;         // raw markdown, frontmatter stripped
  frontmatter: EntryFrontmatter;
  isDirty: boolean;
}
```

### 2.5 Editor State

Global editor state tracks open Entries and the current mode.

```ts
export type EditorMode = 'edit' | 'view';

export interface EditorState {
  mode: EditorMode;
  openEntries: EntryDoc[];
  activeEntryId?: string;
}
```

### 2.6 Result Card Model (v1)

Result Cards are created by dice/oracle tools and appended to Entries.

```ts
export type ResultCardType = 'dice' | 'oracle' | 'weave';

export interface ResultCardModel {
  id: string;          // uuid
  type: ResultCardType;
  source: string;      // e.g. "Weave: Haunted Forest / Atmosphere"
  expression?: string; // dice expression, if any
  summary: string;     // short headline prompt
  payload: any;        // detailed data, JSON-serializable
}
```

Storage format in Markdown (example syntax):

```markdown
:::result-card id="abcd-1234"
type: "oracle"
source: "Weave: Haunted Forest / Atmosphere"
expression: "1d100 → 47"
summary: "A bloodstained caravan limps into view."
payload:
  roll: 47
  table: "Haunted Forest: Atmosphere"
  # ...additional fields as needed
:::
```

> Exact syntax can evolve, but it should be:
> - Clearly distinguishable as a Result Card block.
> - Losslessly parseable back into `ResultCardModel` data.

---

## 3. Tapestry Manager (World Selector)

### 3.1 Behavior

The Tapestry Manager is an applet that:

- Opens at startup **if no Tapestry is active**.
- Lists all Tapestries from `tapestries.json`.
- Provides actions:
  - **Create**
  - **Open**
  - **Edit**
  - **Remove from list**
  - **Delete from disk**

### 3.2 UI Requirements (v1)

- Display each Tapestry as a card or list row with:
  - Name
  - Description
  - Last opened date
  - Thumbnail (image or default logo)

**Create Tapestry flow:**

1. Prompt for:
   - Name (required)
   - Description (optional)
   - Image (optional)
2. Choose base directory (default suggested):
   - e.g. `Documents/Anvil and Loom/Tapestries/<slug>`  
     or `%AppData%/Anvil and Loom/Tapestries/<slug>`
3. Scaffold new Tapestry:
   - Create root folder
   - Create `.loom/` subfolder
   - Write `.loom/tapestry.json`
   - Create `entries/` folder
   - Create initial Entry (e.g. “Welcome” or “The First Thread”)
4. Add entry to `tapestries.json`.
5. Open the new Tapestry in main app view.

**Open Tapestry:**

- Set active Tapestry id.
- Load Tapestry Tree + Editor.

**Edit Tapestry:**

- Modal for editing:
  - Name
  - Description
  - Image
- Updates `tapestries.json` + `.loom/tapestry.json`.

**Remove / Delete:**

- “Remove from list”: Remove from `tapestries.json` only, files remain.
- “Delete from disk”: Remove from registry **and** delete Tapestry directory (with confirmation).

---

## 4. Tapestry Tree (Left Pane)

### 4.1 Purpose

- Show the folder structure and Entries of the active Tapestry.
- Preserve user-defined ordering, not just alphabetical.
- Support drag-and-drop reordering and moving.

### 4.2 Loading Tree Data

1. Given a `tapestryRoot` path:
   - Scan folders and files (initially focus on `entries/`).
   - Read `.loom/order.json` if present in each folder.
   - Merge OS listing with order metadata:
     - Items in `order.json` appear first, in that order.
     - Any additional items (new files) are appended, sorted by name.

2. For each `.md` file:
   - Parse frontmatter to populate:
     - `id`, `title`, `category`.
   - Build `TapestryNode` with `type: 'entry'`.

3. For folders:
   - Build `TapestryNode` with `type: 'folder'`.
   - Recursively load children.

### 4.3 Tree Interactions

**Click:**

- Clicking an `entry` node:
  - Opens the corresponding Entry in the Editor (center pane) as a tab.
  - If already open, activates that tab.

**Drag & Drop:**

- Reorder within the same folder:
  - Update that folder’s `.loom/order.json`.
- Move to another folder:
  - Move the file/directory on disk.
  - Update both source and target folders’ `order.json`.

**Context Menu (v1):**

- On folder:
  - New Entry
  - New Folder
  - Rename
  - Delete
  - Reveal in Explorer/Finder
- On entry:
  - Open
  - Rename
  - Duplicate
  - Delete
  - Reveal in Explorer/Finder

### 4.4 Category Badges in Tree

Each `entry` node may have a `category` field:

- `world`, `session`, `npc`, `lore`, `mechanics`, `other`.

Render a small badge/icon next to entry names to visually indicate category (exact iconography is a UI concern, but category must always be available to the tree component).

---

## 5. Markdown Editor & Milkdown Integration

### 5.1 Global Edit/View Mode

Editor mode is **global**, not per-entry:

```ts
export type EditorMode = 'edit' | 'view';
```

- `edit`:
  - Use **Milkdown** to edit Markdown content.
- `view`:
  - Render Markdown read-only, with:
    - Headings, lists, links.
    - Internal links → navigation.
    - Custom components → Result Cards, etc.

UI:

- A global toggle control (e.g. segmented button or toggle) sets `EditorState.mode`.
- Switching from `edit` → `view` should auto-save the active Entry if it’s dirty (or at least persist changes).

### 5.2 Entry Editor Component (Per Tab)

```tsx
interface EntryEditorProps {
  entry: EntryDoc;
  mode: EditorMode;
  onChange: (updatedContent: string) => void;
}

function EntryEditor({ entry, mode, onChange }: EntryEditorProps) {
  if (mode === 'edit') {
    return (
      <MilkdownEditor
        key={entry.id}
        markdown={entry.content}
        onMarkdownChange={onChange}
      />
    );
  }

  return <MarkdownViewer markdown={entry.content} />;
}
```

Responsibilities:

- **MilkdownEditor**:
  - Takes raw markdown string.
  - Emits updated markdown via `onMarkdownChange`.
  - Handles editing, keybindings, and future custom nodes/commands.

- **MarkdownViewer**:
  - Uses markdown-it/remark (or similar) to render HTML.
  - Hooks into:
    - `:::result-card ...` blocks → Result Card React components.
    - Internal links (e.g. `[[Entry Title]]`) → tree navigation.
    - Other custom syntax as needed later.

### 5.3 Tabs & Entry Lifecycle

- Each open Entry appears as a tab (title = `entry.title`).
- Tab should indicate dirty state (e.g. small dot).
- Closing a tab with unsaved changes prompts:
  - Save / Discard / Cancel.

On saving:

1. Rebuild frontmatter using `EntryFrontmatter`.
2. Concatenate frontmatter + markdown content.
3. Write to `.md` file on disk.
4. Clear `isDirty`.

On re-open, load file from disk, parse frontmatter, populate `EntryDoc`.

---

## 6. Result Card Integration (P0 Behavior)

### 6.1 Storage & Rendering

- Result Cards appear as **Markdown block constructs** (e.g. `:::result-card ... :::`).
- They are:
  - Parsed into `ResultCardModel` when needed,
  - Rendered in **View mode** as collapsible, styled components.
- In Edit mode:
  - Initially, they can be shown as a read-only block region in Milkdown.
  - (Later, they can become true Milkdown custom block nodes.)

### 6.2 Insertion Flow

Result Cards are appended to the **active Entry** by the dice/oracle system.

Helper function:

```ts
export function appendResultCardToActiveEntry(card: ResultCardModel): void;
```

Expected behavior:

1. Locate `activeEntryId` in `EditorState.openEntries`.
2. Generate markdown block snippet for this `ResultCardModel`.
3. Append that snippet to `entry.content`, with two newlines after it.
4. Mark `entry.isDirty = true`.
5. If in `edit` mode:
   - Update Milkdown’s state with new markdown.
   - Move cursor to the line **after** the Result Card block, so the user can immediately type their reaction paragraph.
6. If in `view` mode:
   - Re-render the MarkdownViewer (Result Card appears).
   - (The user will likely switch to edit mode if they want to write; no auto-mode-switch is required v1.)

This supports the core gameplay loop:

> **Roll → Result Card appears → cursor lands after it → user writes reaction.**

---

## 7. Implementation Order

To keep work scoped and testable:

### Phase 1 – Filesystem & Registry

- Implement read/write for `tapestries.json`.
- Implement Tapestry creation:
  - Folder scaffolding
  - `.loom/tapestry.json`
  - `entries/` and initial entry.
- Implement loading an existing Tapestry’s config.

### Phase 2 – Tapestry Manager UI

- Basic UI listing all Tapestries.
- Create/Open/Edit/Remove/Delete.
- Wire “Open Tapestry” → main layout (Tree + Editor shell).

### Phase 3 – Tapestry Tree

- Implement tree builder:
  - Scan directory,
  - Parse `.md` frontmatter,
  - Merge with `.loom/order.json`.
- Render Tapestry Tree:
  - Folder + entry nodes,
  - Category badges for entries.
- Implement:
  - Click-to-open entry (stub editor view).
  - Basic drag-and-drop reordering + `.loom/order.json` updates.
  - Context menu with New Entry/Folder, Rename, Delete.

### Phase 4 – Markdown Editor (Milkdown + Viewer)

- Integrate Milkdown for Edit mode:
  - Load markdown from `EntryDoc.content`.
  - Emit `onMarkdownChange`.
- Implement Markdown Viewer for View mode.
- Add global Edit/View toggle.
- Implement tabbed EntryEditor with open/save/dirty-handling.

### Phase 5 – Result Card P0 Support

- Define stable Result Card markdown block syntax.
- Implement `ResultCardModel` + `appendResultCardToActiveEntry`.
- Update Viewer to render `:::result-card ...` blocks as React Result Card components.
- Ensure cursor behavior in Edit mode:
  - After appending a card, user lands beneath it ready to type their reaction text.

---

## 8. Out of Scope (for this pass)

- Full Milkdown schema customization (custom nodes/marks beyond what’s needed to render basic Markdown).
- In-editor slash commands (`/scene`, `/npc`, etc.).
- Advanced Entry types with structured forms (e.g., NPC sheets).
- 3D dice integrations.
- Map integration or Weave visualizations.
- AI-driven features (oracle interpretation, summaries, etc.).

These can be layered on once the **Tapestry Manager + Tree + Editor + Result Card** backbone is stable.
