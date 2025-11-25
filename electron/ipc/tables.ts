import { ipcMain, app } from 'electron';
import path from 'path';
import fs from 'fs/promises';

// ============================================================================
// Directory Paths
// ============================================================================

const CORE_TABLES_DIR = path.join(process.cwd(), 'app', 'core-data', 'tables');
const USER_DATA_DIR = app.getPath('userData');
const USER_TABLES_DIR = path.join(USER_DATA_DIR, 'AnvilAndLoom', 'assets', 'tables');

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
  const [coreAspects, coreDomains, coreOracles, userAspects, userDomains, userOracles] =
    await Promise.all([
      loadJsonFilesFromDirectory(path.join(CORE_TABLES_DIR, 'aspects')),
      loadJsonFilesFromDirectory(path.join(CORE_TABLES_DIR, 'domains')),
      loadJsonFilesFromDirectory(path.join(CORE_TABLES_DIR, 'oracles')),
      loadJsonFilesFromDirectory(path.join(USER_TABLES_DIR, 'aspects')),
      loadJsonFilesFromDirectory(path.join(USER_TABLES_DIR, 'domains')),
      loadJsonFilesFromDirectory(path.join(USER_TABLES_DIR, 'oracles')),
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
      user: userOracles,
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
    return USER_TABLES_DIR;
  });
}
