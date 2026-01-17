# Loomreader Notes

## High-Level Overview of Anvil & Loom

Anvil & Loom is an Electron + React 19 + TypeScript desktop app built with `electron-vite`. The UI is a lane-based workspace: left for Tapestry management (world/campaign registry and tree), center for tabs (entries, etc.), and right for tools and results. Styling is handled by Tailwind plus custom CSS.

At core of domain model are:

- **Tapestries**: world/campaign containers backed by folders on disk, each with `.loom` metadata and a registry entry.
- **Entries**: Markdown documents edited via Milkdown, serving as primary surface for lore and play logs.
- **Result Cards**: structured records of actions (dice rolls, interpretations, etc.) that can be shown in UI and embedded into entries as fenced `result-card` blocks.

Electron's main process (`electron/main.ts`) sets up IPC handlers for Tapestry, settings, and a couple of legacy stubs. The preload script (`electron/preload.ts`) exposes a small, typed `window.electron` API that React renderer uses to talk to filesystem and user data directories while keeping contextIsolation on.

In renderer, `src/App.tsx` delegates to `components/layout/AppLayout`, and rest of UI is organized by feature under `src/components`. Domain "engines" live in `src/core` (dice, entries, results) and are mostly UI-agnostic. Shared helpers for editor and Tapestry live in `src/lib`. Application state is orchestrated via several focused Zustand stores in `src/stores` (tapestry, editor, tabs, tools, dice, results, settings, docking).

Tapestries are loaded via IPC into a registry and tree; entries flow through Milkdown into Zustand and back out via IPC saves. Tools on the right (Dice today) produce Result Cards via core engines, which feed a results store and optionally append themselves into active entry's markdown as ` ```result-card` fences. This Result Card pipeline is backbone of "play loop," turning each session into a living log where mechanics and narrative stay in sync.

---
## Threads, Panels, and Tapestries

Result Cards in the engine are presented to the player as **Threads**. Each Thread is a single outcome or beat in play (a dice roll, interpretation, etc.). The UI surfaces Threads in two main ways:

- **Latest Thread**: most recent Thread, always visible in the global "last result" area.
- **Thread History**: backlog of prior Threads for the current session, browsable in the results pane.

When "Log to Entry" toggle is on and a Panel (entry) is active, the latest Thread is appended into that Panel's markdown as a `result-card` fenced block. The GM/author then responds in prose, effectively weaving the Thread into the Panel.

Conceptually:

- **Thread** = one emergent piece of play (a card).
- **Panel** = a collection of Threads plus narrative response (an entry).
- **Tapestry** = a collection of Panels that form a world or campaign.

Internally, the system still uses the `ResultCard` type for consistency, but in UX copy and design we treat these as Threads.

## Thread Timestamps (Live vs Panel)

Each Thread (Result Card) is created once, with a single canonical timestamp:

- **Live Threads** use the `ResultCard` type in `src/core/results/types.ts`:
  - `timestamp: string` is set in `logResultCard` when the Thread is created.
  - The Latest Thread and Thread History both read from this field.

- **Panel Threads** use the `ResultCardModel` type in `src/types/tapestry.ts`:
  - `timestamp: string` has been added so embedded Threads carry the original event time.
  - `logResultCard` passes `card.timestamp` into `createResultCard`, which writes it into the serialized `result-card` JSON fence appended to panel markdown.

Rendering:

- **Live Thread cards** (in `src/components/results/ResultCard.tsx`) display the timestamp from the `ResultCard` object.
- **Panel Thread cards** (in `src/components/tapestry/ResultCard.tsx`) now display `new Date(card.timestamp).toLocaleTimeString()` instead of `new Date()`, so the time shown in the Panel matches the moment the Thread was originally created.

This keeps Threads time-consistent across:
- The Latest Thread
- Thread History
- Embedded Threads inside Panels
while still allowing each context (live vs panel) to style and present the Thread differently.

### Threads in Code (Store & Engine)

Internally, the old `ResultCard` concept has been aligned with **Threads**:

- `src/core/results/types.ts`:
  - `ResultCard` is still the base type for a result.
  - `type Thread = ResultCard;` is an alias so new code can think/speak in Threads.

- `src/stores/useResultsStore.ts`:
  - Store state is now thread-centric:
    - `threads: Thread[]`
    - `addThread`, `clearThreads`, `loadThreads`
  - Legacy card API is preserved as a thin layer:
    - `cards` is a getter that returns `threads`.
    - `addCard`, `clearCards`, `loadCards` just delegate to thread methods.

- `src/core/results/resultCardEngine.ts`:
  - `logResultCard(input)` is the existing entry point.
  - `logThread(input)` is a new alias that simply calls `logResultCard`, so new features can adopt Thread language without breaking old code.

### Panels in Code (Alias over Entries)

We are gradually aligning internal naming with the Panel metaphor:

- `src/types/tapestry.ts`:
  - `EntryDoc` remains the core type for a Tapestry entry.
  - `export type PanelDoc = EntryDoc;` adds a domain-aligned alias so new editor/tapestry code can talk in Panels instead of Entries.

- Current state:
  - Stores and IPC still use `Entry` naming (`openEntries`, `activeEntryId`, `loadEntry`, etc.).
  - UI copy and conceptual language use Panels (e.g., "No panel selected. Open a panel from the Tapestry tree.").
  - Over time, helper functions/selectors will adopt `PanelDoc` while keeping `EntryDoc` for backward compatibility.
