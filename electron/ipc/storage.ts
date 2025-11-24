import { ipcMain } from 'electron';

// Stubbed in-memory storage for Results
// In a real implementation, this would save/load from /.anvil-loom/results.json
let resultsCache: unknown[] = [];

export function setupStorageHandlers() {
  ipcMain.handle('tapestry:saveResults', async (_event, cards: unknown[]) => {
    resultsCache = cards;
    // TODO: Write to /.anvil-loom/results.json when real FS is implemented
    return { success: true };
  });

  ipcMain.handle('tapestry:loadResults', async () => {
    // TODO: Read from /.anvil-loom/results.json when real FS is implemented
    return resultsCache;
  });
}
