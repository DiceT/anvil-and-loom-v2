import { create } from 'zustand';

interface ToolStore {
  activeTool: string | null;
  setActiveTool: (toolId: string | null) => void;
}

export const useToolStore = create<ToolStore>((set) => ({
  activeTool: null,
  setActiveTool: (toolId) => set({ activeTool: toolId }),
}));
