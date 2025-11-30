
import { create } from 'zustand';
import type { EntryDoc, EditorMode } from '../types/tapestry';
import { normalizeTag, deduplicateTags, extractInlineTags } from '../utils/tags';

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

    // Tag management
    addTag: (entryId: string, tag: string) => void;
    removeTag: (entryId: string, tag: string) => void;
    updateTags: (entryId: string, tags: string[]) => void;
    handleRename: (oldPath: string, newPath: string, newTitle: string) => void;

    // Place Panel management
    setWeaveRef: (entryId: string, weaveId: string | null) => void;
    addAspect: (entryId: string, aspectId: string) => void;
    removeAspect: (entryId: string, aspectId: string) => void;
    addDomain: (entryId: string, domainId: string) => void;
    removeDomain: (entryId: string, domainId: string) => void;
    setFirstLookDone: (entryId: string, done: boolean) => void;
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
                // Also activate the tab
                const { useTabStore } = await import('./useTabStore');
                const tabStore = useTabStore.getState();
                const existingTab = tabStore.tabs.find(t => t.id === existing.id);
                if (existingTab) {
                    tabStore.setActiveTab(existing.id);
                } else {
                    tabStore.openTab({
                        id: existing.id,
                        type: 'entry',
                        title: existing.title
                    });
                }
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

            // Create and activate tab
            const { useTabStore } = await import('./useTabStore');
            useTabStore.getState().openTab({
                id: entry.id,
                type: 'entry',
                title: entry.title
            });
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
            // Extract inline tags from content
            const inlineTags = extractInlineTags(entry.content);

            // Merge with frontmatter tags (deduplicate)
            const allTags = deduplicateTags([
                ...(entry.frontmatter.tags || []),
                ...inlineTags
            ]);

            // Update frontmatter tags
            entry.frontmatter.tags = allTags;

            await window.electron.tapestry.saveEntry(entry);

            // Update stitch index
            const { useStitchStore } = await import('./useStitchStore');
            useStitchStore.getState().updatePanel(entry.id, entry.title, entry.content, entry.path);

            // Update tag index
            const { useTagStore } = await import('./useTagStore');
            useTagStore.getState().updatePanelTags(entry.id, allTags);

            // Mark as clean
            set(state => ({
                openEntries: state.openEntries.map(e =>
                    e.id === id ? { ...e, isDirty: false, frontmatter: { ...e.frontmatter, tags: allTags } } : e
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

            // Update stitch index for all saved entries
            const { useStitchStore } = await import('./useStitchStore');
            dirtyEntries.forEach(entry => {
                useStitchStore.getState().updatePanel(entry.id, entry.title, entry.content, entry.path);
            });

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

    // Add tag to a panel
    addTag: (entryId: string, tag: string) => {
        const entry = get().openEntries.find(e => e.id === entryId);
        if (!entry) return;

        const normalized = normalizeTag(tag);
        const tags = entry.frontmatter.tags || [];

        if (!tags.includes(normalized)) {
            entry.frontmatter.tags = [...tags, normalized];
            entry.isDirty = true;
            set({ openEntries: [...get().openEntries] });
        }
    },

    // Remove tag from a panel
    removeTag: (entryId: string, tag: string) => {
        const entry = get().openEntries.find(e => e.id === entryId);
        if (!entry) return;

        const normalized = normalizeTag(tag);
        entry.frontmatter.tags = (entry.frontmatter.tags || []).filter(t => t !== normalized);
        entry.isDirty = true;
        set({ openEntries: [...get().openEntries] });
    },

    // Update all tags for a panel
    updateTags: (entryId: string, tags: string[]) => {
        const entry = get().openEntries.find(e => e.id === entryId);
        if (!entry) return;

        entry.frontmatter.tags = deduplicateTags(tags);
        entry.isDirty = true;
        set({ openEntries: [...get().openEntries] });
    },

    handleRename: (oldPath: string, newPath: string, newTitle: string) => {
        set(state => ({
            openEntries: state.openEntries.map(entry => {
                if (entry.path === oldPath) {
                    return {
                        ...entry,
                        path: newPath,
                        title: newTitle,
                        frontmatter: {
                            ...entry.frontmatter,
                            title: newTitle
                        }
                    };
                }
                return entry;
            })
        }));
    },

    // Place Panel Actions
    setWeaveRef: (entryId: string, weaveId: string | null) => {
        const entry = get().openEntries.find(e => e.id === entryId);
        if (!entry) return;

        entry.frontmatter.weaveRef = weaveId || undefined;
        entry.isDirty = true;
        set({ openEntries: [...get().openEntries] });
    },

    addAspect: (entryId: string, aspectId: string) => {
        const entry = get().openEntries.find(e => e.id === entryId);
        if (!entry) return;

        const aspects = entry.frontmatter.aspects || [];
        if (!aspects.includes(aspectId)) {
            entry.frontmatter.aspects = [...aspects, aspectId];
            entry.isDirty = true;
            set({ openEntries: [...get().openEntries] });
        }
    },

    removeAspect: (entryId: string, aspectId: string) => {
        const entry = get().openEntries.find(e => e.id === entryId);
        if (!entry) return;

        entry.frontmatter.aspects = (entry.frontmatter.aspects || []).filter(id => id !== aspectId);
        entry.isDirty = true;
        set({ openEntries: [...get().openEntries] });
    },

    addDomain: (entryId: string, domainId: string) => {
        const entry = get().openEntries.find(e => e.id === entryId);
        if (!entry) return;

        const domains = entry.frontmatter.domains || [];
        if (!domains.includes(domainId)) {
            entry.frontmatter.domains = [...domains, domainId];
            entry.isDirty = true;
            set({ openEntries: [...get().openEntries] });
        }
    },

    removeDomain: (entryId: string, domainId: string) => {
        const entry = get().openEntries.find(e => e.id === entryId);
        if (!entry) return;

        entry.frontmatter.domains = (entry.frontmatter.domains || []).filter(id => id !== domainId);
        entry.isDirty = true;
        set({ openEntries: [...get().openEntries] });
    },

    setFirstLookDone: (entryId: string, done: boolean) => {
        const entry = get().openEntries.find(e => e.id === entryId);
        if (!entry) return;

        entry.frontmatter.firstLookDone = done;
        entry.isDirty = true;
        set({ openEntries: [...get().openEntries] });
    },
}));
