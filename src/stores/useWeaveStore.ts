/**
 * useWeaveStore - State management for Weave functionality
 *
 * Manages Weave tables, roll log, macros, and UI state.
 * Uses file system via IPC for table persistence and localStorage for macro persistence.
 */

import { create } from 'zustand';
import { WeaveService } from '../core/weave/WeaveService';
import type { Table, RollResult, RollOptions, ResultValue, TableRow } from '../types/weave';

// Validation result interface
export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

// Helper function to format result values
const formatResultValue = (result: ResultValue): string => {
  if (typeof result === 'string') {
    return result;
  } else if (typeof result === 'object' && result !== null) {
    if ('tag' in result) {
      return `[Table: ${(result as { tag: string }).tag}]`;
    } else {
      return JSON.stringify(result);
    }
  }
  return String(result);
};

// Helper function to generate preset table rows
const generatePresetRows = (preset: 'd66' | 'd88' | '2d6' | '2d8'): TableRow[] => {
  const rows: TableRow[] = [];

  if (preset === 'd66') {
    // 6 rows: 11-16, 21-26, 31-36, 41-46, 51-56, 61-66
    for (let tens = 1; tens <= 6; tens++) {
      rows.push({
        floor: tens * 10 + 1,
        ceiling: tens * 10 + 6,
        result: `Result ${tens}`,
        resultType: 'text',
      });
    }
  } else if (preset === 'd88') {
    // 8 rows: 11-18, 21-28, 31-38, 41-48, 51-58, 61-68, 71-78, 81-88
    for (let tens = 1; tens <= 8; tens++) {
      rows.push({
        floor: tens * 10 + 1,
        ceiling: tens * 10 + 8,
        result: `Result ${tens}`,
        resultType: 'text',
      });
    }
  } else if (preset === '2d6') {
    // 11 rows: 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
    for (let roll = 2; roll <= 12; roll++) {
      rows.push({
        floor: roll,
        ceiling: roll,
        result: `Result ${roll - 1}`,
        resultType: 'text',
      });
    }
  } else if (preset === '2d8') {
    // 15 rows: 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16
    for (let roll = 2; roll <= 16; roll++) {
      rows.push({
        floor: roll,
        ceiling: roll,
        result: `Result ${roll - 1}`,
        resultType: 'text',
      });
    }
  }

  return rows;
};

// Helper function to get preset table configuration
const getPresetConfig = (preset: 'd66' | 'd88' | '2d6' | '2d8') => {
  const configs = {
    d66: {
      name: 'New d66 Table',
      description: 'A d66 roll table',
      maxRoll: 66,
      dieType: 'd66',
    },
    d88: {
      name: 'New d88 Table',
      description: 'A d88 roll table',
      maxRoll: 88,
      dieType: 'd88',
    },
    '2d6': {
      name: 'New 2d6 Table',
      description: 'A 2d6 roll table',
      maxRoll: 12,
      dieType: '2d6',
    },
    '2d8': {
      name: 'New 2d8 Table',
      description: 'A 2d8 roll table',
      maxRoll: 16,
      dieType: '2d8',
    },
  };

  return configs[preset];
};

export interface MacroSlot {
  tables: string[]; // Array of table IDs
}

// LocalStorage key for macros
const MACROS_STORAGE_KEY = 'weave-macros';

// Load macros from localStorage
const loadMacrosFromStorage = (): MacroSlot[] => {
  try {
    const saved = localStorage.getItem(MACROS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate structure
      if (Array.isArray(parsed) && parsed.length === 4) {
        return parsed.map((slot: any) => ({
          tables: Array.isArray(slot.tables) ? slot.tables : []
        }));
      }
    }
  } catch (err) {
    console.error('Failed to load macros from localStorage:', err);
  }
  // Return default if loading fails
  return [{ tables: [] }, { tables: [] }, { tables: [] }, { tables: [] }];
};

const saveMacrosToStorage = (macros: MacroSlot[]) => {
  try {
    localStorage.setItem(MACROS_STORAGE_KEY, JSON.stringify(macros));
  } catch (err) {
    console.error('Failed to save macros to localStorage:', err);
  }
};

// LocalStorage key for custom categories
const CATEGORIES_STORAGE_KEY = 'weave-categories';

const loadCategoriesFromStorage = (): string[] => {
  try {
    const saved = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('Failed to load categories from localStorage:', err);
  }
  return [];
};

const saveCategoriesToStorage = (categories: string[]) => {
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  } catch (err) {
    console.error('Failed to save categories to localStorage:', err);
  }
};

interface WeaveStore {
  // Tables
  tables: Table[];
  selectedTableId: string | null;

  // Roll Log (last 100 entries)
  rollLog: RollResult[];

  // Macros (4 slots)
  macros: MacroSlot[];

  // UI State
  isLoading: boolean;
  error: string | null;
  searchQuery: string;

  // Drag-and-drop state
  draggedTableId: string | null;

  // Custom Categories (empty folders)
  customCategories: string[];

  // Actions
  loadTables: () => Promise<void>;
  selectTable: (tableId: string) => void;
  setSearchQuery: (query: string) => void;

  // Category operations
  createCategory: (name: string) => void;
  renameCategory: (oldName: string, newName: string) => Promise<void>;
  deleteCategory: (name: string) => Promise<void>;
  removeCustomCategory: (name: string) => void;

  // Table operations
  getTable: (tableId: string) => Promise<Table | null>;
  saveTable: (table: Table) => Promise<void>;
  deleteTable: (tableId: string) => Promise<void>;
  createTable: (folder: string, table: Omit<Table, 'id' | 'sourcePath'>) => Promise<Table>;
  duplicateTable: (tableId: string) => Promise<Table>;
  createPresetTable: (preset: 'd66' | 'd88' | '2d6' | '2d8') => Promise<Table>;

  // Roll operations
  rollTable: (tableId: string, options?: RollOptions, silent?: boolean) => Promise<RollResult>;
  rollMultiple: (tableIds: string[], options?: RollOptions, silent?: boolean) => Promise<RollResult[]>;
  rollMacroSlot: (slotIndex: number) => Promise<string>;
  addRollLogEntry: (result: RollResult) => void;
  clearRollLog: () => void;

  // Macro operations
  addTableToMacro: (slotIndex: number, tableId: string) => void;
  removeTableFromMacro: (slotIndex: number, tableId: string) => void;
  clearMacro: (slotIndex: number) => void;
  removeTableFromAllMacros: (tableId: string) => void;

  // Table reordering actions
  reorderTable: (tableId: string, newIndex: number) => Promise<void>;
  moveTableToCategory: (tableId: string, newCategory: string, newIndex?: number) => Promise<void>;

  // Drag-and-drop state
  setDraggedTableId: (tableId: string | null) => void;

  // Validation
  validateTable: (table: Table) => ValidationResult;

  // UI state
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useWeaveStore = create<WeaveStore>((set, get) => ({
  tables: [],
  selectedTableId: null,
  rollLog: [],
  macros: loadMacrosFromStorage(),
  isLoading: false,
  error: null,
  searchQuery: '',
  draggedTableId: null,

  loadTables: async () => {
    set({ isLoading: true, error: null });
    try {
      const tables = await WeaveService.loadTables();
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

  saveTable: async (table: Table) => {
    set({ isLoading: true, error: null });
    try {
      const response = await WeaveService.saveTable(table);
      if (response.error) {
        throw new Error(response.error);
      }

      // Update tables in store
      // CRITICAL: Only add to Weave Store if it belongs to Weave namespace
      // If the backend saved it to .environment (indicated by sourcePath), do NOT add it here.
      // (The Environment Store will pick it up via event listener).

      const isEnvironmentTable = response.table?.sourcePath?.includes('.environment');
      if (isEnvironmentTable) {
        set({ isLoading: false });
        return;
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
    set({ isLoading: true, error: null });
    try {
      const response = await WeaveService.deleteTable(tableId);
      if (response.error) {
        throw new Error(response.error);
      }

      // Remove table from store
      const { tables, selectedTableId } = get();
      const updatedTables = tables.filter(t => t.id !== tableId);
      const newSelectedTableId = selectedTableId === tableId ? null : selectedTableId;

      // Remove from all macros
      const { macros } = get();
      const updatedMacros = macros.map(macro => ({
        ...macro,
        tables: macro.tables.filter(id => id !== tableId),
      }));

      set({
        tables: updatedTables,
        selectedTableId: newSelectedTableId,
        macros: updatedMacros,
        isLoading: false
      });
      saveMacrosToStorage(updatedMacros);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete table';
      set({ error: errorMessage, isLoading: false });
      throw err;
    }
  },

  getTable: async (tableId: string) => {
    try {
      const response = await WeaveService.getTable(tableId);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.table;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get table';
      set({ error: errorMessage });
      return null;
    }
  },

  createTable: async (folder: string, table: Omit<Table, 'id' | 'sourcePath'>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await WeaveService.saveTable({
        ...table,
        id: crypto.randomUUID(),
        sourcePath: `${folder}/${table.name}.json`,
      } as Table);

      if (response.error || !response.table) {
        throw new Error(response.error || 'Failed to create table');
      }

      // Add table to store
      const { tables } = get();
      set({
        tables: [...tables, response.table],
        isLoading: false
      });

      return response.table;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create table';
      set({ error: errorMessage, isLoading: false });
      throw err;
    }
  },

  duplicateTable: async (tableId: string) => {
    const { tables } = get();
    const table = tables.find(t => t.id === tableId);

    if (!table) {
      throw new Error('Table not found');
    }

    // Generate a unique name for the duplicate
    let duplicateName = `${table.name} (Copy)`;
    let counter = 1;

    while (tables.some(t => t.name === duplicateName)) {
      counter++;
      duplicateName = `${table.name} (Copy ${counter})`;
    }

    // Create a deep copy of the table
    const duplicatedTable: Table = {
      ...table,
      id: crypto.randomUUID(),
      name: duplicateName,
      sourcePath: `${table.category || 'Uncategorized'}/${duplicateName}.json`,
      tableData: table.tableData.map(row => ({ ...row })),
    };

    // Save the duplicated table
    const response = await WeaveService.saveTable(duplicatedTable);

    if (response.error || !response.table) {
      throw new Error(response.error || 'Failed to duplicate table');
    }

    // Add duplicated table to store
    set({
      tables: [...tables, response.table],
    });

    return response.table;
  },

  createPresetTable: async (preset: 'd66' | 'd88' | '2d6' | '2d8') => {
    const { tables } = get();
    const config = getPresetConfig(preset);
    const tableData = generatePresetRows(preset);

    // Generate a unique name if one already exists
    let tableName = config.name;
    let counter = 1;

    while (tables.some(t => t.name === tableName)) {
      counter++;
      tableName = `${config.name} ${counter}`;
    }

    // Create the preset table
    const presetTable: Table = {
      id: crypto.randomUUID(),
      schemaVersion: 1,
      sourcePath: `General/${tableName}.json`,
      tableType: config.dieType,
      category: 'General',
      name: tableName,
      tags: [],
      description: config.description,
      maxRoll: config.maxRoll,
      headers: ['ROLL', 'RESULT'],
      tableData,
    };

    // Save the preset table
    const response = await WeaveService.saveTable(presetTable);

    if (response.error || !response.table) {
      throw new Error(response.error || 'Failed to create preset table');
    }

    // Add preset table to store
    set({
      tables: [...tables, response.table],
    });

    return response.table;
  },

  rollTable: async (tableId: string, options?: RollOptions, silent?: boolean) => {
    try {
      const result = await WeaveService.roll(tableId, options?.seed, silent);
      get().addRollLogEntry(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to roll table';
      set({ error: errorMessage });
      throw err;
    }
  },

  rollMultiple: async (tableIds: string[], options?: RollOptions, silent?: boolean) => {
    set({ isLoading: true, error: null });
    try {
      const results: RollResult[] = [];

      for (const tableId of tableIds) {
        try {
          const result = await WeaveService.roll(tableId, options?.seed, silent);
          results.push(result);
          get().addRollLogEntry(result);
        } catch (err) {
          // Continue rolling other tables even if one fails
          console.error(`Failed to roll table ${tableId}:`, err);
        }
      }

      set({ isLoading: false });
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to roll tables';
      set({ error: errorMessage, isLoading: false });
      throw err;
    }
  },

  rollMacroSlot: async (slotIndex: number) => {
    const { macros, tables } = get();
    if (slotIndex < 0 || slotIndex >= macros.length) {
      throw new Error('Invalid slot index');
    }

    const slot = macros[slotIndex];
    if (slot.tables.length === 0) {
      throw new Error('Macro slot is empty');
    }

    // Get actual table objects and filter out deleted tables
    const validTableIds = slot.tables.filter(tableId =>
      tables.some(t => t.id === tableId)
    );

    if (validTableIds.length === 0) {
      throw new Error('No valid tables in macro slot');
    }

    // Roll all tables in the slot
    const results = await get().rollMultiple(validTableIds);

    // Format results as combined string with "+"
    const resultStrings = results.map(result => {
      const table = tables.find(t => t.id === result.tableChain[0]);
      const tableName = table?.name || 'Unknown';
      return `${tableName}: ${formatResultValue(result.result)}`;
    });

    return resultStrings.join(' + ');
  },

  addRollLogEntry: (result: RollResult) => {
    const { rollLog } = get();
    const updatedLog = [result, ...rollLog].slice(0, 100); // Keep last 100
    set({ rollLog: updatedLog });
  },

  clearRollLog: () => {
    set({ rollLog: [] });
  },

  addTableToMacro: (slotIndex: number, tableId: string) => {
    const { macros } = get();
    if (slotIndex < 0 || slotIndex >= macros.length) return;

    const updatedMacros = [...macros];
    const slot = updatedMacros[slotIndex];

    // Don't add if already in slot
    if (slot.tables.includes(tableId)) return;

    // Max 4 tables per slot
    if (slot.tables.length >= 4) return;

    updatedMacros[slotIndex] = {
      ...slot,
      tables: [...slot.tables, tableId],
    };

    set({ macros: updatedMacros });
    saveMacrosToStorage(updatedMacros);
  },

  removeTableFromMacro: (slotIndex: number, tableId: string) => {
    const { macros } = get();
    if (slotIndex < 0 || slotIndex >= macros.length) return;

    const updatedMacros = [...macros];
    const slot = updatedMacros[slotIndex];

    updatedMacros[slotIndex] = {
      ...slot,
      tables: slot.tables.filter(id => id !== tableId),
    };

    set({ macros: updatedMacros });
    saveMacrosToStorage(updatedMacros);
  },

  clearMacro: (slotIndex: number) => {
    const { macros } = get();
    if (slotIndex < 0 || slotIndex >= macros.length) return;

    const updatedMacros = [...macros];
    updatedMacros[slotIndex] = { tables: [] };

    set({ macros: updatedMacros });
    saveMacrosToStorage(updatedMacros);
  },

  removeTableFromAllMacros: (tableId: string) => {
    const { macros } = get();
    const updatedMacros = macros.map(macro => ({
      ...macro,
      tables: macro.tables.filter(id => id !== tableId),
    }));

    set({ macros: updatedMacros });
    saveMacrosToStorage(updatedMacros);
  },

  reorderTable: async (tableId: string, newIndex: number) => {
    const { tables } = get();
    const table = tables.find(t => t.id === tableId);

    if (!table) {
      throw new Error('Table not found');
    }

    const category = table.category || 'Uncategorized';
    const tablesInCategory = tables.filter(t => (t.category || 'Uncategorized') === category);

    if (newIndex < 0 || newIndex >= tablesInCategory.length) {
      throw new Error('Invalid index');
    }

    // Calculate new position in the full tables array
    const tablesBeforeCategory = tables.filter(t => (t.category || 'Uncategorized') !== category);
    const newGlobalIndex = tablesBeforeCategory.length + newIndex;

    // Remove table from current position
    const tablesWithoutTable = tables.filter(t => t.id !== tableId);

    // Insert table at new position
    const updatedTables = [
      ...tablesWithoutTable.slice(0, newGlobalIndex),
      table,
      ...tablesWithoutTable.slice(newGlobalIndex),
    ];

    set({ tables: updatedTables });

    // Save each table to update file system order
    try {
      for (let i = 0; i < updatedTables.length; i++) {
        await WeaveService.saveTable(updatedTables[i]);
      }
    } catch (err) {
      console.error('Failed to save table order:', err);
    }
  },

  moveTableToCategory: async (tableId: string, newCategory: string, newIndex?: number) => {
    const { tables } = get();
    const table = tables.find(t => t.id === tableId);

    if (!table) {
      throw new Error('Table not found');
    }

    const oldCategory = table.category || 'Uncategorized';
    if (oldCategory === newCategory) {
      return;
    }

    // Update table's category
    const updatedTable = {
      ...table,
      category: newCategory,
    };

    // Remove table from current position
    const tablesWithoutTable = tables.filter(t => t.id !== tableId);

    // Calculate new position
    const tablesInNewCategory = tablesWithoutTable.filter(t => (t.category || 'Uncategorized') === newCategory);
    const insertIndex = newIndex !== undefined ? newIndex : tablesInNewCategory.length;

    const tablesBeforeNewCategory = tablesWithoutTable.filter(t => (t.category || 'Uncategorized') !== newCategory);
    const newGlobalIndex = tablesBeforeNewCategory.length + insertIndex;

    // Insert table at new position
    const updatedTables = [
      ...tablesWithoutTable.slice(0, newGlobalIndex),
      updatedTable,
      ...tablesWithoutTable.slice(newGlobalIndex),
    ];

    set({ tables: updatedTables });

    // Remove from custom categories if applied (it becomes real now)
    get().removeCustomCategory(newCategory);

    // Save the updated table to file system
    try {
      await WeaveService.saveTable(updatedTable);
    } catch (err) {
      console.error('Failed to save table category change:', err);
      throw err;
    }
  },

  // Custom Category Implementation
  customCategories: loadCategoriesFromStorage(),

  createCategory: (name: string) => {
    const { customCategories, tables } = get();
    if (customCategories.includes(name) || tables.some(t => (t.category || 'Uncategorized') === name)) {
      return;
    }
    set({ customCategories: [...customCategories, name].sort() });
    saveCategoriesToStorage([...customCategories, name].sort());
  },

  removeCustomCategory: (name: string) => {
    const { customCategories } = get();
    if (customCategories.includes(name)) {
      const newCats = customCategories.filter(c => c !== name);
      set({ customCategories: newCats });
      saveCategoriesToStorage(newCats);
    }
  },

  renameCategory: async (oldName: string, newName: string) => {
    const { tables, customCategories } = get();

    if (customCategories.includes(oldName)) {
      const newCats = customCategories.map(c => c === oldName ? newName : c).sort();
      set({ customCategories: newCats });
      saveCategoriesToStorage(newCats);
    }

    const tablesInCat = tables.filter(t => (t.category || 'Uncategorized') === oldName);
    for (const table of tablesInCat) {
      await get().moveTableToCategory(table.id, newName);
    }

    // Create new custom category if empty rename (edge case)
    if (tablesInCat.length === 0 && !customCategories.includes(newName)) {
      get().createCategory(newName);
    }
    get().removeCustomCategory(oldName);
  },

  deleteCategory: async (name: string) => {
    const { tables, customCategories } = get();
    if (customCategories.includes(name)) {
      const newCats = customCategories.filter(c => c !== name);
      set({ customCategories: newCats });
      saveCategoriesToStorage(newCats);
    }

    const tablesInCat = tables.filter(t => (t.category || 'Uncategorized') === name);
    for (const table of tablesInCat) {
      await get().moveTableToCategory(table.id, 'Uncategorized');
    }
  },

  setDraggedTableId: (tableId: string | null) => {
    set({ draggedTableId: tableId });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },

  validateTable: (table: Table): ValidationResult => {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check for no rows (error - not rollable)
    if (table.tableData.length === 0) {
      errors.push('Table has no rows');
      return { valid: false, warnings, errors };
    }

    // Check for invalid die type (error)
    const validDieTypes = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd66', 'd88', 'd100', '2d6', '2d8', '2d10'];
    const dieType = table.tableType || `d${table.maxRoll}`;
    if (!validDieTypes.includes(dieType)) {
      errors.push(`Invalid die type: ${dieType}`);
    }

    // Check for gaps in roll ranges (error - not rollable)
    // Different table types have different starting values
    const sortedRows = [...table.tableData].sort((a, b) => a.floor - b.floor);

    // Determine expected starting value based on table type
    let expectedNext: number;
    let maxValidRoll: number;
    const dieTypeForRange = table.tableType || `d${table.maxRoll}`;

    if (table.maxRoll === 66 || dieTypeForRange === 'd66') {
      // d66: starts at 11, max is 66
      expectedNext = 11;
      maxValidRoll = 66;
    } else if (table.maxRoll === 88 || dieTypeForRange === 'd88') {
      // d88: starts at 11, max is 88
      expectedNext = 11;
      maxValidRoll = 88;
    } else if (dieTypeForRange === '2d6') {
      // 2d6: starts at 2, max is 12
      expectedNext = 2;
      maxValidRoll = 12;
    } else if (dieTypeForRange === '2d8') {
      // 2d8: starts at 2, max is 16
      expectedNext = 2;
      maxValidRoll = 16;
    } else {
      // Standard dice: start at 1
      expectedNext = 1;
      maxValidRoll = table.maxRoll;
    }

    // Skip gap checking for d66/d88 - they use non-contiguous ranges (11,12,13,14,15,16, 21,22,...)
    if (table.maxRoll !== 66 && table.maxRoll !== 88) {
      for (const row of sortedRows) {
        if (row.floor > expectedNext) {
          errors.push(`Gap in roll range: ${expectedNext}-${row.floor - 1} not covered`);
        }
        expectedNext = row.ceiling + 1;
      }

      if (expectedNext <= maxValidRoll) {
        errors.push(`Gap in roll range: ${expectedNext}-${maxValidRoll} not covered`);
      }
    }

    // Check for overlapping ranges (warning)
    const ranges: Array<{ floor: number; ceiling: number }> = [];
    for (const row of table.tableData) {
      for (const existing of ranges) {
        if (!(row.ceiling < existing.floor || row.floor > existing.ceiling)) {
          warnings.push(`Overlapping range: ${row.floor}-${row.ceiling} overlaps with ${existing.floor}-${existing.ceiling}`);
        }
      }
      ranges.push({ floor: row.floor, ceiling: row.ceiling });
    }

    // Check for empty results (warning)
    for (let i = 0; i < table.tableData.length; i++) {
      const row = table.tableData[i];
      if (row.result === '' || row.result === null || row.result === undefined) {
        warnings.push(`Empty result at row ${i + 1} (${row.floor}-${row.ceiling})`);
      }
    }

    // Table is valid if there are no errors
    const valid = errors.length === 0;

    return { valid, warnings, errors };
  },
}));
