# Anvil & Loom

> **A focused storytelling engine and desktop application  
> for journaling, dice rolling, and narrative management.**

Anvil & Loom is a system-agnostic storytelling framework and desktop application.  
It's built for solo players and GMs who want a focused tool for running dice rolls, managing journals, and capturing their stories.

- As a **system**, Anvil & Loom gives you a structure for narrative threads, dice rolling, and story management.
- As an **application**, it's a focused desktop tool for rolling dice, managing sessions, and capturing everything as you play.

---

## Table of Contents

1. [Core Concepts](#core-concepts)
   - [Tapestries](#tapestries)
   - [Panels](#panels)
   - [Threads](#threads)
   - [Tags](#tags)
   - [Bookmarks](#bookmarks)
2. [Anvil & Loom as a Storytelling System](#anvil--loom-as-a-storytelling-system)
   - [The Narrative Loop](#the-narrative-loop)
   - [Thread Management](#thread-management)
3. [Anvil & Loom as an Application](#anvil--loom-as-an-application)
   - [Architecture & Tech Stack](#architecture--tech-stack)
   - [Core Features](#core-features)
   - [User Interface Layout](#user-interface-layout)
4. [Example Playflows](#example-playflows)
   - [Solo Session](#solo-session)
   - [GM-Led Campaign Support](#gmled-campaign-support)
5. [Getting Started (Repo)](#getting-started-repo)
6. [Contributing](#contributing)
7. [License](#license)

---

## Core Concepts

### Tapestries

A **Tapestry** is a world, campaign, or ongoing project.

- Stored as a **folder / tree** of related content.
- Holds your sessions, notes, and generated material.
- In the app, a Tapestry is the primary context you open and work in.

Think of a Tapestry as *"the whole show"*—setting, campaign, and long-term story threads.

---

### Panels

Inside a Tapestry, you create **Panels** (formerly called "Entries").

- A Panel is a **single document**: a session log, location, character, faction, region, dungeon level, etc.
- Panels are written in Markdown via a rich editor.
- Dice results and other outputs can be appended directly into Panels.

Panels are where the **story lives** once the dust settles: the cleaned-up record of what happened.

---

### Threads

**Threads** (formerly "Result Cards") represent *moments*.

Each Thread captures a single unit of resolution, such as:

- A dice roll result
- A note or observation
- An AI interpretation or ruling
- A small cluster of related outcomes

Threads are:

- **Color-coded** by type (dice, note, interpretation, etc.).
- **Stacked** in a timeline as you play.
- **Attachable** to Panels (e.g., "append this Thread to the current Panel").

Think of Threads as the **town criers**: they announce what happened. Panels are the **historians** who later decide what that meant.

---

### Tags

**Tags** provide flexible organization for your content:

- Tag Panels to categorize and filter them (e.g., "session", "location", "character", "npc")
- Tag Threads to mark important moments (e.g., "combat", "discovery", "plot-point")
- Use tags to quickly find and reference related content across your Tapestry

Tags help you create a personalized organizational system that matches your storytelling style.

---

### Bookmarks

**Bookmarks** let you quickly navigate to important content:

- Bookmark any Panel for instant access
- Bookmarked Panels appear in a dedicated section for quick reference
- Useful for frequently referenced locations, NPCs, or key story moments

Bookmarks help you maintain quick access to the most important parts of your story.

---

## Anvil & Loom as a Storytelling System

### The Narrative Loop

At its core, Anvil & Loom is a **narrative loop**:

1. **Roll Dice**  
   - Use the 3D dice engine to generate random outcomes.
   - Build complex dice expressions or use preset templates.

2. **Create a Thread**  
   - Capture the raw dice result.
   - Optionally include a short human or AI interpretation.
   - Add notes about what this means for your story.

3. **Apply It to the Fiction**  
   - Interpret the result in context.
   - Decide what the characters encounter, what changes, or what becomes true.

4. **Log to a Panel**  
   - Append Threads into your current session or location Panel.
   - Refine later into fully written narrative if you like.

This loop repeats every time you:

- Make a dice roll
- Have a significant moment in the story
- Need to record an important decision or outcome

---

### Thread Management

The system is designed with **flexible narrative capture** in mind:

- **Thread Types**: Dice results, notes, interpretations, and more
- **Color Coding**: Visual distinction between different types of threads
- **Timeline View**: See your story unfold chronologically
- **Filtering**: Focus on specific types of threads when needed
- **Panel Integration**: Seamlessly append threads to your narrative documents

The journal (Panels + Threads) becomes a living map of your story's progression.

---

## Anvil & Loom as an Application

### Architecture & Tech Stack

Anvil & Loom is a **desktop application** built with:

- **Electron + Vite** – cross-platform desktop shell
- **React + TypeScript** – UI and application logic
- **State management** (e.g., Zustand or similar)
- **Markdown / rich-text editor** (Milkdown) – for Panels
- **3D Dice Engine** – for immersive dice rolling

The goal: a focused, offline-friendly tool that feels more like a **journal + dice console** than a full VTT.

---

### Core Features

- **Tapestry Manager**
  - Open a Tapestry (project folder).
  - Navigate Panels via a tree view (sessions, locations, characters, etc.).
  - Create, rename, and organize Panels.

- **Panel Editor**
  - Rich Markdown editor (Milkdown) for writing and polishing your narrative.
  - Append Threads (roll results) directly into the current Panel.
  - Toggle between edit and read modes.

- **3D Dice Tray**
  - Expression builder for custom dice rolls.
  - 3D dice visualization for immersive rolling experience.
  - Supports common roll types and advanced templates, such as:
    - Standard rolls (e.g., `2d6+2`, `1d20+5`)
    - Challenge / opposed rolls
    - Dice pools
    - Degradation rolls
    - Exploding dice
  - One-click templates for frequently used patterns (e.g., challenge rolls, pools).

- **Result Threads**
  - Every roll can create a Thread.
  - Threads display:
    - Dice expression and result
    - Optional notes / interpretation
  - Color-coded headers distinguish:
    - Dice results
    - Notes
    - Interpretations / rulings
  - Threads can be:
    - Viewed in a timeline
    - Filtered by type
    - Appended to Panels

- **Tag System**
  - Tag Panels for organization (e.g., "session", "location", "character")
  - Tag Threads to mark important moments
  - Filter and search by tags
  - Create a personalized organizational system

- **Bookmark System**
  - Bookmark important Panels for quick access
  - Quickly navigate to frequently referenced content
  - Manage bookmarks from the Tapestry tree

- **Session Management**
  - Track sessions within your Tapestry
  - Organize content by session
  - Maintain a clear timeline of your story

- **AI Integration (Optional)**
  - The app is structured so an AI assistant can:
    - Propose interpretations for Threads.
    - Help generate narrative content.
    - Summarize Panels or sessions.
  - AI is **optional**—the system works entirely offline if you stick to dice + manual notes.

---

### User Interface Layout

The UI is designed around a **three-lane** layout:

1. **Left Pane – Tapestry Tree**
   - Tapestry and Panel navigator.
   - Shows your folder and document structure.
   - Entry point for opening Panels and switching context.
   - Includes bookmarks section for quick access.

2. **Center Pane – Panel Editor / Viewer**
   - The main document area.
   - Markdown or rich-text editor for the active Panel.
   - Where you write, revise, and read your story.

3. **Right Pane – Dice Tray & Threads**
   - Dice expression builder and roll controls.
   - Result Threads timeline:
     - See the last N rolls at a glance.
     - Tag interesting results and append them into Panels.
   - Thread filtering and management tools.

---

## Example Playflows

### Solo Session

Create a Tapestry for your campaign world.

Open a Panel for "Session 01 – The Beginning."

Roll dice when needed:

- Make ability checks
- Resolve combat
- Determine random outcomes

Generate Threads for each roll:

- Log dice results
- Optionally jot a quick interpretation
- Add notes about what this means for the story

Append key Threads to the Panel and write a few narrative sentences connecting them.

Repeat, letting the dice guide the story until the session naturally comes to a close.

Over time, your Panel history becomes a written chronicle of an emergent campaign built from your dice rolls and narrative choices.

---

### GM-Led Campaign Support

For a group game:

Use Anvil & Loom as a GM console during live play.

Open Panels for the session, key locations, and NPCs.

When dice need to be rolled:

- Use the 3D dice tray for visible rolls
- Make hidden rolls behind the screen
- Record results as Threads

Show only the interpreted fiction to players; keep Threads and raw rolls on your screen.

After the session, refine Panels into cleaner logs using the stored Threads as receipts.

This setup gives you the flexibility of improv with the structure of a robust dice engine and a permanent record of what actually happened.

---

## Getting Started (Repo)

Note: Exact commands depend on the final package.json in this repo.
The steps below describe the typical workflow; adjust script names as needed.

### Prerequisites

- Node.js (LTS recommended)
- pnpm, npm, or yarn (project is optimized for pnpm)
- Git (for cloning the repository)

### Installation

```bash
# Clone the repo
git clone <repo-url> anvil-and-loom
cd anvil-and-loom

# Install dependencies (example with pnpm)
pnpm install
```

### Running in Development

Check package.json for dev scripts; common patterns:

```bash
# Start the dev build (example)
pnpm dev           # or: pnpm electron:dev, pnpm start, etc.
```

Once running, the Electron window should open with:

- Tapestry tree on the left
- Panel editor in the center
- Dice tray and Threads on the right

### Building for Production

```bash
# Build the application (example)
pnpm build         # or: pnpm electron:build
```

This will produce platform-specific binaries or installers, depending on the configured tooling.

---

## Contributing

Contributions are welcome, especially in the following areas:

- UI/UX improvements, accessibility tweaks, and layout refinements
- Additional dice roll templates and presets
- Enhanced thread management features
- Documentation: tutorials, example campaigns, and guided playthroughs
- Performance optimizations and bug fixes

Before submitting PRs:

- Check open issues and the Feature Backlog for overlap.
- Follow existing code style and TypeScript patterns.
- Ensure all changes are compatible with the current feature set.

---

## License

TODO: Add license details here (MIT, proprietary, or other).
Until this is specified, treat the repository as all-rights-reserved and request permission before redistributing.

---

Anvil & Loom aims to be that rare thing:
a tool that gets out of the way and lets the dice, your imagination, and your own curiosity take the lead.
