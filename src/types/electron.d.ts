export interface ElectronAPI {
  tapestry: {
    getTree: () => Promise<unknown>;
    readEntry: (path: string) => Promise<string>;
    writeEntry: (path: string, content: string) => Promise<{ success: boolean }>;
    saveResults: (cards: unknown[]) => Promise<{ success: boolean }>;
    loadResults: () => Promise<unknown[]>;
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
  };
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
