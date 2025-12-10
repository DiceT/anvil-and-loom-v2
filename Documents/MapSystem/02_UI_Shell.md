# 02 - The UI Shell & Interface

## Philosophy
"The Interface is the Map." Controls should be minimal, transparent, and retreat when not in use.

## 1. Left Toolbar (The "Toolbox")
*   **Position:** Floating, Left-Vertical Center.
*   **Behavior:** 
    *   **Root Tier:** Main Categories (Select, Draw, Zone, Fog).
    *   **Child Tier:** Expands to the right on click/hover. (Draw -> Pen, Line, Shape, Eraser).
*   **Styling:** Glassmorphism (Blur backdrop), high-contrast icons.
*   **Play/Edit Toggle:** A distinct switch at the very top of this bar.
    *   *PLAY Mode:* Hides "Builder" tools (Draw, Fog Paint). Shows "Player" tools (Measure, Ping, Move Token).
    *   *EDIT Mode:* Unlocks all creation tools.

## 2. Right Drawer (The "Library")
*   **Position:** Docked, Full Height Right. Collapsible.
*   **Tabs:**
    *   **Assets:** Folder tree of `.assets` (Tokens, Tiles). Drag-and-drop to canvas.
    *   **Layers:** List of map layers. Eye icon (Visibility), Lock icon (Interactivity). Drag to reorder.
    *   **Properties:** Metadata of the Map itself (Name, Grid Size, Background Image).

## 3. The "Token Selector" Context
*   **Location:** Integrated into the Asset Tab of the Right Drawer.
*   **Search:** Filter assets by filename or tag.
*   **Favorites:** "pinned" assets for quick access (e.g., standard generic goblin).

## 4. Contextual "Heads-Up" Display (HUD)
*   **Hover Inspector:**
    *   *Trigger:* Hover over a Pin/Token.
    *   *Content:* Mini-card showing Title + Short Blurb/Summary.
    *   *Action:* Click to open full Entry in a new Tab.
    *   *Edit Action:* (In Edit Mode) "Edit Link" button.
*   **Selection Bar:**
    *   *Trigger:* Selecting an object.
    *   *Location:* Floating near object OR Top-Center.
    *   *Controls:* Color picker (for drawings), Link input (for pins), "Delete" button.

## 5. Bottom Control Bar
*   **Position:** Bottom Center or Bottom Right.
*   **Controls:**
    *   Zoom Slider + Percentage Label.
    *   "Fit to Screen" button.
    *   "Recenter" button.
    *   Coordinate Display (optional, good for debugging/alignment).
