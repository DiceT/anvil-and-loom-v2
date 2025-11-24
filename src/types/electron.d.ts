export interface ElectronAPI {
  tapestry: {
    getTree: () => Promise<unknown>;
    readEntry: (path: string) => Promise<string>;
    writeEntry: (path: string, content: string) => Promise<{ success: boolean }>;
    saveResults: (cards: unknown[]) => Promise<{ success: boolean }>;
    loadResults: () => Promise<unknown[]>;
  };
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
