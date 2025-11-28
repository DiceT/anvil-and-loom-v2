import { create } from 'zustand';
import type {
    TapestryRegistry,
    TapestryRegistryEntry,
    TapestryConfig,
    TapestryNode,
    CreateTapestryData,
    UpdateTapestryData,
} from '../types/tapestry';

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
    clearError: () => void;
}

export const useTapestryStore = create<TapestryState>((set, get) => ({
    // Initial state
    registry: { tapestries: [] },
    isLoading: false,

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

            set({
                activeTapestryId: id,
                activeTapestryConfig: config,
                isLoading: false
            });

            // Load tree
            await get().loadTree();
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
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to load tree',
                isLoading: false
            });
        }
    },

    // Clear error
    clearError: () => set({ error: undefined }),
}));
