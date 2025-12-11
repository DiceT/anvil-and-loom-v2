
import { create } from 'zustand';
import { StitchIndex, StitchReference } from '../types/stitch';
import { extractStitches, extractMapPins } from '../core/stitches/stitchParser';

interface StitchStore {
    index: StitchIndex;
    panelMap: Record<string, { id: string; path: string }>; // Title (normalized) -> { id, path }
    idToTitle: Record<string, string>; // ID -> Title (Original Case)
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
    idToTitle: {},
    isIndexing: false,

    buildIndex: async (tapestryId: string) => {

        set({ isIndexing: true });
        try {
            const entries = await window.electron.tapestry.getAllPanels(tapestryId);


            const outgoing: Record<string, string[]> = {};
            const incoming: Record<string, StitchReference[]> = {};
            const panelMap: Record<string, { id: string; path: string }> = {};
            const idToTitle: Record<string, string> = {};

            entries.forEach((entry) => {
                // Map title to ID and Path
                panelMap[entry.title.toLowerCase()] = { id: entry.id, path: entry.path };
                idToTitle[entry.id] = entry.title;

                // 1. Parse outgoing stitches (Text Links)
                const stitches = extractStitches(entry.content);
                const pins = extractMapPins(entry.content);

                // Convert Pins to Targets (Resolve ID -> Title)
                // Note: We need a second pass or lazy resolution if the target ID is not yet in idToTitle?
                // Actually, we are building idToTitle in this loop too.
                // Better approach: build idToTitle FIRST, then process links.
                // But for now, let's assume we might miss some if order matters?
                // No, we can just process all maps/arrays after the loop?
                // OR: Split loop into 2 phases. Phase 1: Build Maps. Phase 2: Build Index.
                // Let's split it.
                // ... (Wait, splitting is cleaner)

                // Refactor: Phase 1
            });

            // Phase 1: Build Lookups
            entries.forEach(entry => {
                panelMap[entry.title.toLowerCase()] = { id: entry.id, path: entry.path };
                idToTitle[entry.id] = entry.title;
            });

            // Phase 2: Build Index
            entries.forEach(entry => {
                const stitches = extractStitches(entry.content);
                const pins = extractMapPins(entry.content);

                const textTargets = stitches.map(s => s.target);
                const pinTargets = pins.map(p => idToTitle[p.targetId]).filter(t => !!t); // Resolve ID to Title

                const uniqueTargets = [...new Set([...textTargets, ...pinTargets])];
                outgoing[entry.id] = uniqueTargets;

                // 2a. Text Backstitches
                stitches.forEach(stitch => {
                    const targetKey = stitch.target.toLowerCase();
                    if (!incoming[targetKey]) incoming[targetKey] = [];

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

                // 2b. Pin Backstitches
                pins.forEach(pin => {
                    const targetTitle = idToTitle[pin.targetId];
                    if (!targetTitle) return;

                    const targetKey = targetTitle.toLowerCase();
                    if (!incoming[targetKey]) incoming[targetKey] = [];

                    incoming[targetKey].push({
                        sourceId: entry.id,
                        sourceTitle: entry.title, // This map contains the pin
                        targetTitle: targetTitle, // The pin points to this entry
                        anchor: pin.label,
                        context: `📍 Map Pin: ${pin.label} - ${pin.blurb || 'No Value'}`,
                    });
                });
            });


            set({ index: { outgoing, incoming }, panelMap, idToTitle });
        } catch (error) {
            console.error('[useStitchStore] Failed to build stitch index:', error);
        } finally {
            set({ isIndexing: false });
        }
    },

    updatePanel: (panelId, title, content, path) => {
        set((state) => {
            const { outgoing, incoming } = state.index;
            const { panelMap, idToTitle } = state;

            // Update panel map
            const newPanelMap = { ...panelMap };
            const newIdToTitle = { ...idToTitle };

            // Update Lookups
            newIdToTitle[panelId] = title;

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

            // 2. Parse new stitches & pins
            const stitches = extractStitches(content);
            const pins = extractMapPins(content);

            const textTargets = stitches.map(s => s.target);
            const pinTargets = pins.map(p => newIdToTitle[p.targetId]).filter(t => !!t);

            const uniqueTargets = [...new Set([...textTargets, ...pinTargets])];

            // 3. Update outgoing
            const newOutgoing = { ...outgoing, [panelId]: uniqueTargets };

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

            // 4b. Add new Pin refs
            pins.forEach(pin => {
                const targetTitle = newIdToTitle[pin.targetId];
                if (!targetTitle) return;

                const targetKey = targetTitle.toLowerCase();
                if (!newIncoming[targetKey]) newIncoming[targetKey] = [];

                newIncoming[targetKey].push({
                    sourceId: panelId,
                    sourceTitle: title,
                    targetTitle: targetTitle,
                    anchor: pin.label,
                    context: `📍 Map Pin: ${pin.label}`,
                });
            });

            return {
                index: { outgoing: newOutgoing, incoming: newIncoming },
                panelMap: newPanelMap,
                idToTitle: newIdToTitle
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
