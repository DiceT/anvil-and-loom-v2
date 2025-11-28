import { create } from 'zustand';
import type { LayoutData } from 'rc-dock';
import { defaultLayout } from '../lib/docking/defaultLayout';
import type { LayoutState } from '../lib/docking/types';

interface DockingStore {
    layoutState: LayoutState;

    // Actions
    updateLayout: (layout: LayoutData) => void;
    resetLayout: () => void;
    saveLayout: () => Promise<void>;
    loadLayout: () => Promise<void>;
}

export const useDockingStore = create<DockingStore>((set, get) => ({
    layoutState: {
        version: '1.0.1',
        layout: defaultLayout,
        openPanels: ['tapestry', 'editor', 'tools'],
    },

    updateLayout: (layout: LayoutData) => {
        set((state) => ({
            layoutState: {
                ...state.layoutState,
                layout,
            },
        }));
        // Auto-save on change (debounce could be added later)
        get().saveLayout();
    },

    resetLayout: () => {
        set({
            layoutState: {
                version: '1.0.1',
                layout: defaultLayout,
                openPanels: ['tapestry', 'editor', 'tools'],
            },
        });
        get().saveLayout();
    },

    saveLayout: async () => {
        const { layoutState } = get();
        try {
            // TODO: Implement IPC call to save to disk
            // await window.electron.settings.saveLayout(layoutState);
            localStorage.setItem('anvil_dock_layout', JSON.stringify(layoutState));
        } catch (error) {
            console.error('Failed to save layout:', error);
        }
    },

    loadLayout: async () => {
        try {
            // TODO: Implement IPC call to load from disk
            // const saved = await window.electron.settings.loadLayout();
            const saved = localStorage.getItem('anvil_dock_layout');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Simple version check
                if (parsed.version === '1.0.1') {
                    set({ layoutState: parsed });
                }
            }
        } catch (error) {
            console.error('Failed to load layout:', error);
        }
    },
}));
