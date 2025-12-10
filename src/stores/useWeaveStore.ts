import { create } from 'zustand';
import type { Weave, WeaveRegistry, WeaveRow } from '../core/weave/weaveTypes';
import { recalculateRanges, slugify, generateRowId } from '../core/weave/weaveUtils';

interface WeaveStore {
  registry: WeaveRegistry | null;
  activeWeaveId: string | null;
  isLoading: boolean;
  error: string | null;

  loadWeaves: () => Promise<void>;
  setActiveWeave: (id: string | null) => void;

  createWeave: (partial?: { name?: string; author?: string; aspects?: string[]; domains?: string[] }) => Weave;
  updateWeave: (weave: Weave) => void;
  saveWeave: (id: string) => Promise<void>;
  deleteWeave: (id: string) => Promise<void>;
  addPackToWeave: (packId: string, type: 'aspect' | 'domain', openTabCallback?: (id: string, title: string) => void) => Promise<void>;
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
    const baseId = slugify(name) || 'weave';
    const timestamp = Date.now();
    const id = `${baseId}-${timestamp}`;
    const now = new Date().toISOString();

    const aspects = partial.aspects || [];
    const domains = partial.domains || [];
    const totalItems = aspects.length + domains.length;

    // Calculate die size (next valid size up)
    let maxRoll = 10;
    if (totalItems > 10) maxRoll = 20;
    if (totalItems > 20) maxRoll = 100;

    // Generate rows
    const rows: WeaveRow[] = [];
    let currentRowIndex = 0;

    // Add Aspects
    for (const aspectId of aspects) {
      currentRowIndex++;
      rows.push({
        id: generateRowId(),
        from: currentRowIndex,
        to: currentRowIndex,
        targetType: 'aspect',
        targetId: aspectId
      });
    }

    // Add Domains
    for (const domainId of domains) {
      currentRowIndex++;
      rows.push({
        id: generateRowId(),
        from: currentRowIndex,
        to: currentRowIndex,
        targetType: 'domain',
        targetId: domainId
      });
    }

    const newWeave: Weave = {
      id,
      name,
      author,
      maxRoll,
      rows,
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

  addPackToWeave: async (packId: string, type: 'aspect' | 'domain', openTabCallback?: (id: string, title: string) => void) => {
    const { registry, activeWeaveId, createWeave, updateWeave, saveWeave, setActiveWeave } = get();

    let weave = activeWeaveId && registry ? registry.weaves.get(activeWeaveId) : null;
    let isNew = false;

    // If no active weave, create one
    if (!weave) {
      weave = createWeave({ name: `${packId} Weave`, author: 'Unknown' });
      isNew = true;
    }

    // Add the row
    const newRow: WeaveRow = {
      id: generateRowId(),
      from: 0,
      to: 0,
      targetType: type,
      targetId: packId
    };

    const updatedRows = recalculateRanges([...weave.rows, newRow], weave.maxRoll);
    const updatedWeave = { ...weave, rows: updatedRows };

    // Save
    if (isNew) {
      setActiveWeave(updatedWeave.id);
      // newWeave is already in registry via createWeave, but we need to update with the new row
      // actually createWeave (local logic) returns a weave with rows if we pass aspects/domains,
      // but here we are passing empty and adding a row manually.
      // Let's just use updateWeave to be safe and consistent.
      updateWeave(updatedWeave);
      await saveWeave(updatedWeave.id); // Persist new weave
    } else {
      updateWeave(updatedWeave);
      await saveWeave(updatedWeave.id); // Persist update
    }

    // UI callback to open tab
    if (openTabCallback) {
      openTabCallback(updatedWeave.id, updatedWeave.name);
    }
  }
}));
