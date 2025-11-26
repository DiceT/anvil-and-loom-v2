import { ipcMain, app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import type { Weave } from '../../src/core/weave/weaveTypes';

// ============================================================================
// Directory Paths
// ============================================================================

const CORE_WEAVES_DIR = path.join(process.cwd(), 'app', 'core-data', 'weaves');

// Lazy getter for USER_WEAVES_DIR to avoid calling app.getPath() before app is ready
function getUserWeavesDir(): string {
  return path.join(app.getPath('userData'), 'AnvilAndLoom', 'assets', 'weaves');
}

// ============================================================================
// Weave Loading
// ============================================================================

/**
 * Load all JSON files from a directory as Weaves
 */
async function loadWeavesFromDirectory(dirPath: string): Promise<Weave[]> {
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
          const data = JSON.parse(content) as Weave;
          return data;
        } catch (error) {
          console.error(`Failed to load ${file}:`, error);
          return null;
        }
      })
    );

    return results.filter((r): r is Weave => r !== null);
  } catch (error) {
    console.error(`Failed to read directory ${dirPath}:`, error);
    return [];
  }
}

/**
 * Load all Weaves from core and user directories
 * User Weaves override core Weaves with the same ID
 */
async function loadAllWeaves(): Promise<Weave[]> {
  const [coreWeaves, userWeaves] = await Promise.all([
    loadWeavesFromDirectory(CORE_WEAVES_DIR),
    loadWeavesFromDirectory(getUserWeavesDir()),
  ]);

  // Build a map with core first, then override with user
  const weaveMap = new Map<string, Weave>();

  coreWeaves.forEach((weave) => {
    weaveMap.set(weave.id, weave);
  });

  userWeaves.forEach((weave) => {
    weaveMap.set(weave.id, weave);
  });

  return Array.from(weaveMap.values());
}

// ============================================================================
// IPC Handlers
// ============================================================================

export function setupWeaveHandlers() {
  /**
   * Load all Weaves from core and user directories
   */
  ipcMain.handle('weaves:loadAll', async () => {
    try {
      const weaves = await loadAllWeaves();
      return {
        success: true,
        data: weaves,
      };
    } catch (error) {
      console.error('Failed to load weaves:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  /**
   * Save a Weave to user directory
   */
  ipcMain.handle('weaves:save', async (_event, weave: Weave) => {
    try {
      // Ensure user directory exists
      await fs.mkdir(getUserWeavesDir(), { recursive: true });

      const filePath = path.join(getUserWeavesDir(), `${weave.id}.json`);
      const content = JSON.stringify(weave, null, 2);
      await fs.writeFile(filePath, content, 'utf-8');

      return {
        success: true,
      };
    } catch (error) {
      console.error('Failed to save weave:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  /**
   * Delete a Weave from user directory
   */
  ipcMain.handle('weaves:delete', async (_event, id: string) => {
    try {
      const filePath = path.join(getUserWeavesDir(), `${id}.json`);
      await fs.unlink(filePath);

      return {
        success: true,
      };
    } catch (error) {
      console.error('Failed to delete weave:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
}
