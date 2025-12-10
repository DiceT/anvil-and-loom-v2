# Anvil & Loom Architecture Notes

## Core Concepts

### The Weave
The **Weave** is a router for procedural generation. It acts as a master roll table where results point to *other* Oracle Packs (Aspects or Domains).
- **Structure**: Defined in `src/core/weave/weaveTypes.ts`.
- **Function**: Maps a roll (e.g., d20 or d100) to a specific `targetId` (an Aspect or Domain pack).
- **Usage**: Used to determine *which* flavor/theme is used for a roll. For example, rolling "Atmosphere" might roll on the Weave first to decide if it's a "Necrotic" atmosphere (Aspect A) or a "Mechanical" atmosphere (Aspect B).

### Tapestry & Story
The data model focuses on `StoryPage` (likely the file format for a session/journal).
- **StoryPage**: A container for a session.
    - Contains `blocks` (Text or Thread).
- **Thread**: A discrete unit of generated content (e.g. a "First Look" result card).
- **Text**: Standard markdown journaling.

### procedural Generation ("First Look")
Logic located in `src/core/tapestry/firstLook.ts`.
Generates a scene by mixing:
1.  **Location** (from selected Domain)
2.  **Manifestation** (from selected Aspect)
3.  **Atmosphere/Discovery** (Derived via rolling on the Weave to pick source packs)

## Observations
- The system is heavily data-driven (`TableRegistry`).
- It separates "Narrative" (Markdown) from "Mechanics/Oracles" (Threads).
