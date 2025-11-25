import { create } from 'zustand';
import { TableRegistry } from '../core/tables/types';
import { loadAndBuildRegistry } from '../core/tables/tableLoader';

interface TableStore {
  registry: TableRegistry | null;
  isLoading: boolean;
  error: string | null;
  loadTables: () => Promise<void>;
}

export const useTableStore = create<TableStore>((set) => ({
  registry: null,
  isLoading: false,
  error: null,

  loadTables: async () => {
    set({ isLoading: true, error: null });

    try {
      const registry = await loadAndBuildRegistry();
      set({ registry, isLoading: false });
    } catch (error) {
      console.error('Failed to load tables:', error);
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
    }
  },
}));
