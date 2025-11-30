
import { create } from 'zustand';
import { StitchIndex, StitchReference } from '../types/stitch';
import { extractStitches } from '../core/stitches/stitchParser';

interface StitchStore {
    index: StitchIndex;
    panelMap: Record<string, { id: string; path: string }>; // Title (normalized) -> { id, path }
    isIndexing: boolean;

    // Actions
    buildIndex: (tapestryId: string) => Promise<void>;
    updatePanel: (panelId: string, title: string, content: string, path: string) => void;
    removePanel: (panelId: string) => void;

    // Selectors
    getOutgoing: (panelId: string) => string[];
    getIncoming: (panelTitle: string) => StitchReference[];
    resolvePanel: (title: string) => { id: string; path: string } | undefined;
}

export const useStitchStore = create<StitchStore>((set, get) => ({
    index: {
        outgoing: {},
        incoming: {},
    },
    panelMap: {},
    isIndexing: false,

    buildIndex: async (tapestryId: string) => {

        set({ isIndexing: true });
        try {
            const entries = await window.electron.tapestry.getAllPanels(tapestryId);


            const outgoing: Record<string, string[]> = {};
            const incoming: Record<string, StitchReference[]> = {};
            const panelMap: Record<string, { id: string; path: string }> = {};

            entries.forEach((entry) => {
                // Map title to ID and Path
                panelMap[entry.title.toLowerCase()] = { id: entry.id, path: entry.path };

                // 1. Parse outgoing stitches
                const stitches = extractStitches(entry.content);


                const targets = [...new Set(stitches.map(s => s.target))]; // Unique targets
                outgoing[entry.id] = targets;

                // 2. Build incoming references
                stitches.forEach(stitch => {
                    const targetKey = stitch.target.toLowerCase(); // Normalize for lookup
                    if (!incoming[targetKey]) {
                        incoming[targetKey] = [];
                    }

                    // Extract context snippet (e.g. 50 chars before/after)
                    const start = Math.max(0, stitch.start - 50);
                    const end = Math.min(entry.content.length, stitch.end + 50);
                    const context = entry.content.substring(start, end).trim();

                    incoming[targetKey].push({
                        sourceId: entry.id,
                        sourceTitle: entry.title,
                        targetTitle: stitch.target,
                        anchor: stitch.anchor,
                        context: context,
                    });
                });
            });


            set({ index: { outgoing, incoming }, panelMap });
        } catch (error) {
            console.error('[useStitchStore] Failed to build stitch index:', error);
        } finally {
            set({ isIndexing: false });
        }
    },

    updatePanel: (panelId, title, content, path) => {
        set((state) => {
            const { outgoing, incoming } = state.index;
            const { panelMap } = state;

            // Update panel map
            const newPanelMap = { ...panelMap };

            // Remove old mapping for this ID if title changed
            // We scan to find if this ID was mapped to another title
            Object.keys(newPanelMap).forEach(key => {
                if (newPanelMap[key].id === panelId) delete newPanelMap[key];
            });

            newPanelMap[title.toLowerCase()] = { id: panelId, path };

            // 1. Remove old outgoing for this panel
            const newIncoming = { ...incoming };

            // Remove all references FROM this panelId in the incoming map
            Object.keys(newIncoming).forEach(targetKey => {
                newIncoming[targetKey] = newIncoming[targetKey].filter(ref => ref.sourceId !== panelId);
                if (newIncoming[targetKey].length === 0) {
                    delete newIncoming[targetKey];
                }
            });

            // 2. Parse new stitches
            const stitches = extractStitches(content);
            const targets = [...new Set(stitches.map(s => s.target))];

            // 3. Update outgoing
            const newOutgoing = { ...outgoing, [panelId]: targets };

            // 4. Add new incoming refs
            stitches.forEach(stitch => {
                const targetKey = stitch.target.toLowerCase();
                if (!newIncoming[targetKey]) {
                    newIncoming[targetKey] = [];
                }

                const start = Math.max(0, stitch.start - 50);
                const end = Math.min(content.length, stitch.end + 50);
                const context = content.substring(start, end).trim();

                newIncoming[targetKey].push({
                    sourceId: panelId,
                    sourceTitle: title,
                    targetTitle: stitch.target,
                    anchor: stitch.anchor,
                    context: context,
                });
            });

            return {
                index: {
                    outgoing: newOutgoing,
                    incoming: newIncoming,
                },
                panelMap: newPanelMap,
            };
        });
    },

    removePanel: (panelId) => {
        set((state) => {
            const { outgoing, incoming } = state.index;
            const { panelMap } = state;

            const newOutgoing = { ...outgoing };
            delete newOutgoing[panelId];

            const newIncoming = { ...incoming };
            Object.keys(newIncoming).forEach(targetKey => {
                newIncoming[targetKey] = newIncoming[targetKey].filter(ref => ref.sourceId !== panelId);
                if (newIncoming[targetKey].length === 0) {
                    delete newIncoming[targetKey];
                }
            });

            const newPanelMap = { ...panelMap };
            Object.keys(newPanelMap).forEach(key => {
                if (newPanelMap[key].id === panelId) delete newPanelMap[key];
            });

            return {
                index: {
                    outgoing: newOutgoing,
                    incoming: newIncoming,
                },
                panelMap: newPanelMap,
            };
        });
    },

    getOutgoing: (panelId) => {
        return get().index.outgoing[panelId] || [];
    },

    getIncoming: (panelTitle) => {
        return get().index.incoming[panelTitle.toLowerCase()] || [];
    },

    resolvePanel: (title) => {
        return get().panelMap[title.toLowerCase()];
    },
}));
