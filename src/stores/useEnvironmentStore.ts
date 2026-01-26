/**
 * useEnvironmentStore
 * 
 * State management for the Environment tool.
 * Similar to useWeaveStore but restricted to Aspect/Domain categories.
 */

import { create } from 'zustand';
import { EnvironmentService } from '../core/weave/EnvironmentService';
import type { Table, RollResult, RollOptions } from '../types/weave';

export interface ValidationResult {
    valid: boolean;
    warnings: string[];
    errors: string[];
}

interface EnvironmentStore {
    tables: Table[];
    selectedTableId: string | null;
    rollLog: RollResult[];
    isLoading: boolean;
    error: string | null;
    searchQuery: string;

    // Actions
    loadTables: () => Promise<void>;
    selectTable: (tableId: string) => void;
    setSearchQuery: (query: string) => void;

    saveTable: (table: Table) => Promise<void>;
    deleteTable: (tableId: string) => Promise<void>;
    createTable: (folder: string) => Promise<Table>;
    createAspect: (name: string) => Promise<void>;
    createDomain: (name: string) => Promise<void>;

    // Roll operations
    rollTable: (tableId: string, options?: RollOptions, silent?: boolean) => Promise<RollResult>;
    addRollLogEntry: (result: RollResult) => void;
    clearRollLog: () => void;

    validateTable: (table: Table) => ValidationResult;
    moveTableToCategory: (tableId: string, newCategory: string) => Promise<void>;

    // Folder Management
    openFolders: Record<string, boolean>;
    toggleFolder: (folderId: string) => void;
    expandFolder: (folderId: string) => void;
    setOpenFolders: (folders: Record<string, boolean>) => void;
}

export const useEnvironmentStore = create<EnvironmentStore>((set, get) => ({
    tables: [],
    selectedTableId: null,
    rollLog: [],
    isLoading: false,
    error: null,
    searchQuery: '',
    openFolders: {},

    loadTables: async () => {
        set({ isLoading: true, error: null });
        try {
            const tables = await EnvironmentService.loadTables();
            set({ tables, isLoading: false });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load tables';
            set({ error: errorMessage, isLoading: false });
        }
    },

    selectTable: (tableId: string) => {
        set({ selectedTableId: tableId });
    },

    setSearchQuery: (query: string) => {
        set({ searchQuery: query });
    },

    toggleFolder: (folderId: string) => {
        set(state => ({
            openFolders: {
                ...state.openFolders,
                [folderId]: !state.openFolders[folderId]
            }
        }));
    },

    expandFolder: (folderId: string) => {
        set(state => ({
            openFolders: {
                ...state.openFolders,
                [folderId]: true
            }
        }));
    },

    setOpenFolders: (folders: Record<string, boolean>) => {
        set({ openFolders: folders });
    },

    saveTable: async (table: Table) => {
        set({ isLoading: true, error: null });
        try {
            const response = await EnvironmentService.saveTable(table);
            if (response.error) {
                throw new Error(response.error);
            }

            const { tables } = get();
            const exists = tables.some(t => t.id === table.id);
            const updatedTables = exists
                ? tables.map(t => t.id === table.id ? table : t)
                : [...tables, table];

            set({ tables: updatedTables, isLoading: false });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to save table';
            set({ error: errorMessage, isLoading: false });
            throw err;
        }
    },

    deleteTable: async (tableId: string) => {
        try {
            const response = await EnvironmentService.deleteTable(tableId);
            if (response.error) throw new Error(response.error);

            const { tables, selectedTableId } = get();
            set({
                tables: tables.filter(t => t.id !== tableId),
                selectedTableId: selectedTableId === tableId ? null : selectedTableId
            });
        } catch (err) {
            set({ error: String(err) });
        }
    },

    createTable: async (folder: string) => {
        set({ isLoading: true, error: null });
        try {
            const newTable: Table = {
                id: crypto.randomUUID(),
                schemaVersion: 1,
                sourcePath: '', // Backend handles this
                name: `New ${folder} Table`,
                category: folder,
                description: '',
                maxRoll: 20,
                tableType: 'd20',
                headers: ['ROLL', 'RESULT'],
                tableData: [],
                tags: []
            };

            const response = await EnvironmentService.saveTable(newTable);
            if (response.error || !response.table) throw new Error(response.error);

            const { tables } = get();
            set({ tables: [...tables, response.table], isLoading: false });
            return response.table;
        } catch (err) {
            set({ error: String(err), isLoading: false });
            throw err;
        }
    },

    createAspect: async (name: string) => {
        set({ isLoading: true, error: null });
        try {
            const category = `Aspect - ${name}`;
            const templates = ['Atmosphere', 'Manifestation', 'Objective', 'Discovery', 'Bane', 'Boon'];
            const rows = Array.from({ length: 50 }, (_, i) => ({
                floor: (i * 2) + 1,
                ceiling: (i * 2) + 2,
                result: '',
                resultType: 'text' as const
            }));

            for (const template of templates) {
                const newTable: Table = {
                    id: crypto.randomUUID(),
                    schemaVersion: 1,
                    sourcePath: '',
                    name: template,
                    category: category,
                    description: `${name} ${template}`,
                    maxRoll: 100,
                    tableType: 'd100',
                    headers: ['d100', 'Result'],
                    tableData: rows,
                    tags: ['Aspect', name]
                };
                await EnvironmentService.saveTable(newTable);
            }

            // Reload to get all new tables
            await get().loadTables();
            // Auto expand
            get().expandFolder(`aspect-${name}`);
        } catch (err) {
            set({ error: String(err), isLoading: false });
            throw err;
        }
    },

    createDomain: async (name: string) => {
        set({ isLoading: true, error: null });
        try {
            const category = `Domain - ${name}`;
            const templates = ['Atmosphere', 'Location', 'Objective', 'Discovery', 'Bane', 'Boon'];
            const rows = Array.from({ length: 50 }, (_, i) => ({
                floor: (i * 2) + 1,
                ceiling: (i * 2) + 2,
                result: '',
                resultType: 'text' as const
            }));

            for (const template of templates) {
                const newTable: Table = {
                    id: crypto.randomUUID(),
                    schemaVersion: 1,
                    sourcePath: '',
                    name: template,
                    category: category,
                    description: `${name} ${template}`,
                    maxRoll: 100,
                    tableType: 'd100',
                    headers: ['d100', 'Result'],
                    tableData: rows,
                    tags: ['Domain', name]
                };
                await EnvironmentService.saveTable(newTable);
            }

            await get().loadTables();
            get().expandFolder(`domain-${name}`);
        } catch (err) {
            set({ error: String(err), isLoading: false });
            throw err;
        }
    },

    moveTableToCategory: async (tableId: string, newCategory: string) => {
        const { tables } = get();
        const table = tables.find(t => t.id === tableId);
        if (!table) return;

        const updatedTable = { ...table, category: newCategory };
        try {
            await EnvironmentService.saveTable(updatedTable);

            const updatedTables = tables.map(t => t.id === tableId ? updatedTable : t);
            set({ tables: updatedTables });
        } catch (err) {
            console.error('Failed to move table:', err);
        }
    },

    rollTable: async (tableId: string, options?: RollOptions, silent?: boolean) => {
        try {
            const result = await EnvironmentService.roll(tableId, options?.seed, silent);
            get().addRollLogEntry(result);
            return result;
        } catch (err) {
            throw err;
        }
    },

    addRollLogEntry: (result: RollResult) => {
        const { rollLog } = get();
        set({ rollLog: [result, ...rollLog].slice(0, 50) });
    },

    clearRollLog: () => set({ rollLog: [] }),

    validateTable: (table: Table): ValidationResult => {
        // Simplified validation for now
        return { valid: true, warnings: [], errors: [] };
    }
}));

// Subscribe to global table save events to keep environment store in sync
if (typeof window !== 'undefined') {
    window.addEventListener('weave:table-saved', ((event: CustomEvent<Table>) => {
        const table = event.detail;
        // If this table is tracked by environment store, update it
        // Check if ID exists in our store
        const state = useEnvironmentStore.getState();
        const exists = state.tables.some(t => t.id === table.id);

        // OR if it SHOULD be in our store (based on category or source path if we had access)
        // For now, if it exists, update it.
        // Also, if it's a NEW Aspect/Domain (created via other means? No, createActions handle that).
        // But what if we renamed it?

        // Simpler: Just reload tables if we suspect it might be ours.
        // Or blindly update if ID matches.
        if (exists) {
            const updatedTables = state.tables.map(t => t.id === table.id ? table : t);
            useEnvironmentStore.setState({ tables: updatedTables });
        } else {
            // If we don't have it, but it looks like an environment table?
            // Maybe we should just blindly reload if the category matches?
            if (table.category && (table.category.startsWith('Aspect - ') || table.category.startsWith('Domain - ') || table.category === 'Environment')) {
                // It belongs to us, and we don't have it (maybe created elsewhere?)
                // Reload to be safe and get correct sorting/grouping
                useEnvironmentStore.getState().loadTables();
            }
        }
    }) as EventListener);
}
