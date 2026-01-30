import { ipcMain } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';

// ... (stubs kept or ignored)

export function setupFileSystemHandlers() {
  // ... existing stubs ...

  // Real FS handlers
  ipcMain.handle('fs-write-file', async (_event, filePath: string, content: string) => {
    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');
      return { success: true };
    } catch (error) {
      console.error('[fs-write-file] Error:', error);
      throw error;
    }
  });

  ipcMain.handle('fs-read-file', async (_event, filePath: string) => {
    return fs.readFile(filePath, 'utf-8');
  });

  // Stubs (keep existing ones if needed, or replace if they conflict? 
  // Existing ones are 'tapestry:getTree', 'tapestry:readEntry', 'tapestry:writeEntry'. 
  // These seem distinct from 'tapestry:loadRegistry' etc in tapestry.ts.
  // So I'll just append the new handlers inside the function.

  ipcMain.handle('tapestry:getTree', async () => {
    return stubbedTapestry;
  });

  ipcMain.handle('tapestry:readEntry', async (_event, path: string) => {
    return stubbedEntries[path] || '';
  });

  ipcMain.handle(
    'tapestry:writeEntry',
    async (_event, path: string, content: string) => {
      stubbedEntries[path] = content;
      return { success: true };
    }
  );
}
