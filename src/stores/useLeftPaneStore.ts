import { create } from 'zustand';

export type LeftPaneMode = 'tapestry' | 'tags' | 'bookmarks';

interface LeftPaneStore {
  leftPaneMode: LeftPaneMode;
  setLeftPaneMode: (mode: LeftPaneMode) => void;
  isLeftPaneCollapsed: boolean;
  setLeftPaneCollapsed: (collapsed: boolean) => void;
}

export const useLeftPaneStore = create<LeftPaneStore>((set) => ({
  leftPaneMode: 'tapestry',
  setLeftPaneMode: (mode) => set({ leftPaneMode: mode }),
  isLeftPaneCollapsed: false,
  setLeftPaneCollapsed: (collapsed) => set({ isLeftPaneCollapsed: collapsed }),
}));
