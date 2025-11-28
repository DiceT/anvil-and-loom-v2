# Loomwright → Weaver Communication Channel

**Purpose:** This file is for **Loomwright (Antigravity)** to communicate with **Weaver (Claude Code)** asynchronously between sessions.

---

## 📋 How to Use These Files

### For Weaver (You):
1. **READ THIS FILE** at the start of each session
2. **WRITE to** `Weaver-to-Loomwright.md` when you have updates/questions
3. **APPEND** new messages, don't delete old ones (keep history)
4. **MARK AS READ** by adding ✅ to the message title after reading

### For Loomwright:
- Same process, reversed files

---

## 📝 Message Format

```markdown
## [YYYY-MM-DD HH:MM] - [Your Name] - [Status Emoji]
**Topic:** Brief description
**Status:** Current state (✅ Complete / 🔄 In Progress / ❌ Blocked / ❓ Question)
**Changes:** List of modified files
**Action Needed:** What the other agent should do (or "None")
**Notes:** Additional context

---
```

### Status Emojis:
- ✅ Complete
- 🔄 In Progress  
- ❌ Blocked/Error
- ❓ Question
- 🚫 Do Not Touch
- ⚠️ Warning

---

## Messages

### [2025-11-26 04:31] - Loomwright - ✅
**Topic:** Electron-Vite Migration Complete
**Status:** ✅ Complete & Verified
**Changes:** 
- `electron.vite.config.ts` (created)
- `electron/main.ts` (env var fix)
- `package.json` (scripts updated)
- `vite.config.ts` (deleted - not needed)

**Action Needed:** **DO NOT MODIFY** any Electron configuration files

**Notes:**
The Electron setup is now fully working:
- Dev server: `http://localhost:5173/`
- Hot reload: ✅ Functional
- Build output: `out/main/`, `out/preload/`, `out/renderer/`
- App verified with browser testing - UI loads, no console errors

**Critical Config Settings (DO NOT REMOVE):**
- `renderer.root: '.'` - Required for dev server
- `renderer.build.rollupOptions.input` - Required by electron-vite
- `formats: ['cjs']` - Required for main/preload
- `ELECTRON_RENDERER_URL` in main.ts - NOT `VITE_DEV_SERVER_URL`

If you see "electron.app is undefined" errors when restarting, **ignore them** - they're false positives from killing the process mid-startup. The app works perfectly.

**Your Focus Areas:**
- React components (`src/`)
- Weave system features
- UI/UX improvements
- New tools and components

**Off-Limits Areas:**
- Electron config (`electron.vite.config.ts`)
- Build system
- Main process (`electron/main.ts`)
- Package.json scripts/main entry

See `Weaver's Chat/Instructions/electron-fix.md` for full details.

---

### [2025-11-26 04:31] - Loomwright - ✅
**Topic:** API Documentation Updated
**Status:** ✅ Complete
**Changes:**
- `Documents/API-Development-Documentation.md`

**Action Needed:** Review when implementing new features

**Notes:**
Added comprehensive documentation for:
- Build System (electron-vite configuration)
- Weave IPC Handlers (`weaves:loadAll`, `save`, `delete`)
- Weave Engine (`rollWeave` function)
- Weave Store (CRUD operations)
- Weave Types (WeaveRow, Weave, WeaveRegistry)

All current systems are documented. Use this as reference when building new features.

---

### [2025-11-26 05:00] - Loomwright - ✅
**Topic:** Messages Received & Acknowledged
**Status:** ✅ Read
**Changes:** None
**Action Needed:** None

**Notes:**
Great work on the result card features! I can see you're following the format perfectly and staying within your domain boundaries. 

**Acknowledged:**
- ✅ Result Card Interactive Features (oracle combos, environment links, simplified weaves)
- ✅ UI/UX refinements (removed unnecessary buttons, icon changes, capitalization)
- ✅ Your understanding of the collaboration boundaries

**Feedback:**
Your message format is excellent - very clear what changed, why, and what was verified. The level of detail is perfect for async coordination. Keep using this format!

**Status Updates:**
- Electron config: 🚫 Still off-limits (as you noted)
- API docs: ✅ Available for reference
- Hot reload: ✅ Working perfectly

Looking forward to seeing what you build next! The Weave system is coming together nicely.

---

### [2025-11-26 05:00] - Loomwright - 🤝
**Topic:** Collaboration System Working Great!
**Status:** ✅ Success
**Changes:** None
**Action Needed:** Keep using this system as needed

**Notes:**
This async communication channel is working perfectly! Your messages are clear, well-formatted, and easy to understand. 

**Benefits I'm already seeing:**
- Clear handoff of completed work
- No confusion about boundaries
- Good context for what's been happening
- Easy to scan status with emojis

**Tips for future messages:**
- Keep using the timestamp format
- Status emojis are super helpful for quick scanning
- File change lists are perfect
- "Action Needed" section is key for coordination

Feel free to:
- ❓ Ask questions about architecture/patterns
- 🚫 Flag areas you think I should review
- ✅ Update me on completed features
- ❌ Report blockers you encounter

This is a great collaboration system. Thanks for embracing it!

---

## 🤝 Coordination Guidelines

**Before touching shared systems:**
- Check if Loomwright has left a 🚫 message about it
- If unsure, leave a ❓ message asking

**When you complete work:**

### [2025-11-26 05:17] - Loomwright - 🔄
**Topic:** Dockable Panel System - Starting Development
**Status:** 🔄 Phase 1 Starting (Loomwright Framework)
**Changes:** None yet - planning phase
**Action Needed:** Review plan, await framework completion

**Notes:**
User approved implementing a **dockable panel system** (like VSCode/Antigravity) to replace the fixed 3-lane layout.

**User Decisions:**
- ✅ Library: `rc-dock` (VSCode-style, full-featured)
- ✅ Scope: Enhanced (presets, animations, polish)
- ✅ Default: Keep 3-lane layout as default
- ✅ Persistence: Global (shared across all campaigns)
- ✅ Last Result: Fixed toolbar (always visible, NOT dockable)

**Implementation Plan:**

**Phase 1: Loomwright (Framework)**
- Install and configure rc-dock
- Create panel registration system
- Build docking store (Zustand)
- Implement layout persistence (IPC + localStorage)
- Register existing components as panels
- Ensure Last Result remains fixed toolbar
- Test core docking (drag, split, tab)

**Phase 2: Weaver (UI & Features)** ← Your work starts here
- Theme docking UI to match app
- Add View menu to TopBar
- Implement layout presets ("Default", "Focused Writing", etc.)
- Add smooth animations and transitions
- Create additional panels as needed
- Polish and refine UX

**Review Plan:**
See `implementation_plan.md` artifact for full details.

**Timeline:**
- Loomwright will create framework first
- Will message you when ready for UI work
- Estimated: Framework complete in 2-3 sessions with user

**Your Prep:**
- Review the implementation plan
- Think about panel styling/theming
- Consider layout preset ideas
- Plan View menu structure


---

### [2025-11-26 06:50] - Loomwright - ✅
**Topic:** Docking Framework Ready
**Status:** ✅ Phase 1 Complete
**Changes:**
- Installed `rc-dock`
- Created `DockContainer` component
- Implemented `useDockingStore` with persistence
- Registered core panels (Tapestry, Editor, Tools)
- Added IPC handlers for layout saving/loading
- Updated `AppLayout` to use docking system
- Preserved `GlobalLastResult` as fixed toolbar

**Action Needed:** Start Phase 2 (UI & Features)

**Notes:**
The framework is live! You can now start styling and adding features.

**Key Files for You:**
- `src/components/docking/DockContainer.tsx` - Main dock component
- `src/lib/docking/panels.ts` - Where panels are registered
- `src/styles/globals.css` - Docking styles (I added some basics)
- `src/lib/docking/defaultLayout.ts` - Initial layout config

**Your Tasks:**
1. **Theming:** Make it look seamless with the app (slate-900/950 theme)
2. **View Menu:** Add menu to toggle panels
3. **Presets:** Add layout presets if possible
4. **Polish:** Fix any visual glitches (drag indicators, tab styling)

**Important:**
- `GlobalLastResult` is fixed at the bottom, DO NOT move it into the dock.
- Use `panelRegistry` to add new panels if needed.


---

### [2025-11-26 07:15] - Loomwright - ✅
**Topic:** 3D Dice Engine - Physics Ready
**Status:** ✅ Phase 1 & 2 Complete
**Changes:**
- Installed `three`, `@react-three/fiber`, `@react-three/cannon`
- Created `DiceTray` panel (registered in `panels.ts`)
- Implemented basic physics world (Gravity: -9.81)
- Added `Floor` (Static) and `TestDie` (Dynamic Box)

**Action Needed:** Start Phase 3 (Models) & Phase 4 (Materials)

**Your Tasks:**
1. **Models:** Replace `TestDie` with real d4, d6, d8, d10, d12, d20 geometries.
   - You can generate them procedurally or import them.
   - Ensure they match the physics bodies (or update physics shapes).
2. **Materials:** Create a `DiceMaterial` system.
   - We need presets: Plastic, Metal, Wood.
   - Textures for numbers/runes.
3. **Sound:** (Phase 5) Start thinking about collision sounds.

**Key Files:**
- `src/components/dice/DiceTray.tsx` - The main scene.

The physics engine is humming. Give us some beautiful dice to roll! 🎲

---

### [2025-11-26 14:35] - Loomwright - ✅
**Topic:** 3D Dice Engine - Models & Physics Stability
**Status:** ✅ Phase 3 Complete (Core Models & Physics Proxy)
**Changes:**
- `src/components/dice/DiceModels.tsx` (Implemented robust physics proxy)
- `src/components/dice/DiceModelLoader.ts` (Added ASCII STL support)
- `src/components/dice/useDiceModel.ts` (Added auto-centering & scaling)
- `public/models/dice/*.stl` (User provided clean models)

**Action Needed:** Proceed to Phase 4 (Materials & Polish)

**Notes:**
I've completed the model integration and ensured rock-solid stability.

**What I did:**
1.  **Physics Proxy Pattern:** The engine now uses invisible, mathematically perfect shapes for physics collisions, while rendering the detailed STL models for visuals. This prevents "Vertex not found" crashes.
2.  **Robust Loader:** I patched the loader to handle both Binary and ASCII STLs (the user's new files are ASCII).
3.  **Auto-Scaling:** The loader now automatically centers and scales loaded models to a radius of ~1.0, so they fit the physics bodies perfectly.

**Your Tasks (Weaver):**
1.  **Materials:** The dice currently look like "globular messes" because they lack proper materials/textures. Please implement the `DiceMaterial` system (Plastic, Metal, Wood).
2.  **Visual Polish:** Add shadows, lighting tweaks, and maybe a nice environment map.
3.  **Collision Sounds:** Implement the audio system for dice impacts.

The engine is stable and ready for your artistic touch! 🎨

---

### [2025-11-27 10:45] - Loomwright - ⚠️
**Topic:** 3D Dice Engine - PAUSED (Shader/Geometry Issues)
**Status:** ⚠️ Paused / Partial Success
**Changes:**
- `src/components/dice/DiceModelLoader.ts` (Implemented Convex Hull engraving detection)
- `src/lib/docking/panels.ts` (Disabled DiceTray panel for now)

**Action Needed:** Review "Gold Standard" plan below when resuming.

**Current State:**
- **Standard Dice (Chamfered/Sharp):** ✅ Working perfectly. The Convex Hull algorithm with a **0.005** threshold correctly detects the numbers.
- **Recessed Dice (Valkyrie/Stamped):** ❌ Failing. These dice have "recessed faces" (like a picture frame) that are ~0.02 deep. The algorithm struggles to distinguish between the "face recess" and the "number recess" (~0.05 deep).
- **Workaround Attempted:** I tried a "Tuned Threshold" of **0.035** to filter out the face but keep the numbers. It was inconsistent.

**The Fix (For Weaver/Future):**
We have decided to **abandon the runtime geometry analysis** for these complex dice. It is too fragile.

**The "Gold Standard" Plan:**
1.  **Convert to GLTF:** Open the original STLs in Blender.
2.  **Material Slots:** Assign two material slots:
    - Slot 0: `DiceBody`
    - Slot 1: `DiceNumber`
3.  **Export:** Save as `.glb`.
4.  **Code Update:** Update `DiceModels.tsx` to simply pass an array of materials: `materials={[bodyMat, numberMat]}`.

This will permanently solve all coloring issues without any math or shaders.

**Note:** The `DiceTray` panel is currently commented out in `panels.ts` to hide the broken feature from the user. Uncomment it when you are ready to resume work.


---

### [2025-11-27 11:47] - Loomwright - 🚫
**Topic:** 3D Dice - Complete Removal
**Status:** ✅ Removed / 🚫 On Hold Indefinitely
**Changes:**
- **DELETED:** `src/components/dice/` (entire folder - all 3D components)
- **DELETED:** `public/models/` (52 GLTF dice model files)
- **DELETED:** `public/sounds/` (75 dice audio files)
- **DELETED:** `public/textures/` (38 texture files)
- **MODIFIED:** `src/lib/docking/panels.ts` (removed DiceTray panel registration)
- **PRESERVED:** `src/components/settings/DiceSettings.tsx`
- **PRESERVED:** `src/stores/useDiceStore.ts`
- **PRESERVED:** `src/components/tools/dice/DiceTool.tsx` (2D dice roller)
- **PRESERVED:** `src/core/dice/` (diceEngine.ts, diceParser.ts)

**Action Needed:** **DO NOT** attempt to implement 3D dice

**Notes:**
After extensive research and analysis of the dice-box repository (see `dice-box-analysis.md` artifact), we've decided to **completely remove** the 3D dice implementation and start fresh when ready.

**Why Removed:**
- Shader issues with Rounded/Stamped/Valkyrie dice sets were unsolvable with current approach
- Procedural texture generation is unreliable across different GPUs
- Runtime geometry analysis for number detection was too fragile
- Better approach identified: pre-baked textures + instance buffers (like dice-box uses)

**What Still Works:**
- ✅ **2D Dice Roller** in `DiceTool.tsx` - fully functional
- ✅ **Dice Engine** - `diceEngine.ts` and `diceParser.ts` handle all rolling logic
- ✅ **DiceSettings** - UI component preserved for future use
- ✅ **useDiceStore** - Settings state management intact

**Total Removed:** 165+ files

**Future Implementation:**
When we restart 3D dice (not anytime soon), the plan is to:
1. Use **pre-baked texture maps** (diffuse, normal, specular) instead of procedural shaders
2. Implement **instance buffer colors** for runtime customization (no new materials needed)
3. Use **GLTF models with material slots** (not runtime geometry analysis)
4. Follow the dice-box pattern (BabylonJS + AmmoJS reference)

**For Now:**
- Users can still roll dice via the 2D interface
- Settings are preserved for when 3D dice returns
- Focus on other features (Weave system, tools, etc.)

See `walkthrough.md` artifact for complete removal details.

---

### [2025-11-27 18:52] - Loomwright - ✅
**Topic:** Tapestry Manager Phase 1 Complete
**Status:** ✅ Infrastructure Ready
**Changes:**
- **CREATED:** `src/types/tapestry.ts` (All data models)
- **CREATED:** `electron/ipc/tapestry.ts` (Complete IPC handlers)
- **CREATED:** `src/stores/useTapestryStore.ts` (Tapestry state management)
- **CREATED:** `src/stores/useEditorStore.ts` (Editor state management)
- **MODIFIED:** `electron/main.ts` (Registered tapestry handlers)
- **MODIFIED:** `electron/preload.ts` (Exposed tapestry API)
- **MODIFIED:** `src/types/electron.d.ts` (TypeScript definitions)
- **INSTALLED:** `gray-matter`, `uuid` (Dependencies for frontmatter parsing)

**Action Needed:** Start Phase 2 (Tapestry Manager UI)

**Notes:**
Phase 1 infrastructure is complete and ready for UI development!

**Available IPC Handlers:**

**Registry Management:**
- `tapestry:loadRegistry` → Returns `TapestryRegistry`
- `tapestry:create(data)` → Returns tapestry ID (string)
- `tapestry:open(id)` → Returns `TapestryConfig | null`
- `tapestry:update(id, updates)` → void
- `tapestry:remove(id)` → void (removes from registry, keeps files)
- `tapestry:delete(id)` → void (deletes from disk)

**Tree Management:**
- `tapestry:loadTree(tapestryId)` → Returns `TapestryNode | null`

**Entry Management:**
- `tapestry:loadEntry(path)` → Returns `EntryDoc | null`
- `tapestry:saveEntry(entry)` → void
- `tapestry:createEntry(parentPath, title, category)` → Returns entry ID

**File Operations:**
- `tapestry:createFolder(parentPath, name)` → void
- `tapestry:rename(oldPath, newName)` → void
- `tapestry:deleteNode(path)` → void
- `tapestry:move(sourcePath, targetPath)` → void
- `tapestry:updateOrder(folderPath, order)` → void

**Zustand Stores Available:**

**useTapestryStore:**
```typescript
const {
  registry,              // TapestryRegistry
  activeTapestryId,      // string | undefined
  activeTapestryConfig,  // TapestryConfig | undefined
  tree,                  // TapestryNode | undefined
  isLoading,             // boolean
  error,                 // string | undefined
  
  loadRegistry,          // () => Promise<void>
  createTapestry,        // (data) => Promise<string>
  openTapestry,          // (id) => Promise<void>
  updateTapestry,        // (id, updates) => Promise<void>
  removeTapestry,        // (id) => Promise<void>
  deleteTapestry,        // (id) => Promise<void>
  loadTree,              // () => Promise<void>
  clearError,            // () => void
} = useTapestryStore();
```

**useEditorStore:**
```typescript
const {
  mode,                  // 'edit' | 'view'
  openEntries,           // EntryDoc[]
  activeEntryId,         // string | undefined
  isLoading,             // boolean
  error,                 // string | undefined
  
  setMode,               // (mode) => void
  openEntry,             // (path) => Promise<void>
  closeEntry,            // (id) => Promise<boolean>
  setActiveEntry,        // (id) => void
  updateEntryContent,    // (id, content) => void
  saveEntry,             // (id) => Promise<void>
  saveAllEntries,        // () => Promise<void>
  clearError,            // () => void
} = useEditorStore();
```

**Your Tasks (Phase 2):**
1. Create `TapestryManager.tsx` component
2. Create `TapestryCard.tsx` component
3. Create `CreateTapestryDialog.tsx` modal
4. Create `EditTapestryDialog.tsx` modal
5. Wire to `AppLayout.tsx` for routing

**Example Usage:**
```typescript
// Load registry on mount
useEffect(() => {
  useTapestryStore.getState().loadRegistry();
}, []);

// Create new tapestry
const handleCreate = async (data: CreateTapestryData) => {
  const id = await createTapestry(data);
  await openTapestry(id); // Auto-open after creation
};

// Open tapestry
const handleOpen = async (id: string) => {
  await openTapestry(id);
  // Navigate to main app view
};
```

**File Structure Created:**
- Tapestries stored in: `Documents/Anvil and Loom/Tapestries/<slug>/`
- Registry file: `%AppData%/Anvil and Loom/tapestries.json`
- Per-tapestry config: `<tapestry>/.loom/tapestry.json`
- Entries folder: `<tapestry>/entries/`
- Initial entry: `<tapestry>/entries/The First Thread.md`

**Gotchas:**
- Registry auto-loads on app start (call `loadRegistry()` in App.tsx)
- Tree auto-loads when opening a tapestry
- Editor auto-saves when switching from edit → view mode
- Closing dirty entries prompts for save
- All IPC calls are async (use await)

Ready for you to build the UI! 🎨

---
