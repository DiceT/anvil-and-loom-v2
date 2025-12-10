# 03 - Asset & File System

## Directory Structure
Assets are strictly managed within the Tapestry's file structure to ensure portability.

```
MyTapestry/
├── .assets/               # HIDDEN from standard Tapestry Pane
│   ├── _global/           # System-provided generic icons
│   ├── images/            # Imported map backgrounds
│   ├── tokens/            # Character/Monster pogs
│   └── tiles/             # Dungeon tiles/stamps
├── MyMap.md               # The Map Panel file (JSON/YAML data)
└── content...
```

## Import Workflow
1.  **Drag & Drop (OS -> Canvas):**
    *   User drags `dragon.png` from Desktop to Canvas.
    *   System copies file to `.assets/uploads/`.
    *   System adds `ImageObject` to Canvas referencing that local path.
2.  **Asset Import Button:**
    *   "Import Assets" button in Right Drawer.
    *   Opens OS File Picker.
    *   Batch copies files to specific `.assets/` subfolder.

## The "Shared" Asset Concept
*   **Problem:** User wants the same "Goblin" token in *every* Tapestry.
*   **Phase 1 Solution:** Manual copying.
*   **Phase 2 Solution (Proposed):** A global `AppData` library.
    *   The Asset Drawer shows two roots: `Project Assets` (Local) and `Global Library` (System).
    *   Dragging a Global asset copies it to Local (self-containment) OR references the absolute global path (save space).
    *   *Decision:* **Copy on Use**. Better for portability (zipping the Tapestry folder contains everything).

## Linking Entries (The "Pin" Workflow)
1.  User drags `Town Hall` (Entry) from Tapestry Pane -> Canvas.
2.  System creates a `Pin` object.
3.  System checks frontmatter of `Town Hall` for an `icon` or `image`.
    *   If found: Uses that as the Pin icon.
    *   If not: Uses a default "Location" pin.
4.  Pin `linkRef` is set to `Town Hall`.
