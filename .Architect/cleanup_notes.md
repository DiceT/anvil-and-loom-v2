# Project Findings and Cleanup

## Orphaned/Removed Items
*   **Gem UI**: The `GemToolbar` component and its associated assets (`assets/images/gems/`) have been removed from the project as requested.
*   **TopBar**: The `TopBar.tsx` component is currently returning `null` and appears to be a placeholder or disabled.
*   **MapEditor Import**: The `MapEditor.tsx` file has an orphaned input for `handleImportMap` which uses `window.electron.tapestry.pickImage()` but then manually constructs a `media://` URL. This logic might need review if `pickImage` behavior changes or if the `media://` protocol handling is updated. The logic for constructing the `src` string (`media:///...`) seems a bit fragile with the path separator replacements.
*   **SettingsStore**: There is a `SettingsModal` and presumably settings logic, but `MapEditor` manages `gridSettings` locally using `useState`. This might be inconsistent with a global `SettingsStore` if one exists (like `useSessionStore` implies global state management).
*   **SessionControl**: `AppLayout.tsx` defines a local `SessionControl` component. This seems fine, but it relies on `useSessionStore`.
*   **Unused Imports**: The `MapEditor` imports `PloughCanvas` and `PloughCanvasHandle` but `PloughCanvasHandle` is only used as a type. This is normal for TypeScript but worth noting if `PloughCanvas` changes API.

## Recommendations
1.  **TopBar**: Decide if `TopBar` is needed. If not, remove the component file and the reference in `AppLayout.tsx`.
2.  **MapEditor Import**: Standardize the file path handling for `media://` URLs in a utility function to avoid duplication and potential bugs across different OS environments.
3.  **Grid Settings**: Consider moving `gridSettings` to a persistent store (like `useMapToolStore` or `useSettingsStore`) so that grid preferences persist across map loads or editor sessions.
4.  **Editor Cleanup**: `MapEditor.tsx` has some commented out code (e.g., `// TODO: Push to Plough Engine via ref`) and unused imports or logic related to the old map system might still be lurking in other files (though `MapCanvas` was deleted).
