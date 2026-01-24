Anvil & Loom

A Narrative Operating System

1. What Anvil & Loom Is

Anvil & Loom is a narrative operating system for tabletop roleplaying games, solo play, and structured creative storytelling.

It is not:

a virtual tabletop

a rules engine

a content platform

an AI storyteller

It is a procedural narrative engine where:

dice create pressure

tables introduce uncertainty

AI interprets consequence

canon accrues over time

Everything exists to support emergent narrative rather than scripted story.

2. Core Philosophy
2.1 Always Your Content

All content created in Anvil & Loom belongs to the user.

Prompts, rolls, AI interpretations, images, worlds, and campaigns are user-owned.

Content may be exported, published, or sold without restriction.

AI features do not train on user content unless explicitly opted into.

This principle is surfaced publicly and enforced technically.

2.2 No Silent Truth

Nothing becomes canon unless:

it is logged

it is traceable

it is justified by a roll, rule, or deliberate action

AI never:

alters canon silently

reveals hidden content without a trigger

retroactively changes outcomes

2.3 Never Waste a Roll

Every roll:

happens for a reason

produces a consequence

moves the narrative forward

There are no “dead results.”
Unclear results are deferred via timers, echoes, or latent panels.

3. Core Data Model (Conceptual)
3.1 Thread (Atomic Unit)

A Thread is the smallest unit of narrative truth.

A Thread represents:

a roll

an event

a consequence

a revelation

a decision

an escalation

All meaningful actions create or modify Threads.

3.2 Panels

Panels are structured markdown documents that collect Threads into meaningful groupings:

locations

factions

characters

relics

arcs

dungeons

Panels may contain:

summaries

metadata

links to Threads

AI-generated interpretations

visibility states

3.3 Visibility States

Content may exist in one of several states:

Hidden – exists but cannot be referenced directly

Foreshadowed – hinted at indirectly

Revealed – fully known and usable

Resolved – concluded but retained as canon

AI is bound by these states.

3.4 Timers, Echoes, Reverberations

Deferred consequences are tracked explicitly:

timers advance by sessions, actions, or conditions

echoes subtly distort future rolls or interpretations

reverberations resurface past Threads unexpectedly

This allows narrative pressure to accumulate naturally.

4. Dice Engine

The dice engine is authoritative.

Capabilities:

deterministic rolling (seeded, logged)

full roll metadata (why, when, context)

supports multiple dice schemas (2d6, 2d8, d100, etc.)

weighted and conditional modifiers

escalation-aware rolling

Rules:

no roll without a stated reason

every roll produces a Thread

no reroll fishing

AI must justify roll triggers

Dice do not exist for spectacle — they exist for resolution.

5. Random Table Engine

Random tables are control surfaces, not content dumps.

Table Types:

Aspects

Domains

Atmosphere

Locations

Accoutrements

Banes

Boons

Events

Connection Webs

Action + Aspect / Descriptor + Focus hybrids

Features:

weighted results

roll-twice logic

dynamic Weave composition

table chaining

explainable selection logic

AI may:

choose which tables to roll on

roll them

interpret outcomes

But must:

justify table choice

log results

respect visibility rules

6. Dungeon & Location Generation

The dungeon engine generates narrative topology, not battlemaps.

Output:

rooms as nodes

connections as pressure paths

tags (danger, resource, mystery)

latent threats

unresolved secrets

Dungeons are graphs of consequence, usable for:

solo play

theater-of-the-mind

GM prep

later VTT integration

No grids. No tokens. No tactical automation.

7. AI Integration (Interpretation Layer)

AI is not an author.
AI is an interpreter, referee, and archivist.

Core AI Roles:

interpret rolls and tables

summarize Threads and Panels

detect contradictions

escalate unresolved tension

propose latent content

manage deferred consequences

AI never:

decides outcomes without a roll or confirmation

overrides rules

invents mechanics

silently commits canon

7.1 AI Actions (Bounded)

Examples:

Interpret roll into scene beats

Summarize last session

Identify unresolved timers

Propose escalation

Create latent panel

Generate rumor version of events

Find contradictions in canon

These are discrete actions, not free chat.

8. MCP-Style Context Access

Anvil & Loom exposes the Tapestry through a permissioned context layer.

AI may access:

recent Threads

summaries

metadata

rulesets

tables

dungeon graphs

AI may not access:

hidden content unless allowed

raw vault by default

private notes without scope permission

All access is logged and auditable.

9. Ruleset Integration

Rulesets are:

read-only

modular

externalized

AI can:

consult mechanics

apply probabilities

suggest rolls

enforce fictional positioning

AI cannot:

invent rules

override mechanics

retcon outcomes

This enables a procedural referee, not a storyteller god.

10. Image Generation

Images are narrative memory anchors, not art assets.

Two Image Modes:
10.1 Impression Images

low detail

environmental

mood-focused

frequent

cheap

non-canonical

Used for:

locations

atmosphere

foreshadowing

10.2 Icon Images

style-locked

high identity

rare

canonical

explicit confirmation required

Used for:

named NPCs

legendary creatures

major revelations

Art Personas

Users select a Visual Narrator:

Old-School Engraving

Dark Painterly Fantasy

Atmospheric Impression

Mythic Symbolic

Field Sketch (optional)

Styles are campaign-scoped by default.

11. Autonomy Levels

Users control AI authority.

Manual – AI suggests; user executes

Assisted – AI auto-rolls oracles only

Full Referee – AI executes rules-triggered actions

Default is Assisted.

12. Session Flow

Player action or GM prompt

AI identifies uncertainty

Dice and/or tables are rolled

Results are interpreted

Threads are created

Timers updated

Canon advances

At end:

session recap generated

unresolved pressure summarized

export available

13. Platform & Storage

Desktop-first

Markdown-native

Obsidian-compatible vault structure

Local-first with optional sync

Full export always available

14. What Anvil & Loom Is Not

Explicitly out of scope:

tactical combat

grids, tokens, minis

multiplayer networking

real-time VTT features

system-specific automation

AI-authored novels

These may integrate later, but are not core.

15. Positioning Summary

Anvil & Loom is not a campaign manager.
It is a system that makes campaigns run themselves.

Anvil & Loom is not an AI DM.
It is a procedural referee bound by rules, rolls, and canon.

Anvil & Loom is not an art tool.
It uses images to anchor memory, not replace imagination.

16. One-Sentence Definition

Anvil & Loom is a narrative operating system where dice create pressure, AI interprets consequence, and canon accrues over time — always as your content.