# Result Card Loop Blueprint (Draft)

Date: 2026-01-12
Author: Codex

## Purpose
The core loop is Result Card ? Reaction: tools emit a card, user writes/reacts, repeat. This doc captures the blueprint, mode-specific notes, and naming options.

## Loop Blueprint
- One-click creation: Dice tools emit cards with minimal input and sane defaults; remember recent expressions.
- Clear identity: Source-colored headers, concise titles (e.g., "Dice: 2d6+3"), timestamped, tagged with session/campaign.
- Append + cursor: Auto-append to the active entry (Session or chosen entry) and drop the cursor immediately after the card for a reaction paragraph.
- Reaction-first view: View mode shows collapsible cards with glanceable summary/result; Edit mode shows a stable placeholder block so cursor jumps don't break.
- Session focus: A "Current Session" pin ensures all card output goes to that entry unless overridden; simple toggle to redirect to another entry.
- Quick follow-ups: Inline buttons on cards for reroll/interpret/open-related.
- Fast navigation: Mini timeline/list of recent cards in the right pane; jump-to-card location in entry.
- Persistence: Save cards + layout to disk; reload restores Session pin, last entry, and card history.

## Mode-Specific Boosts
- GM/Campaign: Dashboard with current location, NPCs, active tracks/clocks, last 5 cards; quick "log to Session" toggle; templates for initiative/clock ticks.
- Player journaling: Gentle defaults (auto Session pin), inline "reflection" prompt after cards, clean history view for recap.
- Worldbuilding: Cards tagged by category; easy export of a card chain into a lore entry; filters by tag/source.

## Naming Options (Result Cards)
- Threads (recommended): fits Tapestry/Anvil & Loom; verbs work: "log a Thread", "append this Thread".
- Stitches: tactile; works as "stitch this in".
- Castings: nod to anvil and dice casting.
- Echoes: good if resurfacing past results is key.
- Beats: narrative beats you chain together.

## Quick wins to raise quality (toward 8-9/10)
1) Persist results + layout to disk; remove legacy IPC stubs from registration.
2) Add IPC/fs smoke tests (create/open/save/rename/delete entry, load tree) and surface errors in UI.
3) Polish cards: uniform theming, concise headers, one-click actions; tighten Milkdown/view handoff and cursor placement post-append.
4) Prune or quarantine unused 3D dice deps; document result logging contracts.
5) Provide 2-3 layout presets and a Session dashboard; avoid freeform layout sprawl.
