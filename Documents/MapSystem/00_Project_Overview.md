# 00 - Map & Canvas System: Project Overview

## Vision
A unified "Spatial Interface" for Anvil & Loom that serves three distinct but mechanically shared purposes:
1.  **Overland Maps:** "Atlas" style navigation with pins, fog of war, and distance measuring.
2.  **Dungeon Maps:** "Tactical" style exploration with grid-snapping tiles, walls (collision), and dynamic lighting.
3.  **Canvas Notes:** "Whiteboard" style brainstorming with freeform notes and connectors.

This system will be the primary visual interface for campaign management, evolving Anvil & Loom from a text-based wiki into a visual campaign engine.

## Core UX Philosophy
*   **Immersive:** The map commands the screen.
*   **Contextual:** Tools appear where you need them (floating toolbars, hover inspectors).
*   **Unified:** One engine handles "Pins on a Continent" and "Tables in a Dungeon Room."
*   **Modal:** Distinct **EDIT** (GM Prep) and **PLAY** (Session Run) modes to prevent accidental changes during gameplay.

---

## Architecture Pillars

### 1. The Canvas Engine (`MapCanvas`)
A shared React component built (likely on `react-konva` or generic HTML5 Canvas/SVG) supporting:
*   Infinite Pan & Zoom (Vector-based scaling).
*   Layer Management (Grid, Background, Object, Fog, UI).
*   Coordinate Systems (Screen Space vs. World Space vs. Grid Space).
*   Input Handling (Drag, Drop, Brush Paint, Eraser).

### 2. The UI Shell
A minimalistic overlay interface designed to maximize canvas visibility.
*   **Left Toolbar (Floating):** Tools grouped by category (Draw, Zone, Pin). Toggles betwen EDIT/PLAY modes.
*   **Right Drawer (Solid):** The "Asset Library" (Tokens, Tiles, Saved Objects). Drag-and-drop source.
*   **Bottom Bar:** Navigation controls (Zoom slider), Layer visibility toggles, Grid settings.
*   **Context Popups:** Hover cards for pins, creating links, editing properties.

### 3. The Asset System
A robust file-system bridge.
*   **Local Assets:** Scanned from a hidden `.assets` directory in the Tapestry root (ignored by the Tapestry Pane).
*   **Shared Assets:** (Future) Support for a global user library.
*   **Drag & Drop:** Dragging an external file onto the canvas auto-imports it to the `.assets` folder and places it.
*   **Entry Linking:** Dragging an *Entry* (Place/NPC) onto the canvas creates a linked Token/Pin.

---

## Data Model
Maps are stored as specialized **Panels** (Markdown/YAML or JSON) in the Tapestry.

```typescript
interface MapPanel {
    id: string;
    type: 'map';
    backgroundImage?: string; // For Overland
    grid: {
        type: 'square' | 'hex';
        size: number;
        offsetX: number;
        offsetY: number;
        scaleLabel: string; // "5 ft"
    };
    layers: {
        id: string;
        name: string;
        isVisible: boolean;
        isLocked: boolean;
        items: MapItem[]; 
    }[];
}

interface MapItem {
    id: string;
    type: 'token' | 'pin' | 'drawing' | 'text';
    x: number;
    y: number;
    rotation?: number;
    scale?: number;
    assetRef?: string; // Path to image
    linkRef?: string;  // ID of linked Entry
    data?: any;        // Plugin-specific data (fog polypoints, color, etc.)
}
```

## Implementation Phases
1.  **Phase 1: The Engine (Overland Focus)** - Image background, Pan/Zoom, Pins, Links.
2.  **Phase 2: The Builder (Dungeon Focus)** - Grid Snapping, Asset Drawer, Tile placement.
3.  **Phase 3: The Polish (VTT Features)** - Fog of War, Drawing Tools, Play Mode toggles.
