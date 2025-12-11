import { v4 as uuidv4 } from 'uuid';
import { useSessionStore } from '../stores/useSessionStore';
import { useEditorStore } from '../stores/useEditorStore';
import { useTapestryStore } from '../stores/useTapestryStore';
import { EntryDoc, EntryCategory } from '../types/tapestry';

export async function createNewSession() {
    const { activeTapestryId } = useTapestryStore.getState();
    if (!activeTapestryId) {
        console.error("No active tapestry to create session in");
        return;
    }

    const registry = useTapestryStore.getState().registry;
    const tapestry = registry.tapestries.find(t => t.id === activeTapestryId);
    if (!tapestry) {
        console.error("Active tapestry not found in registry");
        return;
    }

    const timestamp = new Date();
    // Format: YYYY-MM-DD HH-mm-ss
    // We want a filename friendly format
    const dateStr = timestamp.toLocaleDateString('en-CA'); // YYYY-MM-DD
    const timeStr = timestamp.toLocaleTimeString('en-GB', { hour12: false }).replace(/:/g, '-');
    const title = `Session - ${dateStr} ${timeStr}`;
    const filename = `${title}.md`;

    // Construct path.
    // Standard entries live in 'entries' folder.
    // If the user created a "Sessions" folder via UI, it is likely in tapestry.path/entries/Sessions
    const separator = tapestry.path.includes('\\') ? '\\' : '/';
    const entriesDir = 'entries';
    const sessionsDir = 'Sessions';
    // e.g. E:\Tapestry\entries\Sessions\Session.md
    const relativePath = `${entriesDir}${separator}${sessionsDir}${separator}${filename}`;
    const fullPath = `${tapestry.path}${separator}${relativePath}`;

    // Create EntryDoc
    const id = uuidv4();
    const newEntry: EntryDoc = {
        id,
        title,
        path: fullPath,
        category: 'session' as EntryCategory,
        content: `# ${title}\n\n*Session started at ${timestamp.toLocaleString()}*\n\n`,
        frontmatter: {
            id,
            title,
            category: 'session' as EntryCategory,
            tags: ['session'],
        },
        isDirty: true
    };

    try {
        // Save using electron bridge
        await window.electron.tapestry.saveEntry(newEntry);

        // Open the entry
        await useEditorStore.getState().openEntry(fullPath);

        // Set as Active Session
        useSessionStore.getState().startSession(id);

        // Refresh tree to show new session
        await useTapestryStore.getState().loadTree();

    } catch (error) {
        console.error("Failed to create session:", error);
        alert("Failed to create session file. Ensure the 'Sessions' folder exists in your tapestry.");
    }
}
