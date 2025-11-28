import { create } from 'zustand';
import type { EntryDoc, EditorMode } from '../types/tapestry';

interface EditorState {
    // State
    mode: EditorMode;
    openEntries: EntryDoc[];
    activeEntryId?: string;
    isLoading: boolean;
    error?: string;

    // Actions
    setMode: (mode: EditorMode) => void;
    openEntry: (path: string) => Promise<void>;
    closeEntry: (id: string) => Promise<boolean>; // Returns true if closed, false if cancelled
    setActiveEntry: (id: string) => void;
    updateEntryContent: (id: string, content: string) => void;
    saveEntry: (id: string) => Promise<void>;
    saveAllEntries: () => Promise<void>;
    clearError: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
    // Initial state
    mode: 'view',
    openEntries: [],
    isLoading: false,

    // Set editor mode (edit/view)
    setMode: (mode: EditorMode) => {
        const currentMode = get().mode;

        // If switching from edit to view, auto-save dirty entries
        if (currentMode === 'edit' && mode === 'view') {
            get().saveAllEntries();
        }

        set({ mode });
    },

    // Open entry
    openEntry: async (path: string) => {
        set({ isLoading: true, error: undefined });
        try {
            // Check if already open
            const existing = get().openEntries.find(e => e.path === path);
            if (existing) {
                set({ activeEntryId: existing.id, isLoading: false });
                return;
            }

            // Load entry from disk
            const entry = await window.electron.tapestry.loadEntry(path);

            if (!entry) {
                throw new Error('Entry not found');
            }

            set(state => ({
                openEntries: [...state.openEntries, entry],
                activeEntryId: entry.id,
                isLoading: false,
            }));
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to open entry',
                isLoading: false
            });
        }
    },

    // Close entry
    closeEntry: async (id: string): Promise<boolean> => {
        const entry = get().openEntries.find(e => e.id === id);

        if (!entry) return true;

        // If dirty, prompt to save
        if (entry.isDirty) {
            const shouldSave = window.confirm(
                `"${entry.title}" has unsaved changes. Save before closing?`
            );

            if (shouldSave) {
                try {
                    await get().saveEntry(id);
                } catch (error) {
                    // Save failed, ask if they want to close anyway
                    const forceClose = window.confirm(
                        'Failed to save. Close anyway and lose changes?'
                    );
                    if (!forceClose) return false;
                }
            }
        }

        // Remove from open entries
        set(state => {
            const newOpenEntries = state.openEntries.filter(e => e.id !== id);
            let newActiveId = state.activeEntryId;

            // If closing the active entry, switch to another
            if (state.activeEntryId === id) {
                newActiveId = newOpenEntries.length > 0
                    ? newOpenEntries[newOpenEntries.length - 1].id
                    : undefined;
            }

            return {
                openEntries: newOpenEntries,
                activeEntryId: newActiveId,
            };
        });

        return true;
    },

    // Set active entry
    setActiveEntry: (id: string) => {
        const entry = get().openEntries.find(e => e.id === id);
        if (entry) {
            set({ activeEntryId: id });
        }
    },

    // Update entry content
    updateEntryContent: (id: string, content: string) => {
        set(state => ({
            openEntries: state.openEntries.map(entry =>
                entry.id === id
                    ? { ...entry, content, isDirty: true }
                    : entry
            ),
        }));
    },

    // Save entry
    saveEntry: async (id: string) => {
        const entry = get().openEntries.find(e => e.id === id);

        if (!entry) {
            throw new Error('Entry not found');
        }

        if (!entry.isDirty) {
            return; // Nothing to save
        }

        set({ isLoading: true, error: undefined });
        try {
            await window.electron.tapestry.saveEntry(entry);

            // Mark as clean
            set(state => ({
                openEntries: state.openEntries.map(e =>
                    e.id === id ? { ...e, isDirty: false } : e
                ),
                isLoading: false,
            }));
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to save entry',
                isLoading: false
            });
            throw error;
        }
    },

    // Save all dirty entries
    saveAllEntries: async () => {
        const dirtyEntries = get().openEntries.filter(e => e.isDirty);

        if (dirtyEntries.length === 0) return;

        set({ isLoading: true, error: undefined });
        try {
            await Promise.all(
                dirtyEntries.map(entry => window.electron.tapestry.saveEntry(entry))
            );

            // Mark all as clean
            set(state => ({
                openEntries: state.openEntries.map(e => ({ ...e, isDirty: false })),
                isLoading: false,
            }));
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to save entries',
                isLoading: false
            });
            throw error;
        }
    },

    // Clear error
    clearError: () => set({ error: undefined }),
}));
