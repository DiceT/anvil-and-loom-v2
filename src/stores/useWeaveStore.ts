import { create } from 'zustand';
import type { Weave, WeaveRegistry } from '../core/weave/weaveTypes';
import { recalculateRanges, slugify, generateRowId } from '../core/weave/weaveUtils';

interface WeaveStore {
  registry: WeaveRegistry | null;
  activeWeaveId: string | null;
  isLoading: boolean;
  error: string | null;

  loadWeaves: () => Promise<void>;
  setActiveWeave: (id: string | null) => void;

  createWeave: (partial?: { name?: string; author?: string }) => Weave;
  updateWeave: (weave: Weave) => void;
  saveWeave: (id: string) => Promise<void>;
  deleteWeave: (id: string) => Promise<void>;
}

export const useWeaveStore = create<WeaveStore>((set, get) => ({
  registry: null,
  activeWeaveId: null,
  isLoading: false,
  error: null,

  loadWeaves: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await window.electron.weaves.loadAll();

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load weaves');
      }

      const weaveMap = new Map<string, Weave>();
      response.data.forEach((weave) => {
        weaveMap.set(weave.id, weave);
      });

      set({
        registry: { weaves: weaveMap },
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to load weaves:', error);
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
    }
  },

  setActiveWeave: (id: string | null) => {
    set({ activeWeaveId: id });
  },

  createWeave: (partial = {}) => {
    const name = partial.name || 'New Weave';
    const author = partial.author || 'Unknown';
    const id = slugify(name) || `weave-${Date.now()}`;
    const now = new Date().toISOString();

    const newWeave: Weave = {
      id,
      name,
      author,
      maxRoll: 10,
      rows: [],
      createdAt: now,
      updatedAt: now,
    };

    const { registry } = get();
    if (registry) {
      registry.weaves.set(id, newWeave);
      set({ registry: { ...registry }, activeWeaveId: id });
    }

    return newWeave;
  },

  updateWeave: (weave: Weave) => {
    const { registry } = get();
    if (registry) {
      weave.updatedAt = new Date().toISOString();
      registry.weaves.set(weave.id, weave);
      set({ registry: { ...registry } });
    }
  },

  saveWeave: async (id: string) => {
    const { registry } = get();
    if (!registry) {
      throw new Error('Registry not loaded');
    }

    const weave = registry.weaves.get(id);
    if (!weave) {
      throw new Error(`Weave ${id} not found`);
    }

    try {
      const response = await window.electron.weaves.save(weave);
      if (!response.success) {
        throw new Error(response.error || 'Failed to save weave');
      }
    } catch (error) {
      console.error('Failed to save weave:', error);
      throw error;
    }
  },

  deleteWeave: async (id: string) => {
    try {
      const response = await window.electron.weaves.delete(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete weave');
      }

      const { registry, activeWeaveId } = get();
      if (registry) {
        registry.weaves.delete(id);
        set({
          registry: { ...registry },
          activeWeaveId: activeWeaveId === id ? null : activeWeaveId
        });
      }
    } catch (error) {
      console.error('Failed to delete weave:', error);
      throw error;
    }
  },
}));
