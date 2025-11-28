# Dev Doc: Global Settings & Crepe/Milkdown Editor Configuration

## 1. Purpose

We are:

1. Replacing the current **“Dice Settings”** entry point with a unified **“Settings”** UI.
2. Adding a **Global Settings Manager** with a left-hand “category” navigation (multi-page/settings tree).
3. Wiring the **Crepe/Milkdown editor** configuration to those settings so we can toggle editor features (plugins, behaviors) in real time.
4. Leaving these toggles in place long-term so users can customize the editor if we like how it feels.

Goal:  
Make the editor **feature-rich but configurable**, with per-feature switches in the Settings UI, while keeping the Dice Settings intact under a new “Dice” section.

---

## 2. High-Level UX

### 2.1 Entry Point

- Replace “**Dice Settings**” button with a **“Settings”** button.
- Clicking **Settings** opens a **Settings View** (modal or full-page route — same structure we’re already using for Dice Settings, expanded):

**Layout:**

- **Left Sidebar (Category Tree)**  
  - `General` (optional stub for later)  
  - `Dice`  
  - `Editor`  
  - (future: `Weave`, `Oracles`, etc.)

- **Right Pane (Category Panel)**  
  - Shows settings for currently selected category.

### 2.2 Category Behavior

- Clicking **Dice**:
  - Shows the **current Dice Settings UI** (reused/embedded in the new layout).
- Clicking **Editor**:
  - Shows **Editor Settings**:
    - Theme & appearance (Nord Dark, etc.)
    - Feature toggles for Crepe/Milkdown plugins / behaviors
    - A small “Developer / Advanced” section for dangerous toggles.

No “Apply” button needed if we can safely auto-save on change; otherwise we provide `Apply` + `Reset` per category.

---

## 3. Data Model

### 3.1 Global Settings Shape

Create or extend a centralized settings model (likely in Zustand or equivalent):

```ts
// One possible interface – adjust naming to match existing store patterns
export interface GlobalSettings {
  dice: DiceSettings;
  editor: EditorSettings;
  // future: weave: WeaveSettings; oracles: OracleSettings; etc.
}

export interface DiceSettings {
  // Existing fields – keep as-is, just nested under `dice`.
  // e.g., explosion rules, challenge dice color, log behavior, etc.
}

export interface EditorSettings {
  // Theme
  theme: "nord-dark" | "nord-light" | "crepe-dark" | "crepe-light" | "system";

  // Core markdown behavior
  enableCommonmark: boolean;     // default true, probably locked (see below)
  enableGfm: boolean;            // toggles GFM preset

  // Milkdown/Crepe plugins (user visible toggles)
  enableTables: boolean;         // plugin-table + GFM tables support
  enableTaskLists: boolean;      // from GFM preset
  enableStrikethrough: boolean;  // from GFM preset

  enableHistory: boolean;        // undo/redo
  enableClipboard: boolean;      // better copy/paste
  enableIndent: boolean;         // tab indent/outdent
  enableCursorEnhancements: boolean; // plugin-cursor

  enableTooltip: boolean;        // floating formatting tooltip
  enableSlashMenu: boolean;      // slash commands
  enableEmoji: boolean;          // emoji plugin
  enableUpload: boolean;         // images/attachments
  enablePrismHighlight: boolean; // syntax highlighting for code blocks
  enableTableControls: boolean;  // UI controls for table editing

  // Future collab (stub; can be visible but disabled)
  enableCollaboration: boolean;  // currently no-op / disabled warning

  // Editor behavior
  showToolbar: boolean;          // show/hide editor toolbar
  showInlineMarkdownHints: boolean; // e.g. show shortcut hints in tooltip
  syncOnChange: boolean;         // immediate persistence to Tapestry file vs delayed
  devModeOverrides: boolean;     // enable “dev only” experimental switches
}
Note: We can expose almost everything as a toggle, but:

enableCommonmark should default to true and probably be locked in the UI (or only under “Dev Mode”).

If we need to protect ourselves, some toggles can be visible only when devModeOverrides === true.

4. Editor Integration (Crepe/Milkdown)
4.1 Crepe Config Factory
We want a single function that takes EditorSettings and returns a fully configured Crepe/Milkdown instance (or config object):

ts
Copy code
import { crepe } from "@milkdown/crepe";
// import needed Milkdown plugins/presets here

export const createEditor = (element: HTMLElement, settings: EditorSettings) => {
  const editor = crepe({
    root: element,
    theme: settings.theme === "nord-dark" ? "nord-dark" : "nord-light", // map as needed
    // possibly other crepe options here
  });

  // Core presets
  if (settings.enableCommonmark) {
    editor.use(presetCommonmark());
  }

  if (settings.enableGfm) {
    editor.use(presetGfm({
      // can configure which GFM bits we actually expose if needed
    }));
  }

  // Core behavior
  if (settings.enableHistory) editor.use(pluginHistory());
  if (settings.enableClipboard) editor.use(pluginClipboard());
  if (settings.enableIndent) editor.use(pluginIndent());
  if (settings.enableCursorEnhancements) editor.use(pluginCursor());
  editor.use(pluginListener(/* attach onChange => global save */));

  // UX plugins
  if (settings.enableTooltip) editor.use(pluginTooltip());
  if (settings.enableSlashMenu) editor.use(pluginSlash(/* custom menu config */));
  if (settings.enableEmoji) editor.use(pluginEmoji());
  if (settings.enableUpload) editor.use(pluginUpload(/* upload handler */));
  if (settings.enablePrismHighlight) editor.use(pluginPrism(/* languages */));

  // Tables
  if (settings.enableTables || settings.enableTableControls) {
    editor.use(pluginTable(/* config for controls */));
  }

  // Collab – currently disabled or no-op
  if (settings.enableCollaboration) {
    // For now, either:
    // - no-op, or
    // - throw console warning: "Collaboration not implemented yet"
  }

  // Toolbar visibility can be handled via our wrapper UI,
  // not necessarily via Crepe itself:
  // show/hide toolbar component based on settings.showToolbar.

  return editor;
};
Key requirement:
The editor component should subscribe to EditorSettings from the global store and rebuild / reconfigure when relevant settings change.

Options:

Easiest: when certain toggles change (e.g. enableGfm), fully recreate the editor instance. For now that’s fine.

Later optimization: selectively reconfigure but not required for v1.

4.2 Listener Plugin Integration
We should use plugin-listener to:

Listen for markdownUpdated or equivalent events.

Dispatch updated markdown to the global Tapestry entry state (and then to disk).

Pseudo:

ts
Copy code
editor.use(
  pluginListener((ctx) => ({
    markdownUpdated(markdown) {
      // Push to Zustand store / Tapestry manager
      updateActiveEntryMarkdown(markdown);
      if (settings.syncOnChange) {
        saveEntryDebounced();
      }
    },
  }))
);
5. Settings UI: Editor Panel
5.1 Layout
In the Settings view, when Editor is selected:

Title: Editor Settings

Sections (stacked vertically):

Theme & Appearance

Markdown Features

Editor Behavior

Plugins & Extensions

Advanced / Developer

Each section has its own small header + description.

5.2 Controls
5.2.1 Theme & Appearance
Editor Theme

Control: dropdown

Options: Nord Dark, Nord Light, Crepe Dark, Crepe Light, System

Maps to EditorSettings.theme

Show Toolbar

Toggle: ON/OFF

Maps to showToolbar

5.2.2 Markdown Features
GitHub Flavored Markdown (GFM)

Toggle: enableGfm

Description: “Tables, task lists, and strikethrough support.”

Tables Enabled

Toggle: enableTables

Description: “Use markdown tables in the editor.”

Task Lists Enabled

Toggle: enableTaskLists

Strikethrough Enabled

Toggle: enableStrikethrough

Note: These are mostly logical toggles mapped to GFM + table plugin internals.

5.2.3 Editor Behavior
Undo/Redo History

Toggle: enableHistory

Enhanced Copy/Paste

Toggle: enableClipboard

Tab to Indent Lists

Toggle: enableIndent

Smart Cursor in Complex Blocks

Toggle: enableCursorEnhancements

Live Sync to Entry

Toggle: syncOnChange

Description: “Update Tapestry entry as you type (auto-save with debounce).”

5.2.4 Plugins & Extensions
Formatting Tooltip

Toggle: enableTooltip

Description: “Show a floating toolbar when selecting text.”

Slash Command Menu

Toggle: enableSlashMenu

Description: “Type / to insert blocks or special content.”

Emoji Support

Toggle: enableEmoji

File/Image Upload

Toggle: enableUpload

Description: “Paste or drag images/files into the editor.”

Code Block Highlighting

Toggle: enablePrismHighlight

Description: “Syntax highlighting for code blocks.”

Table Controls

Toggle: enableTableControls

Description: “Add/remove rows and columns from tables.”

5.2.5 Advanced / Developer
Visible when devModeOverrides === true OR under some “Show Advanced Settings” expander.

CommonMark Core

Toggle: enableCommonmark

Warning text: “Turning this off may break markdown behavior. Use only for testing.”

Experimental Collaboration

Toggle: enableCollaboration (disabled or shows note)

Text: “Requires future multi-user support; not implemented.”

Dev Mode Overrides

Toggle: devModeOverrides

Text: “Show experimental switches for internal testing.”

6. Settings UI: Dice Panel (Migration Plan)
6.1 What Changes
The actual Dice Settings fields don’t change.

We:

Move the Dice Settings UI into the new Settings view under Dice.

Ensure Dice Settings read/write from globalSettings.dice.

6.2 Implementation
Create a SettingsLayout component with:

Left nav

Right panel content area

Create DiceSettingsPanel

Wraps existing dice settings component, wired to globalSettings.dice.

Create EditorSettingsPanel

New component implementing the sections in 5.2, wired to globalSettings.editor.

Settings button:

Old: openDiceSettings()

New: openSettings("Dice") or openSettings("Editor") – up to UX preference.

7. State & Persistence
7.1 Store
Add globalSettings slice to our main store (Zustand or equivalent):

ts
Copy code
interface GlobalSettingsStore {
  settings: GlobalSettings;
  updateEditorSettings: (partial: Partial<EditorSettings>) => void;
  updateDiceSettings: (partial: Partial<DiceSettings>) => void;
  resetEditorSettings: () => void;
  resetDiceSettings: () => void;
}
Provide default settings (sane, opinionated):

ts
Copy code
const defaultEditorSettings: EditorSettings = {
  theme: "nord-dark",
  enableCommonmark: true,
  enableGfm: true,

  enableTables: true,
  enableTaskLists: true,
  enableStrikethrough: true,

  enableHistory: true,
  enableClipboard: true,
  enableIndent: true,
  enableCursorEnhancements: true,

  enableTooltip: true,
  enableSlashMenu: true,
  enableEmoji: true,
  enableUpload: false,          // off until media pipeline finalized
  enablePrismHighlight: false,  // can be enabled later
  enableTableControls: true,

  enableCollaboration: false,

  showToolbar: true,
  showInlineMarkdownHints: false,
  syncOnChange: true,
  devModeOverrides: false,
};
Persist to disk with existing app config mechanism (JSON config file per user, etc.).

7.2 Real-Time Toggling
When EditorSettings changes:

Either:

A) Completely teardown and recreate the editor instance; or

B) For simple toggles (like showToolbar) just update React state.

For v1, A is acceptable. We’re not editing 400k-word novels here.

8. Implementation Steps (For Weaver)
Global Settings Store

Add GlobalSettings, DiceSettings, EditorSettings interfaces.

Implement store slice with default values and persistence.

Settings Layout

New SettingsView or SettingsModal:

Left nav: General, Dice, Editor (General can be stub for now).

Right pane switching based on selected category.

Dice Settings Migration

Embed existing Dice Settings UI as DiceSettingsPanel.

Wire it to globalSettings.dice.

Editor Settings Panel

Implement layout described in section 5.2.

Wire each control to globalSettings.editor.

Crepe/Milkdown Integration

Implement createEditor(element, editorSettings) factory.

Editor component subscribes to editorSettings from store.

On relevant setting changes, rebuild editor instance.

Listener Hookup

Use plugin-listener to forward markdown changes into Tapestry entry state and autosave (respecting syncOnChange).

Dev/Advanced toggles

Hide advanced settings unless devModeOverrides is true or user expands an “Advanced” section.

Cleanup

Remove or repoint any old Dice Settings entry points to the new Settings UI.

9. Future Enhancements (Not Required Now)
Theme mapping to A&L color tokens (Weave brass, Oracle cyan, etc.).

Per-Tapestry editor overrides (e.g. different theme per Tapestry).

Proper collaboration support when we’re ready for multi-user campaigns.

Preset “Editor Profiles” (Minimalist, Rich, Writing-First, GM-Mode) that set batch toggles.