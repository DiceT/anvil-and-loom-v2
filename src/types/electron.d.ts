import type {
  TapestryRegistry,
  TapestryConfig,
  TapestryNode,
  EntryDoc,
  CreateTapestryData,
  UpdateTapestryData,
} from './tapestry';
import type {
  Table,
  RollResult,
  WeaveTableListResponse,
  WeaveTableResponse,
  WeaveSaveTableResponse,
  WeaveDeleteTableResponse,
  WeaveRollResponse,
  WeaveSetTapestryPathResponse,
} from './weave';

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
    createFolder: (parentPath: string, name: string) => Promise<void>;
    rename: (oldPath: string, newName: string) => Promise<string>;
    deleteNode: (path: string) => Promise<void>;
    move: (sourcePath: string, destinationFolder: string, itemName: string) => Promise<void>;
    updateOrder: (folderPath: string, order: string[]) => Promise<void>;
    pickImage: (defaultPath?: string) => Promise<string | null>;
    getAllPanels: (tapestryId: string) => Promise<Array<{ id: string; title: string; content: string; path: string }>>;
  };
  weave: {
    // Tapestry path management
    setTapestryPath: (path: string) => Promise<WeaveSetTapestryPathResponse>;
    
    // Table management
    getTables: () => Promise<WeaveTableListResponse>;
    getTable: (tableId: string) => Promise<WeaveTableResponse>;
    saveTable: (table: Table) => Promise<WeaveSaveTableResponse>;
    deleteTable: (tableId: string) => Promise<WeaveDeleteTableResponse>;
    
    // Rolling
    rollTable: (tableId: string, seed?: string) => Promise<WeaveRollResponse>;
  };
  ipcRenderer: {
    invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
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
