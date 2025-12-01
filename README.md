# Anvil & Loom

> **An exploration-first storytelling engine and desktop app  
> for journaling, oracles, and procedural worlds.**

Anvil & Loom is a system-agnostic exploration framework and desktop application.  
It’s built for solo players and GMs who want their worlds to **unfold at the table**, not in a 200-page pre-scripted campaign.

- As a **system**, Anvil & Loom gives you a structure for oracles, exploration, and emergent stories.
- As an **application**, it’s a focused desktop tool for running those oracles, managing journals, and capturing everything as you play.

---

## Table of Contents

1. [Core Concepts](#core-concepts)
   - [Tapestries](#tapestries)
   - [Panels](#panels)
   - [Threads](#threads)
   - [Aspects & Domains](#aspects--domains)
   - [Oracles & Tables](#oracles--tables)
   - [The Weave](#the-weave)
2. [Anvil & Loom as an Exploration System](#anvil--loom-as-an-exploration-system)
   - [Exploration Loop](#exploration-loop)
   - [Never Waste a Roll](#never-waste-a-roll)
   - [Echoes, Reverberations & the Connection Web](#echoes-reverberations--the-connection-web)
3. [Anvil & Loom as an Application](#anvil--loom-as-an-application)
   - [Architecture & Tech Stack](#architecture--tech-stack)
   - [Core Features](#core-features)
   - [User Interface Layout](#user-interface-layout)
4. [Data & Table Structure](#data--table-structure)
   - [RollTables Schema](#rolltables-schema)
   - [Aspects & Domains in Practice](#aspects--domains-in-practice)
5. [Example Playflows](#example-playflows)
   - [Solo Hex-Crawl / Journey](#solo-hexcrawl--journey)
   - [GM-Led Campaign Support](#gmled-campaign-support)
6. [Getting Started (Repo)](#getting-started-repo)
7. [Contributing](#contributing)
8. [License](#license)

---

## Core Concepts

### Tapestries

A **Tapestry** is a world, campaign, or ongoing project.

- Stored as a **folder / tree** of related content.
- Holds your sessions, maps, notes, and generated material.
- In the app, a Tapestry is the primary context you open and work in.

Think of a Tapestry as *“the whole show”*—setting, campaign, and long-term story threads.

---

### Panels

Inside a Tapestry, you create **Panels** (formerly called “Entries”).

- A Panel is a **single document**: a session log, location, character, faction, region, dungeon level, etc.
- Panels are written in Markdown via a rich editor.
- Dice results and oracle outputs can be appended directly into Panels.

Panels are where the **story lives** once the dust settles: the cleaned-up record of what happened.

---

### Threads

**Threads** (formerly “Result Cards”) represent *moments*.

Each Thread captures a single unit of resolution, such as:

- A dice roll result
- An oracle/table result
- An AI interpretation or ruling
- A small cluster of related outcomes

Threads are:

- **Color-coded** by type (dice, table, oracle, interpretation, etc.).
- **Stacked** in a timeline as you play.
- **Attachable** to Panels (e.g., “append this Thread to the current Panel”).

Think of Threads as the **town criers**: they announce what the dice and tables said. Panels are the **historians** who later decide what that meant.

---

### Aspects & Domains

Anvil & Loom separates *tone* from *place*:

- **Aspects** describe the *feel* or *state* of an environment  
  (Haunted, Profane, Overgrown, Civilized, Ancient, etc.).
- **Domains** describe the *physical type* of environment  
  (Forest, Ruins, Temple, Coast, Dungeon, etc.).

You explore combinations like:

- *Haunted Forest*
- *Profane Temple*
- *Ancient Coastline*
- *Overgrown Ruins*

Each Aspect/Domain pair can have its own set of subtables for Atmosphere, Locations, Banes, Boons, etc.

---

### Oracles & Tables

**Oracles** are structured random tables defined in JSON and surfaced through the app:

- Generic oracles like **Action**, **Theme**, **Descriptor**, **Focus**.
- Aspect-flavored tables (e.g., Haunted Atmosphere, Profane Banes).
- Domain-flavored tables (e.g., Forest Locations, Ruins Atmosphere).
- Travel events, cemetery tables, wild events, and more.

Oracles are not rigid encounter lists. Each result is a **prompt** designed to be interpreted in context, often 4–10 evocative words.

---

### The Weave

**The Weave** is the exploration engine that ties everything together.

- It’s a dynamic, usually d10-based table that lists **Aspects, Domains, and Oracles** relevant to the current region.
- Each entry has a **weight**, representing how likely that feature is to show up.
- Rolling on The Weave tells you **which Aspect/Domain (and/or oracle)** to use *next*.

Examples:

- *1–3: Haunted Forest*
- *4–5: Overgrown Forest*
- *6–7: Profane Temple*
- *8: Wild Travel Event*
- *9: Action + Theme*
- *10: Descriptor + Focus*

The Weave ensures that exploration feels **coherent, weighted, and emergent**, not just noise from unrelated tables.

---

## Anvil & Loom as an Exploration System

### Exploration Loop

At its core, Anvil & Loom is an **exploration loop**:

1. **Consult The Weave**  
   - Roll to determine which Aspect, Domain, or oracle is currently in focus.

2. **Roll on the Relevant Oracle(s)**  
   - Atmosphere, Locations, Banes, Boons, Travel Events, etc.
   - Possibly also Action + Theme, Descriptor + Focus, or other oracles.

3. **Create a Thread**  
   - Capture the raw dice result(s) and table prompt(s).
   - Optionally include a short human or AI interpretation.

4. **Apply It to the Fiction**  
   - Interpret the prompt in context.
   - Decide what the PCs encounter, what changes, or what becomes true.

5. **Log to a Panel**  
   - Append Threads into your current session or location Panel.
   - Refine later into fully written narrative if you like.

This loop repeats every time you:

- Enter a new area
- Travel through dangerous ground
- Search, Scout, Delve, or otherwise poke the unknown

---

### Never Waste a Roll

Anvil & Loom follows a simple golden rule:

> **Never waste a roll.**

If you roll something that doesn’t immediately fit:

- **Bank it**: mark it as a pending effect on a narrative timer.
- **Echo it later**: let it resurface in a different place or time.
- **Let it shape the world**, even if indirectly.

This principle keeps the world feeling *consequential*—randomness isn’t disposable, it’s foreshadowing.

---

### Echoes, Reverberations & the Connection Web

The system is designed with **long-term emergent structure** in mind:

- **Echoes**: Variants or distortions of previous results that subtly recur.
- **Reverberations**: Deferred consequences that trigger later when a condition is met or a timer expires.
- **Connection Web**: Named elements (locations, relics, projects, anomalies, factions, etc.) that can be re-rolled and revisited, tying distant events together.

Not all of these are fully implemented in the app yet, but the exploration system is built to support them:

- Tables can reference **Connection Web** results.
- Doubles or special roll ranges can trigger **Echo** or **Reverberation** behavior.
- The journal (Panels + Threads) becomes a living map of recurring motifs and entities.

---

## Anvil & Loom as an Application

### Architecture & Tech Stack

Anvil & Loom is a **desktop application** built with:

- **Electron + Vite** – cross-platform desktop shell
- **React + TypeScript** – UI and application logic
- **State management** (e.g., Zustand or similar)
- **Markdown / rich-text editor** – for Panels
- **JSON-driven oracles** – loaded as RollTables

The goal: a focused, offline-friendly tool that feels more like a **journal + oracle console** than a full VTT.

---

### Core Features

- **Tapestry Manager**
  - Open a Tapestry (project folder).
  - Navigate Panels via a tree view (sessions, locations, characters, etc.).
  - Create, rename, and organize Panels.

- **Panel Editor**
  - Rich Markdown editor for writing and polishing your narrative.
  - Append Threads (roll results) directly into the current Panel.
  - Toggle between edit and read modes.

- **Dice Tray**
  - Expression builder for custom dice rolls.
  - Supports common roll types and advanced templates, such as:
    - Standard rolls (e.g., `2d6+2`, `1d20+5`)
    - Challenge / opposed rolls
    - Dice pools
    - Degradation rolls
    - Exploding dice
  - One-click templates for frequently used patterns (e.g., challenge rolls, pools).

- **Result Threads**
  - Every roll and oracle result can create a Thread.
  - Threads display:
    - Dice expression and result
    - Table name and rolled prompt
    - Optional notes / interpretation
  - Color-coded headers distinguish:
    - Dice results
    - Table results
    - Oracle results
    - Interpretations / rulings
  - Threads can be:
    - Viewed in a timeline
    - Filtered by type
    - Appended to Panels

- **Table / Oracle System (The Forge)**
  - Load RollTables from JSON files.
  - Tag tables (e.g., `["aspect", "haunted"]`, `["domain", "forest"]`, `["oracle", "action"]`).
  - Search and pick tables via a **Table Picker**.
  - Use a **Table Editor** to create, clone, and modify tables via a form-based UI:
    - Edit metadata (name, tags, description, category).
    - Edit rows (roll ranges and prompts).
    - Add/remove rows, with auto-add on tabbing past the last cell.

- **The Weave Integration**
  - Build Weave tables that reference Aspects, Domains, and Oracles.
  - Roll The Weave to decide *what kind of* oracle to consult next.
  - Change Weaves as the party moves into different regions or layers of the world.

- **AI-Friendly Workflow (Optional)**
  - The app is structured so an AI assistant can:
    - Propose interpretations for Threads.
    - Help generate tables.
    - Summarize Panels or sessions.
  - AI is **optional**—the system works entirely offline if you stick to dice + tables.

---

### User Interface Layout

The UI is designed around a **three-lane** layout:

1. **Left Pane – Tapestry Tree**
   - Tapestry and Panel navigator.
   - Shows your folder and document structure.
   - Entry point for opening Panels and switching context.

2. **Center Pane – Panel Editor / Viewer**
   - The main document area.
   - Markdown or rich-text editor for the active Panel.
   - Where you write, revise, and read your story.

3. **Right Pane – Dice Tray & Threads**
   - Dice expression builder and roll controls.
   - Result Threads timeline:
     - See the last N rolls at a glance.
     - Tag interesting results and append them into Panels.
   - In future, will host tools like Echo/Reverberation timers and Connection Web views.

---

## Data & Table Structure

### RollTables Schema

Oracles and tables follow a shared JSON schema (simplified here):

```ts
interface ForgeTableRow {
  floor: number;
  ceiling: number;
  result: string;
  // optional extras (metadata, flags, etc.)
  [key: string]: any;
}

interface RollTable {
  sourcePath: string;
  category?: string;        // e.g. "Aspect", "Domain", "Oracle"
  name?: string;            // e.g. "Haunted: Atmosphere"
  tags: string[];           // e.g. ["aspect", "haunted", "atmosphere"]
  summary?: string;
  description?: string;
  headers: string[];        // usually ["Roll", "Result"]
  tableData: ForgeTableRow[];
  maxRoll: number;          // usually 100
  oracle_type?: string;     // e.g. "Atmosphere", "Locations", "Banes", "Boons"
  icon?: string;            // optional UI icon
  source?: { title: string; page?: number };
}

Key points:

Contiguous ranges: floor/ceiling lines cover the entire roll range with no gaps or overlaps.

Prompts, not prescriptions: result is an evocative phrase, not a fully scripted scene.

Macros: some results can signal “roll on another table” or “use a global oracle” (e.g., Action + Theme, Descriptor + Focus, Connection Web).

Aspects & Domains in Practice

For each Aspect and Domain, Anvil & Loom defines a small set of core subtables, such as:

Atmosphere – sensory and emotional texture of the scene.

Locations / Manifestations – points of interest, chambers, features, or strange manifestations.

Banes – dangers, traps, hostile forces, or negative turns.

Boons – opportunities, treasures, allies, or positive turns.

When combined via The Weave, these give you a procedural but coherent experience of moving through:

Haunted forests

Overgrown ruins

Profane cemeteries

Savage wildlands

Civilized but treacherous roads

And whatever else you define

Everything is driven by data, so you can extend or replace any set of tables without touching application code.

Example Playflows
Solo Hex-Crawl / Journey

Create a Tapestry for your campaign world.

Set up a Weave for the current region:

Haunted Forest (weight 4)

Overgrown Forest (weight 3)

Travel Events (weight 2)

Action + Theme (weight 1)

Open a Panel for “Session 01 – Into the Pines.”

Roll The Weave when the party travels or investigates.

Consult the indicated oracle(s):

Haunted Atmosphere

Forest Locations

Wild Travel Events

Etc.

Generate Threads for each roll:

Log dice and table results.

Optionally jot a quick interpretation.

Append key Threads to the Panel and write a few narrative sentences connecting them.

Repeat, letting the prompts guide the journey until the session naturally comes to a close.

Over time, your Panel history becomes a written chronicle of an emergent campaign built from Aspects, Domains, and oracles.

GM-Led Campaign Support

For a group game:

Use Anvil & Loom as a GM console during live play.

Open Panels for the session, key locations, and NPCs.

When improvisation is needed:

Roll The Weave to see what type of complication or discovery appears.

Pull from Aspects/Domains relevant to the current area.

Show only the interpreted fiction to players; keep Threads and raw rolls on your screen.

After the session, refine Panels into cleaner logs using the stored Threads as receipts.

This setup gives you the flexibility of improv with the structure of a robust oracle engine and a permanent record of what actually happened.

Getting Started (Repo)

Note: Exact commands depend on the final package.json in this repo.
The steps below describe the typical workflow; adjust script names as needed.

Prerequisites

Node.js (LTS recommended)

pnpm, npm, or yarn (project is optimized for pnpm)

Git (for cloning the repository)

Installation
# Clone the repo
git clone <repo-url> anvil-and-loom
cd anvil-and-loom

# Install dependencies (example with pnpm)
pnpm install

Running in Development

Check package.json for dev scripts; common patterns:

# Start the dev build (example)
pnpm dev           # or: pnpm electron:dev, pnpm start, etc.


Once running, the Electron window should open with:

Tapestry tree on the left

Panel editor in the center

Dice tray and Threads on the right

Building for Production
# Build the application (example)
pnpm build         # or: pnpm electron:build


This will produce platform-specific binaries or installers, depending on the configured tooling.

Contributing

Contributions are welcome, especially in the following areas:

New Aspects and Domains (with full subtables)

The Weave patterns for different genres (fantasy, sci-fi, horror, etc.)

Additional oracle packs (travel events, factions, downtime, etc.)

UI/UX improvements, accessibility tweaks, and layout refinements

Documentation: tutorials, example campaigns, and guided playthroughs

Before submitting PRs:

Check open issues and the Feature Backlog for overlap.

Follow existing code style and TypeScript patterns.

Keep table JSON strictly conformant to the RollTables schema.

License

TODO: Add license details here (MIT, proprietary, or other).
Until this is specified, treat the repository as all-rights-reserved and request permission before redistributing.

Anvil & Loom aims to be that rare thing:
a tool that gets out of the way and lets the dice, the tables, and your own curiosity take the lead.