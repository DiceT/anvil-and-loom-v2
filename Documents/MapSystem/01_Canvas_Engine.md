# 01 - The Canvas Engine

## Technology Choice
**Recommendation: `react-konva` (Canvas API wrapper)**
*   **Why:** High performance for thousands of objects (fog particles, tiles). Better than raw DOM/SVG for complex rendering like fog erasing.
*   **Alternative:** `react-flow` (Great for "Canvas Notes/Nodes", bad for "Painting Fog" or pixel-perfect tile maps).

## Core Capabilities

### 1. Viewport Management
*   **State:** `x`, `y` (offset), `scale` (zoom level).
*   **Input:** 
    *   `Wheel`: Zoom to cursor pointer.
    *   `Middle Click / Space+Drag`: Pan.
*   **Virtualization:** Only render items within the visible viewport + buffer (critical for large dungeon tile-maps).

### 2. Layer System
The Engine renders layers in a strict Z-index order. Layers can be toggled via the UI.

**Standard Layer Stack:**
6.  **UI/HUD Layer:** Selection boxes, hover tooltips, "Context" editors. (Static, ignores Zoom usually, or scales intelligently).
5.  **Fog of War Layer:** A bitmap canvas overlay using `globalCompositeOperation` to "erase" (reveal) parts.
4.  **Drawing/Annotation Layer:** Vector lines (pen tool), Text labels, Zone shapes.
3.  **Object/Token Layer:** Interactive items (PCs, Monsters, Chests).
2.  **Structure Layer:** Walls, Doors, Physics colliders. 
1.  **Map/Grid Layer:**
    *   *Grid:* Canvas drawing of lines/dots based on `gridSize`.
    *   *Background:* The base Import Image (Overland) or Floor Tiles (Dungeon).

### 3. Coordinate Systems
We must meticulously convert between spaces:
*   **Client (Pointer):** Mouse pixel on screen (`e.evt.clientX`).
*   **Stage (Relative):** Position relative to the Stage container.
*   **World (Absolute):** The actual X/Y in the map data (`(pointer - stageOffset) / scale`).
*   **Grid (Discrete):** `Math.floor(World / gridSize)`.

### 4. Interaction Manager
A central event bus to handle tool Logic.
*   *Example:* When "Brush Tool" is active, `onMouseDown` draws lines. When "Select Tool" is active, `onMouseDown` starts a drag.
*   **Snapping:** If `snapToGrid` is true, the Interaction Manager rounds `Drop` coordinates to the nearest Grid center or intersection.

## Performance Targets
*   **60 FPS Pan/Zoom** with ~500 items.
*   **Instant Load** for large images (lazy loading / tiling if maps exceed 4k resolution).
