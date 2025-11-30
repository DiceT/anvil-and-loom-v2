import { create } from 'zustand';

interface PaneStore {
  isRightPaneCollapsed: boolean;
  setRightPaneCollapsed: (collapsed: boolean) => void;
  leftPaneWidth: number;
  setLeftPaneWidth: (width: number) => void;
  rightPaneWidth: number;
  setRightPaneWidth: (width: number) => void;
}

export const usePaneStore = create<PaneStore>((set) => ({
  isRightPaneCollapsed: false,
  setRightPaneCollapsed: (collapsed) => set({ isRightPaneCollapsed: collapsed }),
  leftPaneWidth: 280,
  setLeftPaneWidth: (width) => set({ leftPaneWidth: width }),
  rightPaneWidth: 320,
  setRightPaneWidth: (width) => set({ rightPaneWidth: width }),
}));
