
import { create } from 'zustand';
import type {
    TapestryRegistry,
    TapestryConfig,
    TapestryNode,
    CreateTapestryData,
    UpdateTapestryData,
} from '../types/tapestry';
import { useStitchStore } from './useStitchStore';

interface TapestryState {
    // State
    registry: TapestryRegistry;
    activeTapestryId?: string;
    activeTapestryConfig?: TapestryConfig;
    tree?: TapestryNode;
    isLoading: boolean;
    error?: string;

    // Actions
    loadRegistry: () => Promise<void>;
    createTapestry: (data: CreateTapestryData) => Promise<string>;
    openTapestry: (id: string) => Promise<void>;
    updateTapestry: (id: string, updates: UpdateTapestryData) => Promise<void>;
    removeTapestry: (id: string) => Promise<void>;
    deleteTapestry: (id: string) => Promise<void>;
    loadTree: () => Promise<void>;
    createEntry: (title: string, category?: string) => Promise<{ id: string; path: string }>;
    clearError: () => void;

    // Tag Filtering
    activeTagFilter: string | null;
    setTagFilter: (tag: string | null) => void;
}

export const useTapestryStore = create<TapestryState>((set, get) => ({
    // Initial state
    registry: { tapestries: [] },
    isLoading: false,
    activeTagFilter: null,

    setTagFilter: (tag) => set({ activeTagFilter: tag }),

    // Load registry from disk
    loadRegistry: async () => {
        set({ isLoading: true, error: undefined });
        try {
            const registry = await window.electron.tapestry.loadRegistry();
            set({ registry, isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to load registry',
                isLoading: false
            });
        }
    },

    // Create new Tapestry
    createTapestry: async (data: CreateTapestryData) => {
        set({ isLoading: true, error: undefined });
        try {
            const id = await window.electron.tapestry.create(data);

            // Reload registry to get the new entry
            await get().loadRegistry();

            set({ isLoading: false });
            return id;
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to create tapestry',
                isLoading: false
            });
            throw error;
        }
    },

    // Open Tapestry
    openTapestry: async (id: string) => {
        set({ isLoading: true, error: undefined });
        try {
            const config = await window.electron.tapestry.open(id);

            if (!config) {
                throw new Error('Tapestry not found');
            }

            // Get tapestry path from registry
            const registry = await window.electron.tapestry.loadRegistry();
            const tapestryEntry = registry.tapestries.find(t => t.id === id);

            set({
                activeTapestryId: id,
                activeTapestryConfig: config,
                isLoading: false
            });

            // Load tree
            await get().loadTree();

            // Load Weave tables for this tapestry
            if (tapestryEntry) {
                const { WeaveService } = await import('../core/weave/WeaveService');
                await WeaveService.setTapestryPath(tapestryEntry.path);
                
                // Load tables into Weave store
                const { useWeaveStore } = await import('./useWeaveStore');
                await useWeaveStore.getState().loadTables();
            }
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to open tapestry',
                isLoading: false
            });
            throw error;
        }
    },

    // Update Tapestry metadata
    updateTapestry: async (id: string, updates: UpdateTapestryData) => {
        set({ isLoading: true, error: undefined });
        try {
            await window.electron.tapestry.update(id, updates);

            // Reload registry
            await get().loadRegistry();

            // If this is the active tapestry, reload config
            if (get().activeTapestryId === id) {
                const config = await window.electron.tapestry.open(id);
                if (config) {
                    set({ activeTapestryConfig: config });
                }
            }

            set({ isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to update tapestry',
                isLoading: false
            });
            throw error;
        }
    },

    // Remove Tapestry from registry
    removeTapestry: async (id: string) => {
        set({ isLoading: true, error: undefined });
        try {
            await window.electron.tapestry.remove(id);

            // Reload registry
            await get().loadRegistry();

            // If this was the active tapestry, clear it
            if (get().activeTapestryId === id) {
                set({
                    activeTapestryId: undefined,
                    activeTapestryConfig: undefined,
                    tree: undefined
                });
            }

            set({ isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to remove tapestry',
                isLoading: false
            });
            throw error;
        }
    },

    // Delete Tapestry from disk
    deleteTapestry: async (id: string) => {
        set({ isLoading: true, error: undefined });
        try {
            await window.electron.tapestry.delete(id);

            // Reload registry
            await get().loadRegistry();

            // If this was the active tapestry, clear it
            if (get().activeTapestryId === id) {
                set({
                    activeTapestryId: undefined,
                    activeTapestryConfig: undefined,
                    tree: undefined
                });
            }

            set({ isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to delete tapestry',
                isLoading: false
            });
            throw error;
        }
    },

    // Load tree structure
    loadTree: async () => {
        const { activeTapestryId } = get();
        if (!activeTapestryId) {
            set({ error: 'No active tapestry' });
            return;
        }

        set({ isLoading: true, error: undefined });
        try {
            const tree = await window.electron.tapestry.loadTree(activeTapestryId);
            set({ tree: tree || undefined, isLoading: false });

            // Build tag index
            if (tree) {
                const { useTagStore } = await import('./useTagStore');
                const panels: Array<{ id: string; tags?: string[] }> = [];

                const traverse = (node: TapestryNode) => {
                    if (node.type === 'entry') {
                        panels.push({ id: node.id, tags: node.tags });
                    }
                    if (node.children) {
                        node.children.forEach(traverse);
                    }
                };

                traverse(tree);
                useTagStore.getState().buildIndex(panels);
            }

            // Build stitch index
            if (activeTapestryId) {
                // We don't await this to keep UI responsive? Or maybe we should?
                // Depending on performance. For now, let's fire and forget or await if critical.
                // Stitches are critical for navigation, but maybe we can load tree first.
                useStitchStore.getState().buildIndex(activeTapestryId);
            }
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to load tree',
                isLoading: false
            });
        }
    },

    // Create new entry in the active tapestry
    createEntry: async (title: string, category: string = 'session') => {
        const { activeTapestryId, registry } = get();
        if (!activeTapestryId) {
            throw new Error('No active tapestry');
        }

        const tapestry = registry.tapestries.find(t => t.id === activeTapestryId);
        if (!tapestry) {
            throw new Error('Tapestry not found in registry');
        }

        set({ isLoading: true, error: undefined });
        try {
            // Default to root entries folder for now
            // In future we might want to allow specifying folder or use current folder
            const entriesDir = `${tapestry.path}\\entries`;

            const result = await window.electron.tapestry.createEntry(entriesDir, title, category);

            // Update stitch index
            const { useStitchStore } = await import('./useStitchStore');
            const content = '\n';
            useStitchStore.getState().updatePanel(result.id, title.trim() || 'Untitled Panel', content, result.path);

            // Reload tree
            await get().loadTree();

            set({ isLoading: false });
            return result;
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to create entry',
                isLoading: false
            });
            throw error;
        }
    },

    // Clear error
    clearError: () => set({ error: undefined }),
}));
