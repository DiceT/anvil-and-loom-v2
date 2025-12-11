import { create } from 'zustand';

export type TabType = 'entry' | 'weave' | 'tableforge' | 'map';

export interface Tab {
  id: string;
  type: TabType;
  title: string;
  data?: unknown; // Type-specific data (e.g., weaveId, entryPath)
}

interface TabStore {
  tabs: Tab[];
  activeTabId: string | null;

  openTab: (tab: Tab) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabTitle: (tabId: string, title: string) => void;
}

export const useTabStore = create<TabStore>((set, get) => ({
  tabs: [],
  activeTabId: null,

  openTab: (tab: Tab) => {
    const { tabs } = get();

    // Check if tab already exists
    const existingTab = tabs.find((t) => t.id === tab.id);
    if (existingTab) {
      // Just activate it
      set({ activeTabId: tab.id });
      return;
    }

    // Add new tab and activate it
    set({
      tabs: [...tabs, tab],
      activeTabId: tab.id,
    });
  },

  closeTab: (tabId: string) => {
    const { tabs, activeTabId } = get();
    const newTabs = tabs.filter((t) => t.id !== tabId);

    // If closing active tab, activate the last remaining tab
    let newActiveTabId = activeTabId;
    if (activeTabId === tabId) {
      newActiveTabId = newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null;
    }

    set({
      tabs: newTabs,
      activeTabId: newActiveTabId,
    });
  },

  setActiveTab: (tabId: string) => {
    set({ activeTabId: tabId });
  },

  updateTabTitle: (tabId: string, title: string) => {
    const { tabs } = get();
    const updatedTabs = tabs.map((t) =>
      t.id === tabId ? { ...t, title } : t
    );
    set({ tabs: updatedTabs });
  },
}));
