import { create } from 'zustand';

export type RightPaneMode = 'dice' | 'results' | 'stitchboard' | 'weave' | 'environment';

interface ToolStore {
  activeTool: string | null;
  setActiveTool: (toolId: string | null) => void;
  rightPaneMode: RightPaneMode;
  setRightPaneMode: (mode: RightPaneMode) => void;
  requestExpandPack: string | null;
  setRequestExpandPack: (packId: string | null) => void;
  isRingOpen: boolean;
  toggleRing: () => void;
}

export const useToolStore = create<ToolStore>((set) => ({
  activeTool: null,
  setActiveTool: (toolId) => set({ activeTool: toolId }),
  rightPaneMode: 'dice',
  setRightPaneMode: (mode) => set({ rightPaneMode: mode }),
  requestExpandPack: null,
  setRequestExpandPack: (packId) => set({ requestExpandPack: packId }),
  isRingOpen: false,
  toggleRing: () => set((state) => ({ isRingOpen: !state.isRingOpen })),
}));
