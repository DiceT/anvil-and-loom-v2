import { create } from 'zustand';
import { deduplicateTags, normalizeTag } from '../utils/tags';

interface TagStore {
    // Global tag index: tag -> Set of panel IDs
    tagIndex: Map<string, Set<string>>;

    // Build the index from all panels
    buildIndex: (panels: Array<{ id: string; tags?: string[] }>) => void;

    // Get all unique tags in use
    getAllTags: () => string[];

    // Get usage count for a specific tag
    getTagUsage: (tag: string) => number;

    // Get panel IDs that have a specific tag
    getPanelsWithTag: (tag: string) => string[];

    // Add a tag to a panel in the index
    addTagToIndex: (panelId: string, tag: string) => void;

    // Remove a tag from a panel in the index
    removeTagFromIndex: (panelId: string, tag: string) => void;

    // Update a panel's tags in the index
    updatePanelTags: (panelId: string, tags: string[]) => void;

    // Clear the index
    clearIndex: () => void;
}

export const useTagStore = create<TagStore>((set, get) => ({
    tagIndex: new Map(),

    buildIndex: (panels) => {
        const newIndex = new Map<string, Set<string>>();

        panels.forEach(panel => {
            if (panel.tags && panel.tags.length > 0) {
                const normalized = deduplicateTags(panel.tags);
                normalized.forEach(tag => {
                    if (!newIndex.has(tag)) {
                        newIndex.set(tag, new Set());
                    }
                    newIndex.get(tag)!.add(panel.id);
                });
            }
        });

        set({ tagIndex: newIndex });
    },

    getAllTags: () => {
        return Array.from(get().tagIndex.keys()).sort();
    },

    getTagUsage: (tag) => {
        const normalized = normalizeTag(tag);
        const panelIds = get().tagIndex.get(normalized);
        return panelIds ? panelIds.size : 0;
    },

    getPanelsWithTag: (tag) => {
        const normalized = normalizeTag(tag);
        const panelIds = get().tagIndex.get(normalized);
        return panelIds ? Array.from(panelIds) : [];
    },

    addTagToIndex: (panelId, tag) => {
        const normalized = normalizeTag(tag);
        set((state) => {
            const newIndex = new Map(state.tagIndex);
            if (!newIndex.has(normalized)) {
                newIndex.set(normalized, new Set());
            }
            newIndex.get(normalized)!.add(panelId);
            return { tagIndex: newIndex };
        });
    },

    removeTagFromIndex: (panelId, tag) => {
        const normalized = normalizeTag(tag);
        set((state) => {
            const newIndex = new Map(state.tagIndex);
            const panelIds = newIndex.get(normalized);
            if (panelIds) {
                panelIds.delete(panelId);
                if (panelIds.size === 0) {
                    newIndex.delete(normalized);
                }
            }
            return { tagIndex: newIndex };
        });
    },

    updatePanelTags: (panelId, tags) => {
        set((state) => {
            const newIndex = new Map(state.tagIndex);

            // Remove panel from all existing tags
            newIndex.forEach((panelIds, tag) => {
                panelIds.delete(panelId);
                if (panelIds.size === 0) {
                    newIndex.delete(tag);
                }
            });

            // Add panel to new tags
            const normalized = deduplicateTags(tags);
            normalized.forEach(tag => {
                if (!newIndex.has(tag)) {
                    newIndex.set(tag, new Set());
                }
                newIndex.get(tag)!.add(panelId);
            });

            return { tagIndex: newIndex };
        });
    },

    clearIndex: () => {
        set({ tagIndex: new Map() });
    },
}));
