# Anvil and Loom - API & Development Documentation

**Version:** 0.4.0
**Description:** A story-first TTRPG engine for journaling, dice, and narrative management
**Generated:** 2026-01-12

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Layout](#architecture--layout)
3. [Build & Scripts](#build--scripts)
4. [Electron Processes & IPC](#electron-processes--ipc)
5. [Data Models](#data-models)
6. [Renderer Systems & State](#renderer-systems--state)
7. [Tapestry Workflow](#tapestry-workflow)
8. [Editor Stack](#editor-stack)
9. [Result Logging](#result-logging)
10. [Core Engines & Tools](#core-engines--tools)
11. [AI Integration System](#ai-integration-system)
12. [Settings](#settings)
13. [Dependencies](#dependencies)
14. [Known Limitations & Next Steps](#known-limitations--next-steps)

---

## Project Overview

- Electron + React 19 + TypeScript desktop app with Obsidian-style pane layout and Tailwind styling.
- Tapestry system stores campaigns on disk with registry, per-world config, entry tree, and Milkdown-based editor.
- Dice tools generate Result Cards; logging can also append cards directly into active entry.
- AI integration system with persona-based content generation and contextual interpretation.
- 3D dice implementation and assets were intentionally removed (per Loomwright notes). Only 2D dice roller is active; keep Electron/build config untouched.

## Architecture & Layout

```
anvil-and-loom-v2/
  electron/
    main.ts
    preload.ts
    ipc/
      fileSystem.ts        # legacy stub
      storage.ts           # legacy stub
      tapestry.ts          # registry + filesystem IPC
      settings.ts          # layout persistence IPC
  src/
    components/
      layout/              # App shell, TopBar, lanes
      tapestry/            # manager, tree, editor, cards
      tools/               # Dice panes
      results/, settings/
    core/
      dice/, results/
    lib/                   # editor, tapestry helpers
    stores/                # Zustand stores
    types/                 # shared type definitions
  app/core-data/           # bundled resources
  Documents/               # project docs
  collaboration/           # Loomwright/Weaver handoffs
```

## Build & Scripts

- Build tool: `electron-vite` (`electron.vite.config.ts`).
- Dev: `pnpm dev` (Vite dev server + Electron with hot reload).
- Build: `pnpm build` (electron-vite build + electron-builder).
- Preview: `pnpm preview` (runs built app without packaging).

## Electron Processes & IPC

**Main (`electron/main.ts`):**
- Creates BrowserWindow (1400x900, preload, contextIsolation true).
- Loads dev server via `ELECTRON_RENDERER_URL` or built renderer.
- Registers IPC: fileSystem (stub), storage (stub), tapestry, settings.

**Preload (`electron/preload.ts`):**
Exposes `window.electron`:

- `tapestry.loadRegistry(): Promise<TapestryRegistry>`
- `tapestry.create(data): Promise<string>`
- `tapestry.open(id): Promise<TapestryConfig | null>`
- `tapestry.update(id, updates): Promise<void>`
- `tapestry.remove(id): Promise<void>` (registry only)
- `tapestry.delete(id): Promise<void>` (delete from disk)
- `tapestry.loadTree(tapestryId): Promise<TapestryNode | null>`
- `tapestry.loadEntry(path): Promise<EntryDoc | null>`
- `tapestry.saveEntry(entry): Promise<void>`
- `tapestry.createEntry(parentPath, title, category): Promise<string>`
- `tapestry.createFolder(parentPath, name): Promise<void>`
- `tapestry.rename(oldPath, newName): Promise<void>`
- `tapestry.deleteNode(path): Promise<void>`
- `tapestry.move(sourcePath, destinationFolder, itemName): Promise<void>`
- `tapestry.updateOrder(folderPath, order): Promise<void>`

- `settings.saveLayout(layout)`, `settings.loadLayout()`, `settings.resetLayout()`.
- Legacy stubs: `tapestry:getTree/readEntry/writeEntry` in `ipc/fileSystem.ts` and `tapestry:saveResults/loadResults` in `ipc/storage.ts` remain in-memory placeholders.

## Data Models

- `TapestryRegistryEntry`: `{ id, name, path, description?, imagePath?, createdAt, updatedAt, lastOpenedAt? }`.
- `TapestryRegistry`: `{ tapestries: TapestryRegistryEntry[] }`, stored at `%userData%/tapestries.json`.
- `TapestryConfig` (per tapestry `.loom/tapestry.json`): `{ id, name, description?, imagePath?, defaultEntryCategory?, theme? }`.
- Entry frontmatter (`EntryFrontmatter`): `{ id, title, category, tags? }`.
- `EntryDoc`: `{ id, path, title, category, content, frontmatter, isDirty }`.
- `TapestryNode`: `{ id, type: "folder" | "entry" | "asset", name, path, category?, children? }` with optional `.loom/order.json` (`FolderOrder.entries: string[]`).
- Editor mode: `'edit' | 'view'`.
- Result card model for embedding in Markdown: `{ id, type: 'dice' | 'note' | 'interpretation', source, summary, payload, expression?, content? }`.
- Settings (`src/types/settings.ts`): `DiceSettings` (colors, material, surface, dice set, `logToEntry`), `EditorSettings` (theme, GFM/tables/task lists/strikethrough, history, clipboard, indent, cursor, tooltip, slash, emoji/upload placeholders, prism, table controls, syncOnChange, dev flags), combined in `GlobalSettings`.

## Renderer Systems & State

- **Layout**: Obsidian-style three-pane system with collapsible left/right panes and resizable drag handles. Replaced rc-dock with custom pane system.
- **TopBar/Toolbars**: Top toolbar contains collapse buttons and mode switchers for left pane (Tapestry/Tags/Bookmarks) and right pane (Dice/Results). `GlobalLastResult` stays pinned at bottom of right panel.
- **State stores (Zustand)**:
  - `useTapestryStore`: registry, `activeTapestryId`, `tree`, loading/error, CRUD + tree loaders.
  - `useEditorStore`: global `mode`, `openEntries`, `activeEntryId`, dirty tracking, `openEntry/closeEntry/saveEntry/saveAllEntries`.
  - `useTabStore`: tab list for entry tabs with `openTab/closeTab/setActiveTab/updateTabTitle`.
  - `useResultsStore`: in-memory result cards (`addCard/clearCards/loadCards`).
  - `useToolStore`: `activeTool`, `rightPaneMode`.
  - `useAiStore`: AI settings (model, URI, API key), persona state (7 personas with name/instruction overrides), active persona selection.
  - `useSettingsStore`: persisted `GlobalSettings` (localStorage key `anvil-loom-settings`).
  - `usePaneStore`: pane widths and collapse states.
  - `useLeftPaneStore`: left pane mode and collapse state.
  - `useTagStore`: tag indexing and filtering for panels.
  - `useDialogStore`: global dialog management for confirmations.
  - `useDiceStore`: legacy 3D dice settings, currently unused in UI.

## Tapestry Workflow

- **Filesystem layout (default)**:
  - Registry: `%AppData%/Anvil and Loom/tapestries.json`.
  - New tapestry path default: `Documents/Anvil and Loom/Tapestries/<slug>/`.
  - Per tapestry: `.loom/tapestry.json`, `.loom/order.json` per folder (optional), `entries/` folder, seeded `The First Thread.md` with frontmatter and welcome content.
- **Ordering**: `buildTree` prioritizes names in `.loom/order.json` then appends remaining items alphabetically (skips `.loom`).
- **IPC operations**:
  - `create` scaffolds directories/config + initial entry (uuid ids).
  - `open` loads config and updates `lastOpenedAt`.
  - `update/remove/delete` handle registry metadata vs disk deletion.
  - Tree loaders/entry CRUD map to filesystem; `rename` also updates frontmatter title; `move` expects destination folder + final name; `updateOrder` writes `.loom/order.json`.
- **UI**:
  - `TapestryManager` lists registry entries (cards with relative "last opened"), supports create/open/edit/remove/delete with double-confirm delete overlay.
  - Dialogs: `CreateTapestryDialog`, `EditTapestryDialog`.
  - `TapestryTree` (in left lane) loads on mount, renders folders/entries with badges, expand/collapse, context menu (new entry/folder, rename, delete, move), move dialog to choose destination folder, refreshes tree after operations. Drag/drop ordering is not implemented yet.
  - Entry click loads file via IPC, opens a tab (`useTabStore`) and sets it active in `useEditorStore`.

## Editor Stack

- `TapestryEditor` hosts `EditorModeToggle` + content area.
  - Mode toggle auto-saves when switching from edit -> view; Ctrl+S calls `saveEntry` for active entry; dirty indicator shows unsaved state.
- `MilkdownEditor` uses raw Milkdown with feature flags driven by `EditorSettings` (toolbar, slash menu, cursor enhancements, theme). Listener pushes `markdownUpdated` events to `useEditorStore.updateEntryContent`.
- `MarkdownViewer` uses `react-markdown` + `remark-gfm` and intercepts code fences with language `result-card`, parsing JSON into `src/components/tapestry/ResultCard`. Other markdown renders via Tailwind typography styles.
- `result-card` embed format produced by `appendResultCard`:

```markdown
```result-card
{ "id": "...", "type": "dice", "source": "DICE: 2d6", "summary": "12", "payload": { ... } }
```
```

- Tabs: `CenterLane` renders tabs for entry editors depending on tab type.

## Result Logging

- `logResultCard` (`core/results/resultCardEngine.ts`):
  - Builds `ResultCard` with id/timestamp, pushes to `useResultsStore`.
  - When `settings.dice.logToEntry` is true and an entry is active, converts to `ResultCardModel`, appends serialized `result-card` block to entry markdown via `appendResultCard`, calls `updateEntryContent`, then auto `saveEntry`.
- UI:
  - `ResultsFullPane` and `ResultsHistory` render history stack.
  - `GlobalLastResult` shows latest card, toggle to enable/disable `logToEntry`, and clear-all button.
- Persistence: `ipc/storage.ts` remains stubbed; results are memory-only until wired to disk.

## Core Engines & Tools

- **Dice** (`core/dice`):
  - `rollDiceExpression(expression, options?) => Promise<DiceRollResult>` (rolls + modifier, keeps advantage/disadvantage markers).
  - `parseDiceExpression(expression) => ParsedExpression` (supports kh/kl, keep counts, multiple groups, modifiers).
  - UI: `DiceTool` builds expressions with dice icons, advantage/disadvantage toggles, modifiers, Enter to roll, logs Result Cards. 3D dice engine and assets were removed; `useDiceStore` and dice settings persist for future work only.
- **Right pane tools**: modes `dice`, `results`, `stitchboard` driven by `useToolStore`. `GlobalLastResult` is fixed at bottom of right lane.

## AI Integration System

- **AI Client** (`core/ai/aiClient.ts`):
  - `callAi(uri, apiKey, model, messages) => Promise<AiResponse>` - Centralized OpenAI-compatible API client with error handling.
  - Supports any OpenAI-compatible endpoint (OpenAI, Anthropic with adapter, local LLMs).
  - Parses JSON responses and handles network/API errors gracefully.

- **Persona System** (`core/ai/personaDefaults.ts`):
  - 7 default GM personas: Weaver of Fates, Keeper of Shadows, Voice of Wilds, Herald of Void, Oracle of Stars, Chronicler of Ruins, Wandering Sage.
  - Each persona has default name and instructions loaded from markdown files.
  - Users can override persona names and instructions per-persona.
  - Active persona selection affects all AI-generated content.

- **Prompt Engineering** (`core/ai/promptBuilder.ts`):
  - `buildInterpretationPrompt()` - Generates contextual prompts for interpreting dice results.
  - Universal GM instructions template for consistent AI behavior.
  - Persona instructions appended to system prompts.

- **Response Parsing** (`core/ai/responseParser.ts`):
  - Parses AI responses into structured formats (Content/Result sections).
  - Handles various response formats and fallbacks.

- **Thread Integration**:
  - "Interpret with AI" button on thread cards triggers contextual interpretation.
  - AI interpretations displayed as separate purple-themed thread cards.
  - Interpretations include persona name, content analysis, and actionable results.

## Settings

- `useSettingsStore` persists `GlobalSettings` via `zustand/persist` (localStorage). Categories surfaced in `SettingsModal`:
  - **Dice**: colors, material preset, dice set, surface.
  - **Editor**: theme (Nord dark/light), GFM + tables/task lists/strikethrough, history/clipboard/indent, syncOnChange, tooltip/slash menu, dev overrides (CommonMark toggle, collaboration stub).
- Layout persistence: `useDockingStore` currently writes to `localStorage`; IPC handlers in `settings.ts` are available for disk persistence but not yet connected.

## Dependencies

Key production packages:
- React 19, React DOM, TypeScript
- Zustand (state)
- Tailwind CSS (+ typography plugin)
- @milkdown/* (raw Milkdown editor stack)
- react-markdown + remark-gfm
- lucide-react (icons)
- gray-matter, uuid (frontmatter + ids)
- Three.js stack, @react-three/* (currently unused after 3D dice removal but still installed)

Dev/tooling:
- electron 39.2.3, electron-vite 4.0.1, electron-builder
- vite 7.2.4, @vitejs/plugin-react
- tailwind/postcss/autoprefixer
- types packages

## Known Limitations & Next Steps

- Result history persistence is not wired; `ipc/storage.ts` is a stub.
- Legacy `ipc/fileSystem.ts` tree/entry stubs are unused but still registered.
- Dock layout saves to localStorage; integrate `window.electron.settings` for disk persistence if desired.
- Tree drag-and-drop ordering and "reveal in explorer" are intentionally out of scope for v1.
- 3D dice implementation and assets were removed by design; dependencies remain but do not reintroduce without following future plan (pre-baked textures + GLTF materials).
- Milkdown integration covers core features; advanced plugins (upload/emoji/collaboration) are placeholders.
- Tests are absent; manual verification needed after filesystem operations or IPC changes.
