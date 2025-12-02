# Session Archive: Inline Thread Cards Implementation
**Date:** December 1, 2025
**Objective:** Implement inline Thread cards in the Entry editor using raw Milkdown.

## Overview
We successfully migrated the editor from `@milkdown/crepe` to a raw Milkdown setup to enable custom node plugins. We implemented a custom `threadCard` ProseMirror node that renders the existing `ThreadCard` React component inline, ensuring a seamless experience between writing and viewing results.

## Architecture

### 1. Custom Node (`threadCard`)
- **File:** `src/lib/editor/nodes/threadCardNode.ts`
- **Type:** Atomic block node
- **Attributes:** `threadId`, `threadData` (full JSON object)
- **Parsing:**
  - **DOM:** `<div data-thread-card ...>`
  - **Markdown:** ` ```result-card ... ``` ` (Backward compatibility)

### 2. React NodeView
- **File:** `src/lib/editor/views/ThreadCardNodeView.tsx`
- **Library:** `@prosemirror-adapter/react`
- **Function:** Renders `PanelThreadCard.tsx` inside the editor.
- **Key Feature:** Uses the exact same component as View Mode (`PanelThreadCard`) for pixel-perfect visual consistency.

### 3. Editor Setup
- **File:** `src/lib/editor/createEditor.ts`
- **Logic:**
  - Configures Milkdown with CommonMark, GFM, History, Listener.
  - **Usability Plugins:** Added `@milkdown/plugin-trailing` (trailing paragraph) and `prosemirror-gapcursor` (cursor between blocks).
  - **Source Mode:** Disables `threadCardNode` plugin to allow raw JSON editing.

### 4. React Wrapper
- **File:** `src/components/tapestry/MilkdownEditor.tsx`
- **Logic:**
  - Manages editor lifecycle.
  - **Stability Fix:** Uses `lastEmittedMarkdown` ref to prevent update loops.
  - **Race Condition Fix:** Implemented `isMounted` check and explicit DOM clearing to prevent duplicate editors.
  - **Insertion:** Exposes `insertThreadCard` command via `useEditorStore`.

## Key Changes & Fixes

### Features
- **Raw Milkdown Migration:** Full control over plugins and nodes.
- **Source Mode:** View and edit raw Markdown/JSON (Code icon).
- **Inline Thread Cards:** Rendered directly in the editor.
- **Improved Usability:** Gap cursor and trailing paragraph support.

### Fixes
- **Visual Consistency:** Edit Mode cards now look identical to View Mode cards (padding, margins, component usage).
- **Persistence:** Fixed "First Look" persistence issue by ensuring deleted panels are closed in the editor.
- **Stability:** Fixed race condition causing duplicate editors.
- **Runtime:** Fixed `prose is not a function` error by correctly registering `gapCursor`.

## Current Status
- **Implementation:** Complete.
- **Verification:** User verified all features and fixes.
- **Documentation:** CHANGELOG updated.
