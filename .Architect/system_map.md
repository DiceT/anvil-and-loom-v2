# System Landscape

## 1. Architecture Overview
**Anvil and Loom** follows a standard Electron + React architecture with a clear separation of concerns.

```mermaid
graph TD
    User([User]) --> UI[React Frontend (Renderer)]
    UI --> Stores[Zustand Stores]
    UI --> editor[Milkdown Editor]
    
    subgraph Core Logic
        Stores --> Weave[Weave Engine]
        Stores --> Tapesty[Tapestry Manager]
        Weave --> Tables[Table Registry]
    end
    
    subgraph Native Bridge
        Tapesty --> IPC[Electron IPC]
        IPC --> Main[Main Process (Node.js)]
        Main --> FS[File System]
    end
```

## 2. Key Components

### The Tapestry (Project Model)
*   **Definition**: A folder-based project structure containing all user data.
*   **Manager**: `useTapestryStore` / `electron.tapestry`
*   **Data**: Stored as localized files (likely JSON/Markdown) in the `entries/` subdirectory.

### The Weave (Procedural Engine)
*   **Definition**: A routing layer that connects generic mechanics (Rolling a d20) to specific thematic content (Aspects/Domains).
*   **Manager**: `src/core/weave`
*   **Logic**: `FirstLook` generates complex narrative seeds by combining results from multiple oracle packs.

### The Editor (Journaling)
*   **Tech**: Milkdown (Headless ProseMirror).
*   **Integration**: Integrated with "Stitches" (Wikilinks) via `remark-wiki-link`.

## 3. Integrations
### Anvil Dice Engine
*   **Location**: `src/integrations/anvil-dice-app`
*   **Status**: Embedded source copy.
*   **Improvement Opportunity**: Currently lacks a unified `index.ts` export barrel in the target structure, relying on deep imports.
