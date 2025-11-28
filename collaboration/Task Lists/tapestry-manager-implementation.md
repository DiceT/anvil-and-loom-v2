# Tapestry Manager & Tree Editor - Task List

## Phase 1: Filesystem & Registry (Loomwright) ✅ COMPLETE

All infrastructure complete and verified.

---

## Phase 2: Tapestry Manager UI (Weaver) ✅ COMPLETE & VERIFIED

All UI components complete, tested, and verified by user.

**Bug Fixes:**
- [x] Fixed delete confirmation overlay click-through issue

---

## Phase 3: Tapestry Tree (Loomwright + Weaver) ✅ COMPLETE

### Loomwright Tasks ✅ COMPLETE
- [x] Verify `tapestry:loadTree` IPC handler (complete from Phase 1)
- [x] Verify file operation handlers (createEntry, createFolder, rename, deleteNode)
- [x] Verify order.json support (complete from Phase 1)
- [x] Create handoff documentation for Weaver

### Weaver Tasks ✅ COMPLETE
- [x] Create `src/components/tapestry/TapestryTree.tsx`
  - [x] Load tree on mount
  - [x] Recursive rendering
  - [x] Expand/collapse folders
  - [x] Empty state
  - [x] Loading state

- [x] Create `src/components/tapestry/TreeNode.tsx`
  - [x] Folder nodes with expand/collapse
  - [x] Entry nodes with click to open
  - [x] Indentation for hierarchy (16px per level)
  - [x] Hover states
  - [x] Active entry highlighting
  - [x] Right-click context menu integration

- [x] Create `src/components/tapestry/TreeContextMenu.tsx`
  - [x] Folder menu: New Entry, New Folder, Rename, Delete
  - [x] Entry menu: Rename, Delete
  - [x] Confirmation for destructive actions
  - [x] Refresh tree after operations

- [x] Create `src/components/tapestry/CategoryBadge.tsx`
  - [x] Color-coded badges (world/session/npc/lore/mechanics/other)
  - [x] Compact design

### Styling ✅
- [x] Match slate-900/950 theme
- [x] Tree node styling (32px height, hover states)
- [x] Active entry highlighting (purple border-left)
- [x] Context menu styling

### Integration ✅
- [x] Replace `LeftLane.tsx` with TapestryTree
- [x] Wire entry clicks to `useEditorStore.openEntry`
- [x] Refresh tree after create/rename/delete operations

### Verification ⏳ PENDING USER TESTING
- [ ] Tree loads when tapestry opens
- [ ] Folders expand/collapse
- [ ] Clicking entry opens it (stub OK for now)
- [ ] Context menu appears on right-click
- [ ] New Entry creates and refreshes tree
- [ ] New Folder creates and refreshes tree
- [ ] Rename works
- [ ] Delete works with confirmation
- [ ] Category badges display correctly
- [ ] Active entry is highlighted

### Skipped for v1
- ~~Drag & drop reordering~~ (Phase 3.5 or later)
- ~~Reveal in Explorer~~ (optional)
- ~~Duplicate Entry~~ (optional)

---

## Phase 4: Markdown Editor (Loomwright + Weaver) ✅ COMPLETE

### Loomwright Tasks ✅
- [x] Entry lifecycle in `useEditorStore` (already complete)
- [x] Tab management enhancements
- [x] Auto-save logic verification

### Weaver Tasks ✅
- [x] Install Milkdown dependencies
- [x] Create `MilkdownEditor.tsx`
- [x] Create `MarkdownViewer.tsx`
- [x] Create `EditorModeToggle.tsx`
- [x] Create `TapestryEditor.tsx`
- [x] Replace CenterLane stub with Editor
- [x] Fix Tailwind Typography plugin
- [x] Synchronize useTabStore and useEditorStore
- [x] Fix Milkdown re-creation bug
- [x] Verify clicking entries opens them
- [x] Test Edit/View mode switching
- [x] Test save functionality

---

## Phase 5: Result Card Integration (Loomwright + Weaver) ⏸️ WAITING

### Loomwright Tasks
- [ ] Result Card types (already in `tapestry.ts`)
- [ ] `resultCardEngine.ts` - Append/serialize/parse

### Weaver Tasks
- [ ] Create Result Card components
- [ ] Update MarkdownViewer for card rendering
- [ ] Wire to dice/oracle tools

---

## Overall Progress

### Phase Status
- [x] **Phase 1: Filesystem & Registry** ✅ **COMPLETE**
- [x] **Phase 2: Tapestry Manager UI** ✅ **COMPLETE & VERIFIED**
- [x] **Phase 3: Tapestry Tree** ✅ **COMPLETE**
- [x] **Phase 4: Markdown Editor** ✅ **COMPLETE**
- [ ] **Phase 5: Result Card Integration** ⏸️ **WAITING**

### Current Status
**✅ Phase 4 Complete!**

All editor components working:
- ✅ Click entries → opens in tabs
- ✅ Milkdown WYSIWYG editing
- ✅ Markdown viewer with prose styling
- ✅ Edit/View mode toggle with auto-save
- ✅ Ctrl+S keyboard shortcut
- ✅ GFM support (tables, task lists)

**Next:** Phase 5 - Result Card Integration

---

## Files Created

### Phase 1 ✅
- `src/types/tapestry.ts`
- `electron/ipc/tapestry.ts`
- `src/stores/useTapestryStore.ts`
- `src/stores/useEditorStore.ts`

### Phase 2 ✅
- `src/components/tapestry/TapestryManager.tsx`
- `src/components/tapestry/TapestryCard.tsx`
- `src/components/tapestry/CreateTapestryDialog.tsx`
- `src/components/tapestry/EditTapestryDialog.tsx`

### Phase 3 ✅
- `src/components/tapestry/TapestryTree.tsx`
- `src/components/tapestry/TreeNode.tsx`
- `src/components/tapestry/TreeContextMenu.tsx`
- `src/components/tapestry/CategoryBadge.tsx`
- `src/components/tapestry/MoveNodeDialog.tsx`

### Phase 4 ✅
- `src/components/tapestry/TapestryEditor.tsx`
- `src/components/tapestry/MilkdownEditor.tsx`
- `src/components/tapestry/MarkdownViewer.tsx`
- `src/components/tapestry/EditorModeToggle.tsx`

### Modified
- `electron/main.ts`
- `electron/preload.ts`
- `src/types/electron.d.ts`
- `src/components/layout/AppLayout.tsx`
- `src/components/tapestry/TapestryManager.tsx` (delete fix)
- `src/components/layout/CenterLane.tsx` (editor integration)
- `tailwind.config.js` (typography plugin)
- `src/styles/globals.css` (Milkdown styles)

---

**Estimated Progress: 80% complete (4 of 5 phases)**

**Next Actions:**
- Ready for Phase 5: Result Card Integration
- Or continue with other features/polish
