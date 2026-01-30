import { useCallback } from 'react';
import { useSessionStore, useActiveSession } from '../stores/useSessionStore';
import { useTapestryStore } from '../stores/useTapestryStore';

export const useSessionLifecycle = () => {
    const { createSession, setActiveSession, setActiveSessionFilePath, saveActiveSession } = useSessionStore();
    const activeSession = useActiveSession();

    const startSession = useCallback(async (title: string = 'New Session') => {
        // Create session in store
        const session = createSession(title);

        // Define file path (using timestamp or similar)
        // We need a base path for sessions. Assuming /Sessions/ relative to tapestry root?
        // But activeTapestryConfig gives path?
        // Let's assume we put it in the active tapestry's "Sessions" folder.
        // We need to resolve that path. 
        // For now, let's use a simpler approach: createEntry logic handles path?

        // Actually, createEntry creates a folder/file.
        // Let's assume we use createEntry to generate the file path and ID.
        try {
            // const { useTapestryStore } = await import('../stores/useTapestryStore'); 
            // Removed createEntry to avoid .md file creation

            // The file is created by createEntry as markdown usually?
            // If createEntry creates a .md file, we might have a problem if we want .json
            // But 'session' category might trigger .json creation in backend if configured?
            // Assuming for now createEntry makes a folder/file entry.

            // If createEntry returns a path ending in .md, we might want to change it.
            // Or we just write the .json content to that path (if backend allows generic extension).

            // Alternative: Manually construct path and use saveFile.
            // But we need the tapestry root path.

            const registry = useTapestryStore.getState().registry;
            const activeId = useTapestryStore.getState().activeTapestryId;
            const activeTapestry = registry.tapestries.find(t => t.id === activeId);

            if (activeTapestry) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                const filename = `${timestamp}_${safeTitle}.json`;
                const filePath = `${activeTapestry.path}\\entries\\Sessions\\${filename}`;

                // Create Sessions dir if needed? (We assume it exists or saveFile handles it?)
                // Helper to create initial content
                const content = JSON.stringify(session, null, 2);

                await useTapestryStore.getState().createFile(filePath, content);
                await useTapestryStore.getState().loadTree(); // Refresh tree to show new file
                setActiveSessionFilePath(filePath);

                // Open the new session file
                const { useEditorStore } = await import('../stores/useEditorStore');
                await useEditorStore.getState().openEntry(filePath);

                console.log('[useSessionLifecycle] Session started:', filePath);
            }
        } catch (error) {
            console.error('[useSessionLifecycle] Failed to create session file:', error);
            // Fallback: just keep in memory?
        }
    }, [createSession, setActiveSessionFilePath]);

    const endSession = useCallback(async () => {
        if (!activeSession) return;

        // Final save
        await saveActiveSession();

        // Clear active session
        setActiveSession(null);
        setActiveSessionFilePath(null);

        console.log('[useSessionLifecycle] Session ended');
    }, [activeSession, saveActiveSession, setActiveSession, setActiveSessionFilePath]);

    return {
        startSession,
        endSession,
        isActive: !!activeSession,
    };
};
