import { ipcMain, app } from 'electron';
import path from 'path';
import fs from 'fs/promises';

// ============================================================================
// Directory Paths
// ============================================================================

const CORE_TABLES_DIR = path.join(process.cwd(), 'app', 'core-data', 'tables');

// Lazy getter for USER_DATA_DIR to avoid calling app.getPath() before app is ready
function getUserDataDir(): string {
  return path.join(app.getPath('userData'), 'AnvilAndLoom', 'assets', 'tables');
}

// ============================================================================
// Table Loading
// ============================================================================

/**
 * Load all JSON files from a directory with metadata
 */
async function loadJsonFilesFromDirectory(
  dirPath: string
): Promise<Array<{ filename: string; data: unknown }>> {
  try {
    await fs.access(dirPath);
  } catch {
    // Directory doesn't exist
    return [];
  }

  try {
    const files = await fs.readdir(dirPath);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));

    const results = await Promise.all(
      jsonFiles.map(async (file) => {
        try {
          const filePath = path.join(dirPath, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const data = JSON.parse(content);
          // Extract filename without extension
          const filename = path.basename(file, '.json');
          return { filename, data };
        } catch (error) {
          console.error(`Failed to load ${file}:`, error);
          return null;
        }
      })
    );

    return results.filter((r): r is { filename: string; data: unknown } => r !== null);
  } catch (error) {
    console.error(`Failed to read directory ${dirPath}:`, error);
    return [];
  }
}

/**
 * Load all tables from core and user directories
 */
async function loadAllTables() {
  const [
    coreAspects,
    coreDomains,
    coreOracles,
    coreOraclesMore,
    userAspects,
    userDomains,
    userOracles,
    userOraclesMore
  ] = await Promise.all([
    loadJsonFilesFromDirectory(path.join(CORE_TABLES_DIR, 'aspects')),
    loadJsonFilesFromDirectory(path.join(CORE_TABLES_DIR, 'domains')),
    loadJsonFilesFromDirectory(path.join(CORE_TABLES_DIR, 'oracles')),
    loadJsonFilesFromDirectory(path.join(CORE_TABLES_DIR, 'oracles', 'more')),
    loadJsonFilesFromDirectory(path.join(getUserDataDir(), 'aspects')),
    loadJsonFilesFromDirectory(path.join(getUserDataDir(), 'domains')),
    loadJsonFilesFromDirectory(path.join(getUserDataDir(), 'oracles')),
    loadJsonFilesFromDirectory(path.join(getUserDataDir(), 'oracles', 'more')),
  ]);

  return {
    aspects: {
      core: coreAspects,
      user: userAspects,
    },
    domains: {
      core: coreDomains,
      user: userDomains,
    },
    oracles: {
      core: coreOracles,
      coreMore: coreOraclesMore,
      user: userOracles,
      userMore: userOraclesMore,
    },
  };
}

// ============================================================================
// IPC Handlers
// ============================================================================

export function setupTableHandlers() {
  /**
   * Load all tables from core and user directories
   */
  ipcMain.handle('tables:loadAll', async () => {
    try {
      const tables = await loadAllTables();
      return {
        success: true,
        data: tables,
      };
    } catch (error) {
      console.error('Failed to load tables:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  /**
   * Get the user tables directory path
   */
  ipcMain.handle('tables:getUserDir', async () => {
    return getUserDataDir();
  });

  /**
   * Save a Forge file (Aspect or Domain) to a user-chosen location
   */
  ipcMain.handle('tables:saveForgeFile', async (event, { category, filename, data }) => {
    try {
      const { dialog, BrowserWindow } = await import('electron');
      const win = BrowserWindow.fromWebContents(event.sender);

      if (!win) {
        return { success: false, error: 'Window not found' };
      }

      const result = await dialog.showSaveDialog(win, {
        title: 'Save Table Forge File',
        defaultPath: `${filename}.json`,
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (result.canceled || !result.filePath) {
        return { success: false, error: 'Save cancelled' };
      }

      await fs.writeFile(result.filePath, JSON.stringify(data, null, 2), 'utf-8');

      return { success: true, path: result.filePath };
    } catch (error) {
      console.error('Failed to save forge file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });
}
