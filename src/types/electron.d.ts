import type { Weave } from '../core/weave/weaveTypes';
import type {
  TapestryRegistry,
  TapestryConfig,
  TapestryNode,
  EntryDoc,
  CreateTapestryData,
  UpdateTapestryData,
} from './tapestry';

export interface ElectronAPI {
  tapestry: {
    // Registry management
    loadRegistry: () => Promise<TapestryRegistry>;
    create: (data: CreateTapestryData) => Promise<string>;
    open: (id: string) => Promise<TapestryConfig | null>;
    update: (id: string, updates: UpdateTapestryData) => Promise<void>;
    remove: (id: string) => Promise<void>;
    delete: (id: string) => Promise<void>;

    // Tree management
    loadTree: (tapestryId: string) => Promise<TapestryNode | null>;

    // Entry management
    loadEntry: (path: string) => Promise<EntryDoc | null>;
    saveEntry: (entry: EntryDoc) => Promise<void>;
    createEntry: (parentPath: string, title: string, category: string) => Promise<{ id: string; path: string }>;

    // File operations
    createFolder: (parentPath: string, name: string) => Promise<void>;
    rename: (oldPath: string, newName: string) => Promise<string>;
    deleteNode: (path: string) => Promise<void>;
    move: (sourcePath: string, destinationFolder: string, itemName: string) => Promise<void>;
    updateOrder: (folderPath: string, order: string[]) => Promise<void>;
    pickImage: (defaultPath?: string) => Promise<string | null>;
    getAllPanels: (tapestryId: string) => Promise<Array<{ id: string; title: string; content: string; path: string }>>;
  };
  tables: {
    loadAll: () => Promise<{
      success: boolean;
      data?: {
        aspects: {
          core: Array<{ filename: string; data: unknown }>;
          user: Array<{ filename: string; data: unknown }>;
        };
        domains: {
          core: Array<{ filename: string; data: unknown }>;
          user: Array<{ filename: string; data: unknown }>;
        };
        oracles: {
          core: Array<{ filename: string; data: unknown }>;
          user: Array<{ filename: string; data: unknown }>;
        };
      };
      error?: string;
    }>;
    getUserDir: () => Promise<string>;
    saveForgeFile: (category: string, filename: string, data: any) => Promise<{ success: boolean; path?: string; error?: string }>;
  };
  weaves: {
    loadAll: () => Promise<{ success: boolean; data?: Weave[]; error?: string }>;
    save: (weave: Weave) => Promise<{ success: boolean; error?: string }>;
    delete: (id: string) => Promise<{ success: boolean; error?: string }>;
  };
  settings: {
    saveLayout: (layout: any) => Promise<{ success: boolean; error?: string }>;
    loadLayout: () => Promise<any>;
    resetLayout: () => Promise<{ success: boolean }>;
  };
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
