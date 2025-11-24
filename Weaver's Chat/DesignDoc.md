Here’s a prompt you can hand straight to Sonnet in Claude Code. It’s written so he’ll first *understand* the vision, then produce a **full task list + file skeleton** for v2.

You can paste this into a fresh Claude Code chat at the root of `anvil-and-loom-v2`:

---

You are helping design **Anvil & Loom v2**, a new React+TS+Electron desktop app for TTRPG journaling, dice, and oracles. This repo (`anvil-and-loom-v2`) is intentionally empty and meant to be a **clean reboot**.

For this pass, **do not write code yet**.
Your job is to:

1. Read and internalize the design below.
2. Point out any obvious conflicts or missing decisions.
3. Produce a **phased task list** to scaffold v2 so that we can open the app and it *looks* like Anvil & Loom could work, even with placeholders.
4. Propose a **file/folder skeleton** for v2 (React + Electron) consistent with this design.

Focus on architecture, state flows, and UI layout. Implementation details can come later.

---

## Vision (short)

Anvil & Loom is a **story-first TTRPG engine**. It turns every roll, table, and interpretation into persistent **Result Cards** that can be:

* Viewed as a live log in the app
* Embedded into **Journal Entries** as part of the campaign record

The app is:

* **Vault-like** (Obsidian-style): files on disk, no DB
* **Tool-driven**: Dice, Environments, Oracles, AI, etc. in a right-hand tool rail
* **Result-centered**: everything important funnels into Result Cards

Target users: solo players, GMs, worldbuilders, authors.

---

## Tapestries & Entries

**Tapestry**

* A **single folder on disk**, like an Obsidian vault.
* Everything under that root is part of the Tapestry.
* Left pane shows a **directory tree** of that folder.

**Entries**

* **Markdown entries**: `*.md`

  * Standard markdown content.
  * May include YAML frontmatter later (title, tags, aspect, domain, etc.).
  * Result Cards are stored as HTML/markdown blocks inside the file.
* **Canvas entries**: `*.canvas.json` (or similar)

  * JSON schema describing nodes/links/shapes/etc.
  * Rendered as a drawing surface in the center.

For v2 scaffolding:

* We need:

  * A basic **Tapestry tree** in the left pane (FS-backed or stubbed locally).
  * Ability to open a markdown entry and a canvas entry in the **center workspace** as tabs.
* It’s acceptable to stub the actual filesystem and use a fake in-memory Tapestry for now, as long as the UI looks right.

---

## Layout (three lanes)

**Top bar**

* Shows active Tapestry name (placeholder is fine).
* Space for a few global toggles later (e.g., theme, Log to Entry).

**Left lane – Tapestry**

* Directory tree view of the Tapestry.
* Clicking a `.md` opens a **Journal Entry tab** in the center.
* Clicking a `.canvas.json` opens a **Canvas tab** in the center.
* Minimal context menu (New Entry / New Canvas) can be stubbed.

**Center lane – Workspace**

Tabs across the top; each tab is either:

1. **Journal Entry**

   * Header with title + **Edit/View toggle**:

     * **Edit icon:** `Lucide Edit3`
     * **View icon:** `Lucide Eye`
     * Icons follow the global icon rules (see below).
   * For v2: **toggle only**, no split view.
   * Edit mode: markdown text editor.
   * View mode: markdown renderer that also renders Result Card HTML blocks as styled cards.

2. **Canvas Entry**

   * Header with title.
   * Central canvas area (can be a simple placeholder component for now).

**Right lane – Tools & Results**

Vertical layout:

1. **Tool Icon Rail** at the top:

   * Icons only, no text.
   * At minimum, define these tools:

     * Dice (`🎲` / Lucide dice icon)
     * Environments (Aspects/Domains)
     * Oracles (Action+Theme, Descriptor+Focus)
     * AI/Interpretation
   * Only **one active tool panel** at a time. Clicking an icon toggles its panel in/out.

2. **Active Tool Panel**

   * The currently selected tool fills this region.
   * For v2, tools can be mostly placeholders with minimal controls, but the layout must exist.

3. **Results history**

   * Scrollable stack of **Result Cards** (see below).
   * Can be open by default.

4. **Global Last Result**

   * Pinned at the very bottom of the right lane.
   * Always shows the most recent Result Card (global, not per-entry).
   * Updates whenever a new Result Card is logged.
   * Exists even if “log to Entry” is OFF.

---

## Tools (origins of results)

Each tool is an **origin** that can create Result Cards. They all follow the same pattern:

> Call Dice Engine (if needed) → interpret the result → call ResultCard Engine with `{header, result, content, source}`.

For v2, we need the following tools scaffolded:

1. **Dice Tool**

   * A **Dice Expression builder** only.
   * Builds expressions like `"2d6+1"`, `"1d100"`, `"1d6+1d8kh1"`, etc.
   * On “Roll”, calls the Dice Engine with the expression, gets back a `DiceRollResult`, converts it to `header/result/content`, and sends to ResultCard Engine.
   * Dice tool itself does not show the full narrative result; users read the outcome in Last Result / Results history.

2. **Environments Tool** (Aspects & Domains)

   * Browses environment tables, e.g.:

     * `Aspect: Blighted: Atmosphere`
     * `Domain: Catacombs: Locations`
   * Rolls `1d100` via Dice Engine, picks the correct row, converts to `header/result/content` and logs a Result Card.
   * Technical note: these are just JSON tables under the hood; v2 can hardcode or stub a couple of example tables.

3. **Oracles Tool**

   * Rolls generic oracles like:

     * Action + Theme
     * Descriptor + Focus
   * Same pattern: roll via Dice Engine, interpret row, log Result Card as an oracle.

4. **AI / Interpretation Tool**

   * For v2, this can be mostly placeholder UI (button + dummy output).
   * Concept:

     * Gathers a snapshot of recent oracle/environment Result Cards.
     * Calls an AI service.
     * Produces an interpretation as a Result Card:

       * `header`: `Interpretation: <name>`
       * `result`: snapshot summary
       * `content`: reasoning / bullet points
       * `source`: `"interpretation"`

---

## Dice Engine (single purpose)

Dice Engine has **one job**:

> Take a dice expression, return a **DiceRollResult** object.
> It does **not** create Result Cards or touch UI.

API idea:

```ts
async function rollDiceExpression(
  expression: string,
  options?: DiceOptions
): Promise<DiceRollResult>;
```

`DiceRollResult` should at least contain:

* The original expression
* Total (if applicable)
* Per-die/per-term results
* Metadata (successes, challenge dice, etc.)

3D Dice (@3d-dice/dice-box) will eventually plug in behind this API, but in v2 it’s fine to stub deterministic behavior.

All tools (Dice, Environments, Oracles) use this API.

---

## Result Cards & ResultCard Engine

Result Cards are **the event log**. Every meaningful outcome becomes a Result Card.

**Model**

```ts
type ResultSource =
  | "dice"
  | "table"
  | "oracle"
  | "interpretation"
  | "system"
  | "other";

interface ResultCard {
  id: string;
  timestamp: string;    // ISO
  header: string;       // e.g. "Dice Roll", "Aspect: Blighted: Atmosphere"
  result: string;       // Snapshot (what the user acts on)
  content: string;      // Meta (how we got there, breakdowns, raw values)
  source?: ResultSource;
  meta?: Record<string, unknown>;
}
```

**ResultCard Engine**

* Single helper, something like:

  ```ts
  function logResultCard(input: {
    header: string;
    result: string;
    content: string;
    source?: ResultSource;
    meta?: Record<string, unknown>;
  }): void
  ```

* Responsibilities:

  1. Build a full `ResultCard` (`id`, `timestamp`).
  2. Push it into a **Results store** (array of cards).
  3. If “Log to Entry” is enabled and a Journal Entry is active:

     * Append a corresponding HTML/markdown block to that Entry.

It does **not** know about dice, tables, or AI. It only logs.

**Results store**

* Holds `ResultCard[]` in order.
* Must support:

  * `getAll()` for Results history.
  * `getLast()` for Global Last Result.
  * `clear()` to reset the log.
* The store should be **persisted locally** (Electron: JSON file; web: localStorage) so that Results history and Last Result survive app restarts until the user clears them.

---

## UI: Icon & Color rules

**Tool icons**

Global rules:

* Lucide icons only.
* No text label inside button.
* No background, no border.
* 4px padding around icon.
* States expressed via **color + glow**:

  * Idle: muted slate color.
  * Hover: accent color + soft drop-shadow.
  * Active: near-white + stronger glow.
  * Focus (keyboard): stronger glow, no outline/border.

Sizes:

* `s` → 16px icon / 24px hitbox
* `m` → 24px icon / 32px hitbox
* `l` → 32px icon / 40px hitbox
* `xl` → 40px icon / 48px hitbox

**Color scheme (dark, high level)**

* Overall background: **dark slate blue** family.
* Panels: slightly lighter slate blue.
* Surfaces (cards, editors): another step lighter.
* Text: near-white with slate-muted secondary text.

Result Card header colors (by `source`):

* `dice` → deep steel blue header
* `table` / environments → dark green header
* `oracle` → teal/cyan header
* `interpretation` → purple/magenta header
* `system/other` → neutral slate header

All headers share consistent typography and layout; only hue differs.

---

## Plugin-friendly architecture (v2-level)

We do want plugins long-term, but v2 should focus on **clean extension seams**, not a full plugin marketplace.

Key points:

* **Tool registry**:
  Right-rail tools should be defined by a `ToolConfig[]` registry so new tools can be added without touching the core layout component.

* **Dice Engine**:
  Clean public API (`rollDiceExpression`) that plugins can call without reaching into internals.

* **ResultCard Engine**:
  Single logging helper that both core tools and future plugins can use to emit Result Cards.

* **Table provider abstraction**:
  `tableProvider` module that returns a list of available tables and can later be backed by plugin-provided content.

For now, just design the core code to **use these seams**. Actual plugin loader is future work.

---

## What I want from you now

1. **Review this design**

   * Call out any obvious contradictions or missing decisions that will bite us immediately.

2. **Propose a file/folder skeleton** for `anvil-and-loom-v2`, including:

   * `electron/` structure (minimal main process + preload)
   * `src/core/` modules for dice, results, tables, entries
   * `src/components/` layout for the three-lane UI and right-rail tools
   * A simple global state approach for Results + UI (doesn’t have to be Redux)

3. **Produce a phased task list** that gets us to:

   * A running Electron app
   * Left/center/right layout in place
   * Tapestry tree with fake or real files
   * Journal Entry tab with Edit/View toggle (icons only)
   * Right lane with:

     * Icon rail
     * Placeholder Dice / Environments / Oracles / AI panels
     * Results history panel
     * Global Last Result card
   * A stubbed Dice Engine and ResultCard Engine wired end-to-end, even if dice rolls are fake at first

4. Keep the answer under ~5,000–6,000 characters so I can use it directly as a plan.

Do **not** start writing code yet. I just want the skeleton and a concrete, ordered task list for scaffolding v2.
